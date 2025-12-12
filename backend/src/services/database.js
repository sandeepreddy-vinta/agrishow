/**
 * Database Manager Service
 * Handles persistence using Google Cloud Firestore
 * Maintains compatibility with existing transaction pattern
 */

const { Firestore } = require('@google-cloud/firestore');

class DatabaseManager {
    constructor() {
        this.firestore = new Firestore();
        this.collectionName = 'system';
        this.docId = 'main';
        this.docRef = this.firestore.collection(this.collectionName).doc(this.docId);
        
        // In-memory cache for fast reads (optional, but helpful for read-heavy/write-rare)
        // However, for stateless Cloud Run, we should fetch fresh data often or rely on Firestore's consistency.
        // To minimize reads, we can cache, but we must invalidate on write.
        this.cache = null;
        this.lastFetch = 0;
        this.CACHE_TTL = 5000; // 5 seconds cache
        this.initialized = false;
        this.initPromise = null;
    }

    async init() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            try {
                const doc = await this.docRef.get();
                if (!doc.exists) {
                    console.log('[DB] No database found in Firestore. Initializing new database...');
                    const emptyDb = this.getEmptyDatabase();
                    await this.docRef.set(emptyDb);
                    this.cache = emptyDb;
                } else {
                    console.log('[DB] Connected to Firestore. Database loaded.');
                    this.cache = doc.data();
                }
                this.lastFetch = Date.now();
                this.initialized = true;
                return this;
            } catch (err) {
                console.error('[DB] Failed to connect to Firestore:', err);
                this.initPromise = null; // Allow retry
                throw err;
            }
        })();
        
        return this.initPromise;
    }
    
    async ensureInitialized() {
        if (!this.initialized) {
            console.log('[DB] ensureInitialized: not initialized, calling init()...');
            try {
                await this.init();
            } catch (err) {
                console.error('[DB] ensureInitialized failed:', err.message);
                throw err;
            }
        }
    }

    getEmptyDatabase() {
        return {
            franchises: [],
            content: [],
            assignments: {},
            analytics: [],
            _metadata: { version: 1, createdAt: new Date().toISOString() },
        };
    }

    /**
     * Load data from Firestore (or cache)
     * Returns a PROMISE now (breaking change for synchronous callers)
     */
    async load() {
        // Ensure database is initialized
        await this.ensureInitialized();
        
        // If we have fresh cache, use it
        if (this.cache && (Date.now() - this.lastFetch < this.CACHE_TTL)) {
            return JSON.parse(JSON.stringify(this.cache));
        }

        try {
            const doc = await this.docRef.get();
            if (!doc.exists) {
                // Should not happen if init() ran, but handle gracefully
                return this.getEmptyDatabase();
            }
            this.cache = doc.data();
            this.lastFetch = Date.now();
            return JSON.parse(JSON.stringify(this.cache));
        } catch (err) {
            console.error('[DB] Failed to load data:', err);
            throw err;
        }
    }

    /**
     * Transactional update
     * callback(data) -> result
     * result can be { data: returnedValue, audit: { action, details } }
     */
    async transact(callback) {
        // Ensure database is initialized before transacting
        await this.ensureInitialized();
        
        try {
            let result;
            let auditEntry;

            await this.firestore.runTransaction(async (t) => {
                const doc = await t.get(this.docRef);
                const currentData = doc.exists ? doc.data() : this.getEmptyDatabase();
                
                // Deep copy for the callback to modify
                const dataProxy = JSON.parse(JSON.stringify(currentData));

                // Run business logic
                const callbackResult = callback(dataProxy);
                
                // Handle different return types from callback
                // 1. { data: ..., audit: ... }
                // 2. data
                if (callbackResult && typeof callbackResult === 'object' && callbackResult.audit) {
                    result = callbackResult.data;
                    auditEntry = callbackResult.audit;
                } else {
                    result = callbackResult;
                }

                // Update metadata
                dataProxy._metadata = dataProxy._metadata || {};
                dataProxy._metadata.lastModified = new Date().toISOString();

                // Commit to Firestore
                t.set(this.docRef, dataProxy);
                
                // Update Cache
                this.cache = dataProxy;
                this.lastFetch = Date.now();
            });

            // Log audit asynchronously if needed (or separate collection)
            if (auditEntry) {
                this.logAudit(auditEntry.action, auditEntry.details);
            }

            return result;
        } catch (err) {
            console.error('[DB] Transaction failed:', err);
            throw err;
        }
    }

    /**
     * Log to a separate collection 'audit_logs'
     */
    async logAudit(action, details) {
        try {
            await this.firestore.collection('audit_logs').add({
                action,
                details,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('[Audit] Failed to write log:', err);
        }
    }
}

module.exports = DatabaseManager;
