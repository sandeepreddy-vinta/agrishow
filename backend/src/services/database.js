/**
 * Database Manager Service
 * Handles JSON file-based database operations with transactions and backups
 */

const fs = require('fs');
const path = require('path');

class DatabaseManager {
    constructor(dbFile, auditLog, migrationsDir, backupModule) {
        this.dbFile = dbFile;
        this.auditLog = auditLog;
        this.migrationsDir = migrationsDir;
        this.backupModule = backupModule;
        this.lock = false;
        this.lockQueue = [];
        this.data = null;
    }

    init() {
        // Ensure Database Exists or Recover
        if (!fs.existsSync(this.dbFile)) {
            console.warn('[DB] Database file missing. Attempting restoration...');
            let restored = false;
            if (this.backupModule) {
                restored = this.backupModule.restoreLatest();
            }
            if (!restored) {
                console.log('[DB] No backup found. Initializing new database.');
                this.write(this.getEmptyDatabase());
            }
        } else {
            // Validate existing DB
            try {
                const content = fs.readFileSync(this.dbFile, 'utf8');
                JSON.parse(content);
                console.log('[DB] Database loaded successfully');
            } catch (err) {
                console.error('[DB] Corrupted database detected!');
                if (this.backupModule && this.backupModule.restoreLatest()) {
                    console.log('[DB] Recovered from backup.');
                } else {
                    console.error('[DB] CRITICAL: Could not recover database.');
                    // Move corrupt file and start fresh
                    const corruptPath = this.dbFile + '.corrupt.' + Date.now();
                    fs.renameSync(this.dbFile, corruptPath);
                    console.log(`[DB] Corrupt file moved to: ${corruptPath}`);
                    this.write(this.getEmptyDatabase());
                }
            }
        }

        this.runMigrations();
        this.startBackupSchedule();
        
        return this;
    }

    getEmptyDatabase() {
        return {
            franchises: [],
            content: [],
            assignments: {},
            analytics: [],
            _metadata: { version: 0, createdAt: new Date().toISOString() },
        };
    }

    load() {
        try {
            return JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
        } catch (err) {
            console.error('[DB] Failed to load database:', err.message);
            throw err;
        }
    }

    write(data) {
        data._metadata = data._metadata || {};
        data._metadata.lastModified = new Date().toISOString();
        fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2));
    }

    /**
     * Atomic Transaction Wrapper with retry support
     */
    async transactAsync(callback, maxRetries = 3) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (!this.lock) {
                return this.transact(callback);
            }
            await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        }
        throw new Error('Database is locked. Try again later.');
    }

    /**
     * Synchronous transaction (original behavior)
     */
    transact(callback) {
        if (this.lock) {
            throw new Error('Database is locked. Try again later.');
        }

        this.lock = true;
        try {
            const currentData = this.load();
            // Deep copy to prevent reference mutation before commit
            const dataCopy = JSON.parse(JSON.stringify(currentData));

            const result = callback(dataCopy);

            // Commit
            this.write(dataCopy);
            this.lock = false;

            // Audit Log
            if (result && result.audit) {
                this.logAudit(result.audit.action, result.audit.details);
            }

            return result.data !== undefined ? result.data : result;
        } catch (err) {
            this.lock = false;
            console.error('[DB] Transaction failed. Rolled back.', err.message);
            throw err;
        }
    }

    logAudit(action, details) {
        const logEntry = `[${new Date().toISOString()}] [${action}] ${JSON.stringify(details)}\n`;
        fs.appendFile(this.auditLog, logEntry, (err) => {
            if (err) console.error('[Audit] Failed to write log:', err);
        });
    }

    startBackupSchedule() {
        if (!this.backupModule) return;

        // Run initial backup
        console.log('[DB] Running initial backup...');
        this.backupModule.backupDatabase();

        // Schedule hourly backups
        setInterval(() => {
            console.log('[DB] Running scheduled backup...');
            this.backupModule.backupDatabase();
        }, 60 * 60 * 1000);
    }

    runMigrations() {
        if (!fs.existsSync(this.migrationsDir)) return;

        const db = this.load();
        const currentVersion = (db._metadata && db._metadata.version) || 0;

        const scripts = fs.readdirSync(this.migrationsDir)
            .filter(f => f.endsWith('.js'))
            .sort();

        let updated = false;

        scripts.forEach(script => {
            const scriptPath = path.join(this.migrationsDir, script);
            try {
                const migration = require(scriptPath);
                if (migration.version > currentVersion) {
                    console.log(`[Migration] Applying ${script}...`);
                    migration.up(db);
                    db._metadata = db._metadata || {};
                    db._metadata.version = migration.version;
                    updated = true;
                }
            } catch (err) {
                console.error(`[Migration] Failed to load/run ${script}:`, err);
            }
        });

        if (updated) {
            this.write(db);
            console.log('[Migration] Database schema updated.');
        }
    }
}

module.exports = DatabaseManager;
