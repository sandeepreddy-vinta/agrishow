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
const storageService = require('../services/storage');

const createRouter = (db, contentDir) => {
    const router = express.Router();

    // Ensure content directory exists (for local fallback)
    if (!fs.existsSync(contentDir)) {
        fs.mkdirSync(contentDir, { recursive: true });
    }

    // Multer configuration - use memory storage for GCS uploads
    const useGCS = storageService.isReady();
    
    const diskStorage = multer.diskStorage({
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

    const memoryStorage = multer.memoryStorage();

    const allowedMimeTypes = [...config.allowedVideoTypes, ...config.allowedImageTypes];

    const fileFilter = (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`));
        }
    };

    const upload = multer({
        storage: useGCS ? memoryStorage : diskStorage,
        limits: { fileSize: config.maxFileSize },
        fileFilter: (req, file, cb) => {
            console.log(`[Upload Debug] Processing file: ${file.originalname}`);
            console.log(`[Upload Debug] Mimetype: ${file.mimetype}`);
            console.log(`[Upload Debug] Storage Mode: ${useGCS ? 'GCS (Memory)' : 'Disk'}`);
            
            // Allow all types for debugging if it matches broadly
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                console.log(`[Upload Debug] Rejected mimetype: ${file.mimetype}`);
                cb(new Error(`Invalid file type: ${file.mimetype}`));
            }
        },
    });

    /**
     * POST /api/content/upload
     * Upload new content (ADMIN)
     */
    router.post('/upload', requireAdmin, (req, res, next) => {
        console.log('[Upload Debug] Request received');
        
        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('[Upload Debug] Multer Error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return response.badRequest(res, `File too large. Maximum size: ${config.maxFileSize / (1024 * 1024)}MB`);
                }
                return response.badRequest(res, `Upload error: ${err.message}`);
            }

            if (!req.file) {
                console.error('[Upload Debug] No file in request. Body:', req.body);
                return response.badRequest(res, 'No file provided');
            }

            try {
                const displayName = req.body.name?.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim() || req.file.originalname;
                const duration = parseInt(req.body.duration) || 10;

                let filename, url, size;

                if (storageService.isReady()) {
                    // Upload to Google Cloud Storage
                    const result = await storageService.uploadFile(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype
                    );
                    filename = result.filename;
                    url = result.url;
                    size = result.size;
                    console.log(`[Content] Uploaded to GCS: ${displayName}`);
                } else {
                    // Fallback to local storage
                    const serverUrl = `${req.protocol}://${req.get('host')}`;
                    filename = req.file.filename;
                    url = `${serverUrl}/content/${req.file.filename}`;
                    size = req.file.size;
                    console.log(`[Content] Uploaded locally: ${displayName}`);
                }

                const newContent = {
                    id: crypto.randomUUID(),
                    name: displayName,
                    filename: filename,
                    type: req.file.mimetype.startsWith('video') ? 'video' : 'image',
                    mimeType: req.file.mimetype,
                    size: size,
                    url: url,
                    duration,
                    uploadDate: new Date().toISOString(),
                };

                db.transact((data) => {
                    data.content.push(newContent);
                    return {
                        data: newContent,
                        audit: { action: 'UPLOAD_CONTENT', details: { name: displayName, file: filename } },
                    };
                });

                return response.created(res, newContent, 'Content uploaded successfully');
            } catch (err) {
                console.error('[Content] Upload error:', err.message);
                // Clean up local file if it exists
                if (req.file && req.file.filename) {
                    const filePath = path.join(contentDir, req.file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                return response.error(res, `Upload failed: ${err.message}`, 500);
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
    router.delete('/:id', requireAdmin, async (req, res, next) => {
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
                if (storageService.isReady() && fileToDelete.startsWith('content/')) {
                    // Delete from GCS
                    await storageService.deleteFile(fileToDelete);
                } else {
                    // Delete from local storage
                    const filePath = path.join(contentDir, fileToDelete);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
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
