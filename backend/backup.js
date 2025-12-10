const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, 'backups');
const DB_FILE = path.join(__dirname, 'database.json');
const MAX_BACKUPS_HOURS = 24;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getTimestamp() {
    const now = new Date();
    // Format: YYYY-MM-DD-HH
    return now.toISOString().replace(/:/g, '-').split('.')[0].slice(0, 13);
}

const backupDatabase = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            console.warn('[Backup] Database file not found, skipping backup.');
            return null;
        }

        const timestamp = getTimestamp();
        const backupFile = path.join(BACKUP_DIR, `db-${timestamp}.json`);

        // If backup for this hour already exists, don't overwrite/duplicate unless forced?
        // Actually, let's just copy. If it exists, it gets overwritten which is fine for "hourly snapshot".
        fs.copyFileSync(DB_FILE, backupFile);
        console.log(`[Backup] detailed created: ${backupFile}`);

        rotateBackups();
        return backupFile;
    } catch (err) {
        console.error('[Backup] Failed:', err);
        return null;
    }
};

const rotateBackups = () => {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('db-') && f.endsWith('.json'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Newest first

        // Keep last N backups
        if (files.length > MAX_BACKUPS_HOURS) {
            const toDelete = files.slice(MAX_BACKUPS_HOURS);
            toDelete.forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`[Backup] Rotated/Deleted old backup: ${file.name}`);
            });
        }
    } catch (err) {
        console.error('[Backup] Cleanup failed:', err);
    }
};

const restoreLatest = () => {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('db-') && f.endsWith('.json'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Newest first

        if (files.length === 0) {
            console.error('[Restore] No backups available.');
            return false;
        }

        const latest = files[0];
        console.log(`[Restore] Restoring from ${latest.name}...`);

        // Validate backup before restoring (basic JSON check)
        const content = fs.readFileSync(latest.path, 'utf8');
        JSON.parse(content); // Will throw if invalid

        fs.writeFileSync(DB_FILE, content);
        console.log('[Restore] Success!');
        return true;
    } catch (err) {
        console.error('[Restore] Failed:', err);
        return false;
    }
};

module.exports = {
    backupDatabase,
    rotateBackups,
    restoreLatest,
    BACKUP_DIR
};
