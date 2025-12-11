/**
 * Device Routes (for partner devices/screens)
 */

const express = require('express');
const response = require('../utils/response');
const { requireDevice } = require('../middleware/auth');

const createRouter = (db) => {
    const router = express.Router();

    const deviceAuth = requireDevice(db);

    /**
     * POST /api/heartbeat
     * Device heartbeat to report online status
     */
    router.post('/heartbeat', deviceAuth, async (req, res, next) => {
        try {
            const lastSync = await db.transact((data) => {
                const idx = data.franchises.findIndex(f => f.id === req.franchise.id);
                
                if (idx === -1) {
                    throw new Error('Partner not found during update');
                }

                data.franchises[idx].status = 'online';
                data.franchises[idx].lastSync = new Date().toISOString();

                return {
                    data: data.franchises[idx].lastSync,
                };
            });

            console.log(`[Heartbeat] ${req.franchise.deviceId} - ${req.franchise.name}`);
            
            return response.success(res, { 
                lastSync,
                deviceId: req.franchise.deviceId,
            }, 'Heartbeat received');
        } catch (err) {
            next(err);
        }
    });

    /**
     * GET /api/playlist
     * Get assigned playlist for the device
     */
    router.get('/playlist', deviceAuth, async (req, res) => {
        try {
            const deviceId = req.franchise.deviceId;
            const data = await db.load();
            
            // Get the host from the request to build correct URLs for devices
            const protocol = req.protocol;
            const host = req.get('host');
            const baseUrl = `${protocol}://${host}`;
            
            const assignedIds = data.assignments[deviceId] || [];
            const playlist = assignedIds
                .map(id => data.content.find(c => c.id === id))
                .filter(Boolean)
                .map(content => ({
                    ...content,
                    // Replace localhost URLs with the actual server address
                    url: content.url.replace(/http:\/\/localhost:\d+/, baseUrl)
                }));

            return response.success(res, {
                deviceId,
                partnerName: req.franchise.name,
                location: req.franchise.location,
                playlist,
                playlistCount: playlist.length,
                lastUpdated: new Date().toISOString(),
            });
        } catch (err) {
            return response.error(res, 'Failed to load playlist', 500);
        }
    });

    /**
     * GET /api/device/info
     * Get device/partner info
     */
    router.get('/info', deviceAuth, (req, res) => {
        return response.success(res, {
            id: req.franchise.id,
            name: req.franchise.name,
            location: req.franchise.location,
            deviceId: req.franchise.deviceId,
            status: req.franchise.status,
            lastSync: req.franchise.lastSync,
        });
    });

    /**
     * POST /api/device/report
     * Device can report playback stats (for analytics)
     */
    router.post('/report', deviceAuth, async (req, res, next) => {
        try {
            const { contentId, action, timestamp, duration } = req.body;

            // In production, store these in a separate analytics table/collection
            console.log(`[Device Report] ${req.franchise.deviceId}: ${action} - ${contentId}`);

            await db.transact((data) => {
                // Initialize analytics if not exists
                if (!data.analytics) {
                    data.analytics = [];
                }

                data.analytics.push({
                    deviceId: req.franchise.deviceId,
                    franchiseId: req.franchise.id,
                    contentId,
                    action, // 'play', 'complete', 'skip', etc.
                    timestamp: timestamp || new Date().toISOString(),
                    duration,
                });

                // Keep only last 10000 analytics entries
                if (data.analytics.length > 10000) {
                    data.analytics = data.analytics.slice(-10000);
                }

                return { data: null };
            });

            return response.success(res, null, 'Report received');
        } catch (err) {
            next(err);
        }
    });

    // Legacy heartbeat endpoint for backwards compatibility
    router.post('/franchises/:deviceId/heartbeat', deviceAuth, async (req, res, next) => {
        if (req.franchise.deviceId !== req.params.deviceId) {
            return response.forbidden(res, 'Token does not match device ID');
        }

        try {
            const lastSync = await db.transact((data) => {
                const idx = data.franchises.findIndex(f => f.id === req.franchise.id);
                if (idx === -1) throw new Error('Not found');
                
                data.franchises[idx].status = 'online';
                data.franchises[idx].lastSync = new Date().toISOString();
                
                return { data: data.franchises[idx].lastSync };
            });

            return response.success(res, { lastSync });
        } catch (err) {
            next(err);
        }
    });

    return router;
};

module.exports = createRouter;
