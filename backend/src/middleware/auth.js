/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const response = require('../utils/response');
const { AuthenticationError } = require('./errorHandler');

/**
 * Admin Authentication via API Key
 */
const requireApiKey = (req, res, next) => {
    const apiKey = req.get('X-API-Key');
    
    if (!apiKey || apiKey !== config.apiKey) {
        return response.unauthorized(res, 'Invalid or missing API key');
    }
    
    next();
};

/**
 * JWT Token Authentication
 */
const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return response.unauthorized(res, 'Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.jwtSecret);
        
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return response.unauthorized(res, 'Token expired');
        }
        if (err.name === 'JsonWebTokenError') {
            return response.unauthorized(res, 'Invalid token');
        }
        return response.unauthorized(res, 'Authentication failed');
    }
};

/**
 * Combined Auth: Accepts either API Key OR JWT Token
 */
const requireAdmin = (req, res, next) => {
    const apiKey = req.get('X-API-Key');
    const authHeader = req.get('Authorization');

    // Try API Key first
    if (apiKey && apiKey === config.apiKey) {
        req.authMethod = 'api_key';
        return next();
    }

    // Try JWT
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, config.jwtSecret);
            req.user = decoded;
            req.authMethod = 'jwt';
            return next();
        } catch (err) {
            // Fall through to unauthorized
        }
    }

    return response.unauthorized(res, 'Invalid credentials');
};

/**
 * Device Authentication via Device Token
 */
const requireDevice = (db) => async (req, res, next) => {
    const token = req.get('X-Device-Token');
    
    if (!token) {
        return response.unauthorized(res, 'Missing device token');
    }

    try {
        const currentDb = await db.load();
        const franchise = currentDb.franchises.find(f => f.token === token);

        if (!franchise) {
            return response.unauthorized(res, 'Invalid device token');
        }

        req.franchise = franchise;
        next();
    } catch (err) {
        console.error('[Auth] Device auth failed:', err);
        return response.error(res, 'Authentication error', 500);
    }
};

/**
 * Role-based access control
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return response.forbidden(res, 'Insufficient permissions');
    }
    next();
};

module.exports = {
    requireApiKey,
    requireAuth,
    requireAdmin,
    requireDevice,
    requireRole,
};
