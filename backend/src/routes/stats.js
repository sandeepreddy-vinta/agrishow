/**
 * Stats, Analytics, and Live Monitoring Routes
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const response = require('../utils/response');
const { requireAdmin } = require('../middleware/auth');

const createRouter = (db, backupDir) => {
    const router = express.Router();

    /**
     * GET /api/health
     * Health check endpoint (public)
     */
    router.get('/health', async (req, res) => {
        try {
            const data = await db.load();
            const backupStats = fs.existsSync(backupDir) ? 'Available' : 'No Backups';
            
            return response.success(res, {
                status: 'healthy',
                version: (data._metadata && data._metadata.version) || 0,
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                database: 'connected',
                backupSystem: backupStats,
            });
        } catch (err) {
            return response.error(res, 'Health check failed', 503, { 
                status: 'unhealthy',
                error: err.message,
            });
        }
    });

    /**
     * GET /api/stats
     * Get system statistics (ADMIN)
     */
    router.get('/stats', requireAdmin, async (req, res) => {
        try {
            const data = await db.load();
            
            const totalSize = data.content.reduce((sum, item) => sum + (item.size || 0), 0);
            const videoCount = data.content.filter(c => c.type === 'video').length;
            const imageCount = data.content.filter(c => c.type === 'image').length;

            const now = Date.now();
            const fiveMinutesAgo = now - 5 * 60 * 1000;
            
            const onlineCount = data.franchises.filter(f => {
                if (!f.lastSync) return false;
                return new Date(f.lastSync).getTime() > fiveMinutesAgo;
            }).length;

            // Calculate total plays from analytics
            const analytics = data.analytics || [];
            const totalPlays = analytics.filter(a => a.action === 'play').length;

            return response.success(res, {
                franchises: {
                    total: data.franchises.length,
                    online: onlineCount,
                    offline: data.franchises.length - onlineCount,
                },
                content: {
                    total: data.content.length,
                    videos: videoCount,
                    images: imageCount,
                    totalSize,
                    totalSizeFormatted: formatBytes(totalSize),
                },
                assignments: {
                    totalDevicesWithContent: Object.keys(data.assignments).filter(k => data.assignments[k].length > 0).length,
                    totalAssignments: Object.values(data.assignments).reduce((sum, arr) => sum + arr.length, 0),
                },
                analytics: {
                    totalPlays,
                    totalEvents: analytics.length,
                },
                system: {
                    uptime: process.uptime(),
                    uptimeFormatted: formatUptime(process.uptime()),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version,
                },
            });
        } catch (err) {
            return response.error(res, 'Failed to load stats', 500);
        }
    });

    /**
     * GET /api/stats/live
     * Get live device status for monitoring (ADMIN)
     */
    router.get('/stats/live', requireAdmin, async (req, res) => {
        try {
            const data = await db.load();
            const now = Date.now();
            const fiveMinutesAgo = now - 5 * 60 * 1000;
            const oneMinuteAgo = now - 60 * 1000;

            // Get detailed device status
            const devices = data.franchises.map(f => {
                const lastSyncTime = f.lastSync ? new Date(f.lastSync).getTime() : 0;
                const isOnline = lastSyncTime > fiveMinutesAgo;
                const isActive = lastSyncTime > oneMinuteAgo;
                
                // Get assigned content for this device
                const assignedContent = data.assignments[f.deviceId] || [];
                const contentDetails = assignedContent.map(contentId => {
                    const content = data.content.find(c => c.id === contentId);
                    return content ? { id: content.id, name: content.name, type: content.type } : null;
                }).filter(Boolean);

                // Get recent playback for this device
                const deviceAnalytics = (data.analytics || [])
                    .filter(a => a.deviceId === f.deviceId)
                    .slice(-5)
                    .reverse();

                return {
                    id: f.id,
                    deviceId: f.deviceId,
                    name: f.name,
                    location: f.location,
                    status: isOnline ? (isActive ? 'active' : 'online') : 'offline',
                    lastSync: f.lastSync,
                    lastSyncFormatted: f.lastSync ? formatTimeAgo(new Date(f.lastSync)) : 'Never',
                    currentContent: f.currentContent || null,
                    assignedContentCount: contentDetails.length,
                    assignedContent: contentDetails,
                    recentActivity: deviceAnalytics,
                    systemInfo: f.systemInfo || null,
                };
            });

            // Sort: active first, then online, then offline
            const statusOrder = { active: 0, online: 1, offline: 2 };
            devices.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

            return response.success(res, {
                timestamp: new Date().toISOString(),
                summary: {
                    total: devices.length,
                    active: devices.filter(d => d.status === 'active').length,
                    online: devices.filter(d => d.status === 'online').length,
                    offline: devices.filter(d => d.status === 'offline').length,
                },
                devices,
            });
        } catch (err) {
            return response.error(res, 'Failed to load live stats', 500);
        }
    });

    /**
     * GET /api/stats/analytics
     * Get comprehensive playback analytics (ADMIN)
     */
    router.get('/stats/analytics', requireAdmin, async (req, res) => {
        try {
            const data = await db.load();
            const analytics = data.analytics || [];
            const { period = '7d' } = req.query;

            // Calculate time range
            const now = Date.now();
            const periodMs = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                'all': Infinity,
            }[period] || 7 * 24 * 60 * 60 * 1000;

            const filteredAnalytics = analytics.filter(a => {
                const eventTime = new Date(a.timestamp).getTime();
                return now - eventTime < periodMs;
            });

            // Group by content
            const contentStats = {};
            filteredAnalytics.forEach(entry => {
                if (!contentStats[entry.contentId]) {
                    contentStats[entry.contentId] = { 
                        plays: 0, 
                        completes: 0, 
                        skips: 0,
                        totalDuration: 0,
                        devices: new Set(),
                    };
                }
                if (entry.action === 'play') contentStats[entry.contentId].plays++;
                if (entry.action === 'complete') contentStats[entry.contentId].completes++;
                if (entry.action === 'skip') contentStats[entry.contentId].skips++;
                if (entry.duration) contentStats[entry.contentId].totalDuration += entry.duration;
                if (entry.deviceId) contentStats[entry.contentId].devices.add(entry.deviceId);
            });

            // Enrich with content names and calculate completion rate
            const topContent = Object.entries(contentStats).map(([contentId, stats]) => {
                const content = data.content.find(c => c.id === contentId);
                const completionRate = stats.plays > 0 ? Math.round((stats.completes / stats.plays) * 100) : 0;
                return {
                    contentId,
                    contentName: content?.name || 'Deleted Content',
                    contentType: content?.type || 'unknown',
                    plays: stats.plays,
                    completes: stats.completes,
                    skips: stats.skips,
                    completionRate,
                    uniqueDevices: stats.devices.size,
                    avgDuration: stats.plays > 0 ? Math.round(stats.totalDuration / stats.plays) : 0,
                };
            }).sort((a, b) => b.plays - a.plays);

            // Group by device
            const deviceStats = {};
            filteredAnalytics.forEach(entry => {
                if (!deviceStats[entry.deviceId]) {
                    deviceStats[entry.deviceId] = { plays: 0, completes: 0, skips: 0 };
                }
                if (entry.action === 'play') deviceStats[entry.deviceId].plays++;
                if (entry.action === 'complete') deviceStats[entry.deviceId].completes++;
                if (entry.action === 'skip') deviceStats[entry.deviceId].skips++;
            });

            const topDevices = Object.entries(deviceStats).map(([deviceId, stats]) => {
                const franchise = data.franchises.find(f => f.deviceId === deviceId);
                return {
                    deviceId,
                    franchiseName: franchise?.name || 'Unknown Device',
                    location: franchise?.location || 'Unknown',
                    ...stats,
                };
            }).sort((a, b) => b.plays - a.plays);

            // Group by day for chart data
            const dailyStats = {};
            filteredAnalytics.forEach(entry => {
                const date = new Date(entry.timestamp).toISOString().split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = { plays: 0, completes: 0, skips: 0 };
                }
                if (entry.action === 'play') dailyStats[date].plays++;
                if (entry.action === 'complete') dailyStats[date].completes++;
                if (entry.action === 'skip') dailyStats[date].skips++;
            });

            // Convert to array sorted by date
            const chartData = Object.entries(dailyStats)
                .map(([date, stats]) => ({ date, ...stats }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Group by hour for peak hours analysis
            const hourlyStats = Array(24).fill(0).map(() => ({ plays: 0 }));
            filteredAnalytics.forEach(entry => {
                if (entry.action === 'play') {
                    const hour = new Date(entry.timestamp).getHours();
                    hourlyStats[hour].plays++;
                }
            });

            const peakHours = hourlyStats
                .map((stats, hour) => ({ hour, plays: stats.plays }))
                .sort((a, b) => b.plays - a.plays)
                .slice(0, 5);

            return response.success(res, {
                period,
                summary: {
                    totalPlays: filteredAnalytics.filter(a => a.action === 'play').length,
                    totalCompletes: filteredAnalytics.filter(a => a.action === 'complete').length,
                    totalSkips: filteredAnalytics.filter(a => a.action === 'skip').length,
                    avgCompletionRate: topContent.length > 0 
                        ? Math.round(topContent.reduce((sum, c) => sum + c.completionRate, 0) / topContent.length)
                        : 0,
                    uniqueDevices: new Set(filteredAnalytics.map(a => a.deviceId)).size,
                    uniqueContent: new Set(filteredAnalytics.map(a => a.contentId)).size,
                },
                topContent: topContent.slice(0, 10),
                topDevices: topDevices.slice(0, 10),
                chartData,
                peakHours,
                recentEvents: filteredAnalytics.slice(-20).reverse().map(e => ({
                    ...e,
                    contentName: data.content.find(c => c.id === e.contentId)?.name || 'Unknown',
                    franchiseName: data.franchises.find(f => f.deviceId === e.deviceId)?.name || 'Unknown',
                })),
            });
        } catch (err) {
            return response.error(res, 'Failed to load analytics', 500);
        }
    });

    /**
     * GET /api/stats/device/:deviceId
     * Get detailed stats for a specific device (ADMIN)
     */
    router.get('/stats/device/:deviceId', requireAdmin, async (req, res) => {
        const { deviceId } = req.params;
        try {
            const data = await db.load();

            const franchise = data.franchises.find(f => f.deviceId === deviceId);
            if (!franchise) {
                return response.notFound(res, 'Device not found');
            }

            const deviceAnalytics = (data.analytics || []).filter(a => a.deviceId === deviceId);
            const assignedContent = data.assignments[deviceId] || [];

            // Calculate stats
            const plays = deviceAnalytics.filter(a => a.action === 'play').length;
            const completes = deviceAnalytics.filter(a => a.action === 'complete').length;

            // Group by content for this device
            const contentBreakdown = {};
            deviceAnalytics.forEach(entry => {
                if (!contentBreakdown[entry.contentId]) {
                    contentBreakdown[entry.contentId] = { plays: 0, completes: 0 };
                }
                if (entry.action === 'play') contentBreakdown[entry.contentId].plays++;
                if (entry.action === 'complete') contentBreakdown[entry.contentId].completes++;
            });

            const contentStats = Object.entries(contentBreakdown).map(([contentId, stats]) => {
                const content = data.content.find(c => c.id === contentId);
                return {
                    contentId,
                    contentName: content?.name || 'Deleted',
                    ...stats,
                };
            }).sort((a, b) => b.plays - a.plays);

            return response.success(res, {
                device: {
                    id: franchise.id,
                    deviceId: franchise.deviceId,
                    name: franchise.name,
                    location: franchise.location,
                    status: franchise.status,
                    lastSync: franchise.lastSync,
                    registeredAt: franchise.registeredAt,
                },
                stats: {
                    totalPlays: plays,
                    totalCompletes: completes,
                    completionRate: plays > 0 ? Math.round((completes / plays) * 100) : 0,
                    assignedContentCount: assignedContent.length,
                },
                contentStats,
                recentActivity: deviceAnalytics.slice(-20).reverse(),
            });
        } catch (err) {
            return response.error(res, 'Failed to load device stats', 500);
        }
    });

    return router;
};

// Helper functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

module.exports = createRouter;
