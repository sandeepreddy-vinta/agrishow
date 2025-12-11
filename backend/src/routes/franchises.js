/**
 * Franchise Routes
 */

const express = require('express');
const crypto = require('crypto');
const response = require('../utils/response');
const { requireAdmin, requireDevice } = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validation');

const createRouter = (db) => {
    const router = express.Router();

    /**
     * POST /api/franchises
     * Register a new franchise (ADMIN)
     */
    router.post('/', requireAdmin, validateBody('createFranchise'), async (req, res, next) => {
        try {
            const { name, location, deviceId } = req.validatedBody;

            const result = await db.transact((data) => {
                if (data.franchises.find(f => f.deviceId === deviceId)) {
                    throw Object.assign(new Error('Device ID already registered'), { code: 'CONFLICT' });
                }

                const deviceToken = crypto.randomUUID();
                const newFranchise = {
                    id: crypto.randomUUID(),
                    name,
                    location,
                    deviceId,
                    token: deviceToken,
                    status: 'offline',
                    lastSync: null,
                    createdAt: new Date().toISOString(),
                };

                data.franchises.push(newFranchise);

                return {
                    data: { ...newFranchise, token: deviceToken },
                    audit: { action: 'REGISTER_FRANCHISE', details: { name, deviceId } },
                };
            });

            return response.created(res, {
                ...result,
                message: 'SAVE THE TOKEN - it cannot be retrieved again!',
            }, 'Franchise registered successfully');
        } catch (err) {
            if (err.code === 'CONFLICT') {
                return response.conflict(res, err.message);
            }
            next(err);
        }
    });

    /**
     * GET /api/franchises
     * Get all franchises (ADMIN) - tokens masked
     */
    router.get('/', requireAdmin, async (req, res) => {
        try {
            const data = await db.load();
            const safeList = data.franchises.map(f => ({
                ...f,
                token: '***MASKED***',
            }));
            return response.success(res, safeList);
        } catch (err) {
            return response.error(res, 'Failed to load franchises', 500);
        }
    });

    /**
     * GET /api/franchises/:id
     * Get single franchise by ID (ADMIN)
     */
    router.get('/:id', requireAdmin, async (req, res) => {
        try {
            const data = await db.load();
            const franchise = data.franchises.find(f => f.id === req.params.id);
            
            if (!franchise) {
                return response.notFound(res, 'Franchise not found');
            }

            return response.success(res, { ...franchise, token: '***MASKED***' });
        } catch (err) {
            return response.error(res, 'Failed to load franchise', 500);
        }
    });

    /**
     * PUT /api/franchises/:id
     * Update franchise (ADMIN)
     */
    router.put('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { name, location } = req.body;
            const { id } = req.params;

            const result = await db.transact((data) => {
                const idx = data.franchises.findIndex(f => f.id === id);
                
                if (idx === -1) {
                    throw Object.assign(new Error('Franchise not found'), { code: 'NOT_FOUND' });
                }

                if (name) data.franchises[idx].name = name;
                if (location) data.franchises[idx].location = location;
                data.franchises[idx].updatedAt = new Date().toISOString();

                return {
                    data: { ...data.franchises[idx], token: '***MASKED***' },
                    audit: { action: 'UPDATE_FRANCHISE', details: { id, name, location } },
                };
            });

            return response.success(res, result, 'Franchise updated successfully');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    /**
     * DELETE /api/franchises/:id
     * Delete franchise (ADMIN)
     */
    router.delete('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;

            await db.transact((data) => {
                const idx = data.franchises.findIndex(f => f.id === id);
                
                if (idx === -1) {
                    throw Object.assign(new Error('Franchise not found'), { code: 'NOT_FOUND' });
                }

                const franchise = data.franchises[idx];
                data.franchises.splice(idx, 1);

                // Remove assignments for this franchise
                delete data.assignments[franchise.deviceId];

                return {
                    audit: { action: 'DELETE_FRANCHISE', details: { id, deviceId: franchise.deviceId } },
                };
            });

            return response.success(res, null, 'Franchise deleted successfully');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    /**
     * POST /api/franchises/:id/regenerate-token
     * Regenerate device token (ADMIN)
     */
    router.post('/:id/regenerate-token', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await db.transact((data) => {
                const idx = data.franchises.findIndex(f => f.id === id);
                
                if (idx === -1) {
                    throw Object.assign(new Error('Franchise not found'), { code: 'NOT_FOUND' });
                }

                const newToken = crypto.randomUUID();
                data.franchises[idx].token = newToken;

                return {
                    data: { token: newToken },
                    audit: { action: 'REGENERATE_TOKEN', details: { id } },
                };
            });

            return response.success(res, {
                token: result.token,
                message: 'SAVE THE NEW TOKEN - it cannot be retrieved again!',
            }, 'Token regenerated successfully');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    return router;
};

module.exports = createRouter;
