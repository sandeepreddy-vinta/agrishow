/**
 * Express Application Setup
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { config } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route factories
const createAuthRoutes = require('./routes/auth');
const createFranchiseRoutes = require('./routes/franchises');
const createContentRoutes = require('./routes/content');
const createAssignmentRoutes = require('./routes/assignments');
const createDeviceRoutes = require('./routes/device');
const createStatsRoutes = require('./routes/stats');

const createApp = (db, contentDir, backupDir) => {
    const app = express();

    // --- Core Middleware ---

    // 1. Rate Limiting
    const limiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 1000, // Increased for development
        message: { success: false, message: 'Too many requests from this IP' },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.path === '/api/health', // Don't rate limit health checks
    });
    app.use(limiter);

    // 2. CORS - Restricted to allowed origins
    const corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);
            
            // In development, allow localhost and 127.0.0.1 on any port
            const isDev = process.env.NODE_ENV !== 'production';
            const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
            
            if (config.allowedOrigins.includes(origin) || (isDev && isLocalhost)) {
                callback(null, true);
            } else {
                console.warn(`[CORS] Blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Device-Token'],
    };
    app.use(cors(corsOptions));

    // 3. Body Parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 4. Static file serving for uploaded content
    app.use('/content', express.static(contentDir));

    // --- Request Logging (Development) ---
    if (process.env.NODE_ENV !== 'production') {
        app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            next();
        });
    }

    // --- API Routes ---
    app.use('/api/auth', createAuthRoutes);
    app.use('/api/franchises', createFranchiseRoutes(db));
    app.use('/api/content', createContentRoutes(db, contentDir));
    app.use('/api/assignments', createAssignmentRoutes(db));
    app.use('/api', createDeviceRoutes(db)); // Handles /heartbeat, /playlist, /device/*
    app.use('/api', createStatsRoutes(db, backupDir)); // Handles /health, /stats

    // --- Error Handling ---
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

module.exports = createApp;
