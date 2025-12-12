/**
 * Database Manager Service
 * Handles persistence using Google Cloud Firestore
 * Maintains compatibility with existing transaction pattern
 */

const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
    constructor() {
        const bundledKeyPath = path.join(__dirname, '../../../service-account-key.json');
        const envCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const envCredsMissing = envCredsPath && !fs.existsSync(envCredsPath);

        if (( !envCredsPath || envCredsMissing ) && fs.existsSync(bundledKeyPath)) {
            process.env.GOOGLE_APPLICATION_CREDENTIALS = bundledKeyPath;
            console.log('[DB] GOOGLE_APPLICATION_CREDENTIALS set to bundled key:', bundledKeyPath);
            if (envCredsMissing) {
                console.log('[DB] Previous GOOGLE_APPLICATION_CREDENTIALS was missing:', envCredsPath);
            }
        }

        let projectId = process.env.FIRESTORE_PROJECT_ID;
        if (!projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
            try {
                const raw = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && parsed.project_id) {
                    projectId = parsed.project_id;
                }
            } catch (e) {
                // ignore
            }
        }

        const firestoreOptions = {};
        if (projectId) {
            firestoreOptions.projectId = projectId;
        }

        this.firestore = Object.keys(firestoreOptions).length ? new Firestore(firestoreOptions) : new Firestore();

        console.log('[DB] Firestore init env:', {
            FIRESTORE_PROJECT_ID: process.env.FIRESTORE_PROJECT_ID,
            GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
            GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            resolvedProjectId: projectId,
        });
        this.collectionName = 'system';
        this.docId = 'main';
        this.docRef = this.firestore.collection(this.collectionName).doc(this.docId);
        
        // Separate collection for OTP tokens (more reliable for Cloud Run)
        this.otpCollection = this.firestore.collection('otp_tokens');
        
        // In-memory cache for fast reads (optional, but helpful for read-heavy/write-rare)
        // However, for stateless Cloud Run, we should fetch fresh data often or rely on Firestore's consistency.
        // To minimize reads, we can cache, but we must invalidate on write.
        this.cache = null;
        this.lastFetch = 0;
        this.CACHE_TTL = 5000; // 5 seconds cache
        this.initialized = false;
        this.initPromise = null;
    }
    
    // OTP-specific methods using separate collection
    async storeOTP(phone, otpData) {
        console.log('[DB] Storing OTP for:', phone);
        await this.otpCollection.doc(phone).set({
            ...otpData,
            createdAt: new Date().toISOString()
        });
        console.log('[DB] OTP stored successfully');
    }
    
    async getOTP(phone) {
        console.log('[DB] Getting OTP for:', phone);
        const doc = await this.otpCollection.doc(phone).get();
        if (!doc.exists) {
            console.log('[DB] OTP not found for:', phone);
            return null;
        }
        console.log('[DB] OTP found for:', phone);
        return doc.data();
    }
    
    async updateOTPAttempts(phone, attempts) {
        await this.otpCollection.doc(phone).update({ attempts });
    }
    
    async deleteOTP(phone) {
        console.log('[DB] Deleting OTP for:', phone);
        await this.otpCollection.doc(phone).delete();
    }

    async init() {
        if (this.initialized) return this;
        if (this.initPromise) return this.initPromise;
        
        console.log('[DB] Starting initialization...');
        
        this.initPromise = (async () => {
            try {
                console.log('[DB] Fetching document from Firestore...');
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
                console.log('[DB] Initialization complete. Franchises:', this.cache?.franchises?.length || 0);
                return this;
            } catch (err) {
                console.error('[DB] Failed to connect to Firestore:', err.message);
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
     * @param {boolean} forceRefresh - Skip cache and fetch directly from Firestore
     */
    async load(forceRefresh = false) {
        // Ensure database is initialized
        await this.ensureInitialized();
        
        // If we have fresh cache and not forcing refresh, use it
        if (!forceRefresh && this.cache && (Date.now() - this.lastFetch < this.CACHE_TTL)) {
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
