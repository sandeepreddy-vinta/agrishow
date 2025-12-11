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

// --- Paths ---
const CONTENT_DIR = path.join(__dirname, 'content');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure directories exist
[CONTENT_DIR, BACKUP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// --- Initialize Database ---
const dbManager = new DatabaseManager();

// --- Start Server ---
const startServer = async () => {
    try {
        const db = await dbManager.init();
        
        // --- Create Express App ---
        // contentDir is still needed for local uploads if GCS fails or for temp storage
        const app = createApp(db, CONTENT_DIR, BACKUP_DIR);
        
        const PORT = config.port;

        app.listen(PORT, async () => {
            console.log('');
            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║            FranchiseOS Backend API v2.0                ║');
            console.log('╠════════════════════════════════════════════════════════╣');
            console.log(`║  Server running on port: ${PORT}                          ║`);
            console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}                          ║`);
            try {
                const data = await db.load();
                console.log(`║  Database version: ${data._metadata?.version || 0}                              ║`);
            } catch (e) {
                console.log(`║  Database version: Unknown                                ║`);
            }
            console.log('╚════════════════════════════════════════════════════════╝');
            console.log('');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

// --- Graceful Shutdown ---
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    process.exit(0);
});
