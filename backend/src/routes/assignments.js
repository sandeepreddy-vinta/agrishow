/**
 * Assignment Routes
 */

const express = require('express');
const response = require('../utils/response');
const { requireAdmin } = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validation');

const createRouter = (db) => {
    const router = express.Router();

    /**
     * POST /api/assignments
     * Assign content to a device (ADMIN)
     */
    router.post('/', requireAdmin, async (req, res, next) => {
        try {
            const { deviceId, items, playbackOrder } = req.body;

            // Simple validation since we're changing schema
            if (!deviceId || !Array.isArray(items)) {
                return response.badRequest(res, 'Invalid request body');
            }

            const result = await db.transact((data) => {
                const franchise = data.franchises.find(f => f.deviceId === deviceId);
                
                if (!franchise) {
                    throw Object.assign(new Error('Partner not found'), { code: 'NOT_FOUND' });
                }

                // Update Playback Order if provided
                if (playbackOrder) {
                    franchise.playbackOrder = playbackOrder; // 'sequential' or 'random'
                }

                // Validate items
                const validItems = [];
                const invalidItems = [];

                for (const item of items) {
                    // Normalize item structure
                    // Can be simple string (legacy content ID) or object { type, id }
                    let type = 'content';
                    let id = item;
                    
                    if (typeof item === 'object') {
                        type = item.type || 'content';
                        id = item.id;
                    }

                    let exists = false;
                    if (type === 'content') {
                        exists = data.content.some(c => c.id === id);
                    } else if (type === 'folder') {
                        exists = (data.folders || []).some(f => f.id === id);
                    }

                    if (exists) {
                        validItems.push({ type, id });
                    } else {
                        invalidItems.push({ type, id });
                    }
                }

                if (invalidItems.length > 0) {
                    console.warn(`[Assignments] Invalid items ignored: ${JSON.stringify(invalidItems)}`);
                }

                data.assignments[deviceId] = validItems;

                return {
                    data: {
                        deviceId,
                        assignedItems: validItems,
                        playbackOrder: franchise.playbackOrder,
                        invalidItems: invalidItems.length > 0 ? invalidItems : undefined,
                    },
                    audit: { action: 'UPDATE_ASSIGNMENTS', details: { deviceId, count: validItems.length } },
                };
            });

            return response.success(res, result, 'Assignments updated successfully');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    /**
     * GET /api/assignments
     * Get all assignments (ADMIN)
     */
    router.get('/', requireAdmin, async (req, res) => {
        try {
            const data = await db.load();
            
            // Enrich with franchise and content details
            const enrichedAssignments = Object.entries(data.assignments).map(([deviceId, items]) => {
                const franchise = data.franchises.find(f => f.deviceId === deviceId);
                
                // Normalize items (handle legacy array of strings)
                const normalizedItems = (Array.isArray(items) ? items : []).map(item => {
                    if (typeof item === 'string') return { type: 'content', id: item };
                    return item;
                });

                const enrichedItems = normalizedItems.map(item => {
                    if (item.type === 'folder') {
                        const folder = (data.folders || []).find(f => f.id === item.id);
                        return folder ? { ...item, name: folder.name } : null;
                    } else {
                        const content = data.content.find(c => c.id === item.id);
                        return content ? { ...item, name: content.name, contentType: content.type } : null;
                    }
                }).filter(Boolean);

                return {
                    deviceId,
                    franchise: franchise ? { 
                        id: franchise.id, 
                        name: franchise.name, 
                        location: franchise.location,
                        playbackOrder: franchise.playbackOrder || 'sequential'
                    } : null,
                    itemCount: enrichedItems.length,
                    items: enrichedItems,
                };
            });

            return response.success(res, enrichedAssignments);
        } catch (err) {
            return response.error(res, 'Failed to load assignments', 500);
        }
    });

    /**
     * GET /api/assignments/:deviceId
     * Get assignments for a specific device (ADMIN)
     */
    router.get('/:deviceId', requireAdmin, async (req, res) => {
        const { deviceId } = req.params;
        try {
            const data = await db.load();
            
            const franchise = data.franchises.find(f => f.deviceId === deviceId);
        
            if (!franchise) {
                return response.notFound(res, 'Partner not found');
            }

            const rawItems = data.assignments[deviceId] || [];
            
            // Normalize
            const normalizedItems = rawItems.map(item => {
                if (typeof item === 'string') return { type: 'content', id: item };
                return item;
            });

            const enrichedItems = normalizedItems.map(item => {
                if (item.type === 'folder') {
                    const folder = (data.folders || []).find(f => f.id === item.id);
                    return folder ? { ...item, name: folder.name, childCount: folder.contentIds?.length || 0 } : null;
                } else {
                    const content = data.content.find(c => c.id === item.id);
                    return content ? { ...item, name: content.name, contentType: content.type } : null;
                }
            }).filter(Boolean);

            return response.success(res, {
                deviceId,
                franchise: { 
                    id: franchise.id, 
                    name: franchise.name, 
                    location: franchise.location,
                    playbackOrder: franchise.playbackOrder || 'sequential'
                },
                assignments: enrichedItems,
            });
        } catch (err) {
            return response.error(res, 'Failed to load assignments', 500);
        }
    });

    /**
     * DELETE /api/assignments/:deviceId
     * Clear all assignments for a device (ADMIN)
     */
    router.delete('/:deviceId', requireAdmin, async (req, res, next) => {
        try {
            const { deviceId } = req.params;

            await db.transact((data) => {
                const franchise = data.franchises.find(f => f.deviceId === deviceId);
                
                if (!franchise) {
                    throw Object.assign(new Error('Partner not found'), { code: 'NOT_FOUND' });
                }

                const previousCount = (data.assignments[deviceId] || []).length;
                data.assignments[deviceId] = [];

                return {
                    audit: { action: 'CLEAR_ASSIGNMENTS', details: { deviceId, previousCount } },
                };
            });

            return response.success(res, null, 'Assignments cleared successfully');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    /**
     * POST /api/assignments/:deviceId/add
     * Add content to existing assignments (ADMIN)
     */
    router.post('/:deviceId/add', requireAdmin, async (req, res, next) => {
        try {
            const { deviceId } = req.params;
            const { contentIds } = req.body;

            if (!Array.isArray(contentIds)) {
                return response.badRequest(res, 'contentIds must be an array');
            }

            const result = await db.transact((data) => {
                const franchise = data.franchises.find(f => f.deviceId === deviceId);
                
                if (!franchise) {
                    throw Object.assign(new Error('Partner not found'), { code: 'NOT_FOUND' });
                }

                const currentAssignments = data.assignments[deviceId] || [];
                const validNewIds = contentIds.filter(id => 
                    data.content.some(c => c.id === id) && !currentAssignments.includes(id)
                );

                data.assignments[deviceId] = [...currentAssignments, ...validNewIds];

                return {
                    data: {
                        deviceId,
                        added: validNewIds.length,
                        total: data.assignments[deviceId].length,
                    },
                    audit: { action: 'ADD_ASSIGNMENTS', details: { deviceId, added: validNewIds.length } },
                };
            });

            return response.success(res, result, 'Content added to assignments');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    /**
     * POST /api/assignments/:deviceId/remove
     * Remove content from assignments (ADMIN)
     */
    router.post('/:deviceId/remove', requireAdmin, async (req, res, next) => {
        try {
            const { deviceId } = req.params;
            const { contentIds } = req.body;

            if (!Array.isArray(contentIds)) {
                return response.badRequest(res, 'contentIds must be an array');
            }

            const result = await db.transact((data) => {
                const franchise = data.franchises.find(f => f.deviceId === deviceId);
                
                if (!franchise) {
                    throw Object.assign(new Error('Partner not found'), { code: 'NOT_FOUND' });
                }

                const currentAssignments = data.assignments[deviceId] || [];
                data.assignments[deviceId] = currentAssignments.filter(id => !contentIds.includes(id));

                return {
                    data: {
                        deviceId,
                        removed: currentAssignments.length - data.assignments[deviceId].length,
                        total: data.assignments[deviceId].length,
                    },
                    audit: { action: 'REMOVE_ASSIGNMENTS', details: { deviceId, removed: contentIds.length } },
                };
            });

            return response.success(res, result, 'Content removed from assignments');
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
