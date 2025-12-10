/**
 * FranchiseOS Backend API
 * Entry point - initializes and starts the server
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');

// Validate environment before anything else
const { validateEnv, config } = require('./src/config/env');
validateEnv();

// Import modules
const createApp = require('./src/app');
const DatabaseManager = require('./src/services/database');
const backupModule = require('./backup');

// --- Paths ---
const DB_FILE = path.join(__dirname, 'database.json');
const AUDIT_LOG = path.join(__dirname, 'audit.log');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const CONTENT_DIR = path.join(__dirname, 'content');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure directories exist
[CONTENT_DIR, BACKUP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// --- Initialize Database ---
const db = new DatabaseManager(DB_FILE, AUDIT_LOG, MIGRATIONS_DIR, backupModule).init();

// --- Create Express App ---
const app = createApp(db, CONTENT_DIR, BACKUP_DIR);

// --- Start Server ---
const PORT = config.port;

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║            FranchiseOS Backend API v2.0                ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Server running on port: ${PORT}                          ║`);
    console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}                          ║`);
    console.log(`║  Database version: ${db.load()._metadata?.version || 0}                              ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
});

// --- Graceful Shutdown ---
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    process.exit(0);
});
