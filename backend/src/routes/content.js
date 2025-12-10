/**
 * Content Routes
 */

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { config } = require('../config/env');
const response = require('../utils/response');
const { requireAdmin } = require('../middleware/auth');

const createRouter = (db, contentDir) => {
    const router = express.Router();

    // Ensure content directory exists
    if (!fs.existsSync(contentDir)) {
        fs.mkdirSync(contentDir, { recursive: true });
    }

    // Multer configuration
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, contentDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const safeName = file.originalname
                .replace(ext, '')
                .replace(/[^a-zA-Z0-9-_. ]/g, '')
                .trim();
            cb(null, safeName + '-' + uniqueSuffix + ext);
        },
    });

    const allowedMimeTypes = [...config.allowedVideoTypes, ...config.allowedImageTypes];

    const fileFilter = (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`));
        }
    };

    const upload = multer({
        storage,
        limits: { fileSize: config.maxFileSize },
        fileFilter,
    });

    /**
     * POST /api/content/upload
     * Upload new content (ADMIN)
     */
    router.post('/upload', requireAdmin, (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return response.badRequest(res, `File too large. Maximum size: ${config.maxFileSize / (1024 * 1024)}MB`);
                }
                return response.badRequest(res, err.message);
            }

            if (!req.file) {
                return response.badRequest(res, 'No file provided');
            }

            try {
                const serverUrl = `${req.protocol}://${req.get('host')}`;
                const displayName = req.body.name?.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim() || req.file.originalname;
                const duration = parseInt(req.body.duration) || 10;

                const newContent = {
                    id: crypto.randomUUID(),
                    name: displayName,
                    filename: req.file.filename,
                    type: req.file.mimetype.startsWith('video') ? 'video' : 'image',
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                    url: `${serverUrl}/content/${req.file.filename}`,
                    duration,
                    uploadDate: new Date().toISOString(),
                };

                db.transact((data) => {
                    data.content.push(newContent);
                    return {
                        data: newContent,
                        audit: { action: 'UPLOAD_CONTENT', details: { name: displayName, file: req.file.filename } },
                    };
                });

                console.log(`[Content] Uploaded: ${displayName}`);
                return response.created(res, newContent, 'Content uploaded successfully');
            } catch (err) {
                // Clean up uploaded file if database operation fails
                if (req.file) {
                    const filePath = path.join(contentDir, req.file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                next(err);
            }
        });
    });

    /**
     * GET /api/content
     * Get all content (ADMIN)
     */
    router.get('/', requireAdmin, (req, res) => {
        const data = db.load();
        return response.success(res, data.content);
    });

    /**
     * GET /api/content/:id
     * Get single content item (ADMIN)
     */
    router.get('/:id', requireAdmin, (req, res) => {
        const data = db.load();
        const content = data.content.find(c => c.id === req.params.id);

        if (!content) {
            return response.notFound(res, 'Content not found');
        }

        return response.success(res, content);
    });

    /**
     * PUT /api/content/:id
     * Update content metadata (ADMIN)
     */
    router.put('/:id', requireAdmin, (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, duration } = req.body;

            const result = db.transact((data) => {
                const idx = data.content.findIndex(c => c.id === id);

                if (idx === -1) {
                    throw Object.assign(new Error('Content not found'), { code: 'NOT_FOUND' });
                }

                if (name) data.content[idx].name = name.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
                if (duration) data.content[idx].duration = parseInt(duration) || data.content[idx].duration;
                data.content[idx].updatedAt = new Date().toISOString();

                return {
                    data: data.content[idx],
                    audit: { action: 'UPDATE_CONTENT', details: { id, name, duration } },
                };
            });

            return response.success(res, result, 'Content updated successfully');
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return response.notFound(res, err.message);
            }
            next(err);
        }
    });

    /**
     * DELETE /api/content/:id
     * Delete content (ADMIN)
     */
    router.delete('/:id', requireAdmin, (req, res, next) => {
        try {
            const { id } = req.params;
            let fileToDelete = null;

            db.transact((data) => {
                const idx = data.content.findIndex(c => c.id === id);

                if (idx === -1) {
                    throw Object.assign(new Error('Content not found'), { code: 'NOT_FOUND' });
                }

                fileToDelete = data.content[idx].filename;
                data.content.splice(idx, 1);

                // Remove from all assignments
                for (const devId in data.assignments) {
                    data.assignments[devId] = data.assignments[devId].filter(cId => cId !== id);
                }

                return {
                    audit: { action: 'DELETE_CONTENT', details: { id, filename: fileToDelete } },
                };
            });

            // Delete file after successful DB update
            if (fileToDelete) {
                const filePath = path.join(contentDir, fileToDelete);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            return response.success(res, null, 'Content deleted successfully');
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
