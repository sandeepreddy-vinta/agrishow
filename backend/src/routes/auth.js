/**
 * Authentication Routes
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { config } = require('../config/env');
const response = require('../utils/response');
const { validateBody } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// In-memory users store (in production, use database)
let users = [];

// Initialize with admin user
const initializeUsers = () => {
    if (users.length === 0) {
        users.push({
            id: crypto.randomUUID(),
            email: config.adminEmail,
            password: hashPassword(config.adminPassword),
            name: 'System Admin',
            role: 'admin',
            createdAt: new Date().toISOString(),
        });
    }
};

// Simple password hashing (use bcrypt in production)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password + config.jwtSecret).digest('hex');
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', validateBody('login'), (req, res) => {
    initializeUsers();
    
    const { email, password } = req.validatedBody;
    
    const user = users.find(u => u.email === email);
    
    if (!user || !verifyPassword(password, user.password)) {
        return response.unauthorized(res, 'Invalid email or password');
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );

    return response.success(res, {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        expiresIn: config.jwtExpiresIn,
    }, 'Login successful');
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, (req, res) => {
    return response.success(res, {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
    });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', requireAuth, (req, res) => {
    const token = jwt.sign(
        {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );

    return response.success(res, { token, expiresIn: config.jwtExpiresIn }, 'Token refreshed');
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, server can blacklist if needed)
 */
router.post('/logout', requireAuth, (req, res) => {
    // In a full implementation, add token to blacklist
    return response.success(res, null, 'Logged out successfully');
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return response.badRequest(res, 'Current and new password required');
    }

    if (newPassword.length < 8) {
        return response.badRequest(res, 'New password must be at least 8 characters');
    }

    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
        return response.notFound(res, 'User not found');
    }

    if (!verifyPassword(currentPassword, users[userIndex].password)) {
        return response.unauthorized(res, 'Current password is incorrect');
    }

    users[userIndex].password = hashPassword(newPassword);

    return response.success(res, null, 'Password changed successfully');
});

// Export users for user management routes
module.exports = router;
module.exports.getUsers = () => users;
module.exports.setUsers = (newUsers) => { users = newUsers; };
module.exports.hashPassword = hashPassword;
module.exports.initializeUsers = initializeUsers;
