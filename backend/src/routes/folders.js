/**
 * Folder Routes
 */

const express = require('express');
const crypto = require('crypto');
const response = require('../utils/response');
const { requireAdmin } = require('../middleware/auth');

const createRouter = (db) => {
    const router = express.Router();

    /**
     * GET /api/folders
     * Get all folders
     */
    router.get('/', requireAdmin, async (req, res) => {
        try {
            const data = await db.load();
            return response.success(res, data.folders || []);
        } catch (err) {
            return response.error(res, 'Failed to load folders', 500);
        }
    });

    /**
     * POST /api/folders
     * Create a new folder
     */
    router.post('/', requireAdmin, async (req, res, next) => {
        try {
            const { name, contentIds = [] } = req.body;

            if (!name) {
                return response.badRequest(res, 'Folder name is required');
            }

            const folderId = crypto.randomUUID();

            const result = await db.transact((data) => {
                if (!data.folders) data.folders = [];

                const newFolder = {
                    id: folderId,
                    name: name.trim(),
                    contentIds: Array.isArray(contentIds) ? contentIds : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                data.folders.push(newFolder);

                return {
                    data: newFolder,
                    audit: { action: 'CREATE_FOLDER', details: { id: folderId, name } },
                };
            });

            return response.created(res, result, 'Folder created successfully');
        } catch (err) {
            next(err);
        }
    });

    /**
     * PUT /api/folders/:id
     * Update folder (name or content)
     */
    router.put('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, contentIds } = req.body;

            const result = await db.transact((data) => {
                if (!data.folders) data.folders = [];
                const idx = data.folders.findIndex(f => f.id === id);

                if (idx === -1) {
                    throw Object.assign(new Error('Folder not found'), { code: 'NOT_FOUND' });
                }

                const folder = data.folders[idx];
                if (name) folder.name = name.trim();
                if (contentIds && Array.isArray(contentIds)) folder.contentIds = contentIds;
                
                folder.updatedAt = new Date().toISOString();

                return {
                    data: folder,
                    audit: { action: 'UPDATE_FOLDER', details: { id, name } },
                };
            });

            return response.success(res, result, 'Folder updated successfully');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    /**
     * DELETE /api/folders/:id
     * Delete folder
     */
    router.delete('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;

            await db.transact((data) => {
                if (!data.folders) data.folders = [];
                const idx = data.folders.findIndex(f => f.id === id);

                if (idx === -1) {
                    throw Object.assign(new Error('Folder not found'), { code: 'NOT_FOUND' });
                }

                const folderName = data.folders[idx].name;
                data.folders.splice(idx, 1);

                // Also remove this folder from any assignments
                // Assignments structure check: Array of strings (legacy) or Objects
                Object.keys(data.assignments).forEach(deviceId => {
                    const assignmentList = data.assignments[deviceId] || [];
                    // Filter out this folder
                    data.assignments[deviceId] = assignmentList.filter(item => {
                        if (typeof item === 'object' && item.type === 'folder' && item.id === id) {
                            return false;
                        }
                        return true;
                    });
                });

                return {
                    audit: { action: 'DELETE_FOLDER', details: { id, name: folderName } },
                };
            });

            return response.success(res, null, 'Folder deleted successfully');
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
