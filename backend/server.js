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
    const PORT = config.port;
    
    // Create Express App with database manager (will initialize lazily)
    const app = createApp(dbManager, CONTENT_DIR, BACKUP_DIR);
    
    // Start listening FIRST so Cloud Run health checks pass
    const server = app.listen(PORT, () => {
        console.log(`[Server] Listening on port ${PORT}`);
    });

    // Initialize database AFTER server is listening
    try {
        await dbManager.init();
        console.log('');
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║            FranchiseOS Backend API v2.0                ║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log(`║  Server running on port: ${PORT}                          ║`);
        console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}                          ║`);
        try {
            const data = await dbManager.load();
            console.log(`║  Database version: ${data._metadata?.version || 0}                              ║`);
        } catch (e) {
            console.log(`║  Database version: Unknown                             ║`);
        }
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('');
    } catch (err) {
        console.error('[Server] Database initialization failed:', err);
        // Don't exit - server can still handle health checks
        // API routes will fail gracefully until DB is ready
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
