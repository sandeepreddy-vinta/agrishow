const fs = require('fs');
const path = require('path');
const { backupDatabase, restoreLatest } = require('./backup');

const DB_FILE = path.join(__dirname, 'database.json');
const AUDIT_LOG = path.join(__dirname, 'audit.log');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

class DatabaseManager {
    constructor() {
        this.lock = false; // Simple in-memory mutex
        this.data = null;
        this.init();
    }

    init() {
        // Ensure Database Exists or Recover
        if (!fs.existsSync(DB_FILE)) {
            console.warn('[DB] Database file missing. Attempting restoration...');
            if (!restoreLatest()) {
                console.log('[DB] No backup found. Initializing new database.');
                this.write({ franchises: [], content: [], assignments: {}, _metadata: { version: 0 } });
            }
        } else {
            // Validate existing DB
            try {
                const content = fs.readFileSync(DB_FILE, 'utf8');
                JSON.parse(content);
            } catch (err) {
                console.error('[DB] Corrupted database detected!');
                if (restoreLatest()) {
                    console.log('[DB] Recovered from backup.');
                } else {
                    console.error('[DB] CRITICAL: Could not recover database. Manual intervention required.');
                    // Optionally rename corrupt file and start fresh? For now, we keep it to avoid data loss.
                    // But to allow server start, maybe we should move it?
                    // fs.renameSync(DB_FILE, DB_FILE + '.corrupt');
                    // this.write({ ... }); 
                }
            }
        }

        this.runMigrations();
        this.startBackupSchedule();
    }

    load() {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }

    write(data) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }

    // Atomic Transaction Wrapper
    transact(callback) {
        if (this.lock) {
            throw new Error('Database is locked. Try again later.');
            // In a real system, we'd use a queue or retry mechanism.
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

            return result.data || result; // Return data
        } catch (err) {
            this.lock = false;
            console.error('[DB] Transaction failed. Rolled back.', err);
            throw err; // Re-throw to caller
        }
    }

    logAudit(action, details) {
        const logEntry = `[${new Date().toISOString()}] [${action}] ${JSON.stringify(details)}\n`;
        fs.appendFile(AUDIT_LOG, logEntry, (err) => {
            if (err) console.error('[Audit] Failed to write log:', err);
        });
    }

    startBackupSchedule() {
        // Run backup every hour
        setInterval(() => {
            console.log('[DB] Running scheduled backup...');
            backupDatabase();
        }, 60 * 60 * 1000);
    }

    runMigrations() {
        if (!fs.existsSync(MIGRATIONS_DIR)) return;

        const db = this.load();
        const currentVersion = (db._metadata && db._metadata.version) || 0;

        const scripts = fs.readdirSync(MIGRATIONS_DIR)
            .sort(); // Ensure order 001, 002...

        let updated = false;

        scripts.forEach(script => {
            const scriptPath = path.join(MIGRATIONS_DIR, script);
            // Assuming nomenclature like "001_desc.js"
            // We can require it. 
            // NOTE: This assumes trusted local scripts.
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

module.exports = new DatabaseManager();
