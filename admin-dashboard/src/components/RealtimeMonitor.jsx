import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Wifi, WifiOff, Server, MapPin, Play, RefreshCw, Loader2, Monitor, Clock, Folder } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const RealtimeMonitor = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const fetchLiveData = useCallback(async () => {
        try {
            const response = await api.get('/stats/live');
            setData(response.data.data || response.data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch live data:', error);
            if (!data) {
                toast.error('Failed to load live monitor');
            }
        } finally {
            setLoading(false);
        }
    }, [data]);

    useEffect(() => {
        fetchLiveData();
    }, []);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(fetchLiveData, 10000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLiveData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    const summary = data?.summary || { total: 0, active: 0, online: 0, offline: 0 };
    const devices = data?.devices || [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'online': return 'bg-blue-500';
            default: return 'bg-red-500';
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-400';
            case 'online': return 'bg-blue-500/10 text-blue-400';
            default: return 'bg-red-500/10 text-red-400';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Live Monitor</h1>
                    <p className="text-muted mt-1">Real-time status of all connected devices.</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded bg-white/10 border-white/20 text-primary focus:ring-primary"
                        />
                        Auto-refresh (10s)
                    </label>
                    <button
                        onClick={fetchLiveData}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors flex items-center gap-2"
                        title="Refresh now"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 text-center">
                    <div className="text-3xl font-bold text-white">{summary.total}</div>
                    <div className="text-sm text-muted">Total Devices</div>
                </div>
                <div className="glass-panel p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">{summary.active}</div>
                    <div className="text-sm text-muted">Active Now</div>
                </div>
                <div className="glass-panel p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">{summary.online}</div>
                    <div className="text-sm text-muted">Online</div>
                </div>
                <div className="glass-panel p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">{summary.offline}</div>
                    <div className="text-sm text-muted">Offline</div>
                </div>
            </div>

            {/* Last Update */}
            {lastUpdate && (
                <div className="text-xs text-muted text-right">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
            )}

            {/* Device Grid */}
            {devices.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {devices.map(device => (
                        <div key={device.id} className="glass-panel p-5 hover:border-primary/30 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusBg(device.status)}`}>
                                        {device.status === 'offline' ? <WifiOff size={24} /> : <Wifi size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{device.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted">
                                            <MapPin size={12} />
                                            <span>{device.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(device.status)} ${device.status === 'active' ? 'animate-pulse' : ''}`}></span>
                                    <span className={`text-xs font-medium uppercase ${
                                        device.status === 'active' ? 'text-green-400' :
                                        device.status === 'online' ? 'text-blue-400' : 'text-red-400'
                                    }`}>
                                        {device.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <Clock size={16} className="mx-auto text-muted mb-1" />
                                    <div className="text-xs text-muted">Last Sync</div>
                                    <div className="text-sm text-white font-medium">{device.lastSyncFormatted}</div>
                                </div>
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <Folder size={16} className="mx-auto text-muted mb-1" />
                                    <div className="text-xs text-muted">Content</div>
                                    <div className="text-sm text-white font-medium">{device.assignedContentCount} items</div>
                                </div>
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <Monitor size={16} className="mx-auto text-muted mb-1" />
                                    <div className="text-xs text-muted">Device ID</div>
                                    <div className="text-sm text-white font-medium truncate" title={device.deviceId}>
                                        {device.deviceId.substring(0, 8)}...
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Content */}
                            {device.assignedContent.length > 0 && (
                                <div className="border-t border-white/5 pt-4">
                                    <div className="text-xs text-muted mb-2">Assigned Content:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {device.assignedContent.slice(0, 3).map(content => (
                                            <span 
                                                key={content.id}
                                                className={`px-2 py-1 rounded text-xs ${
                                                    content.type === 'video' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}
                                            >
                                                {content.name.length > 20 ? content.name.substring(0, 20) + '...' : content.name}
                                            </span>
                                        ))}
                                        {device.assignedContent.length > 3 && (
                                            <span className="px-2 py-1 rounded text-xs bg-white/10 text-muted">
                                                +{device.assignedContent.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity */}
                            {device.recentActivity.length > 0 && (
                                <div className="border-t border-white/5 pt-4 mt-4">
                                    <div className="text-xs text-muted mb-2">Recent Activity:</div>
                                    <div className="space-y-1">
                                        {device.recentActivity.slice(0, 3).map((activity, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                <Play size={10} className="text-primary" />
                                                <span className="text-muted">
                                                    {new Date(activity.timestamp).toLocaleTimeString()}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded ${
                                                    activity.action === 'play' ? 'bg-primary/20 text-primary' :
                                                    activity.action === 'complete' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                    {activity.action}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel p-12 text-center">
                    <Monitor size={48} className="mx-auto text-muted mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Devices Registered</h3>
                    <p className="text-muted">
                        Register partners to start monitoring their devices in real-time.
                    </p>
                    <button
                        onClick={() => window.location.href = '/franchises'}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Add Partner
                    </button>
                </div>
            )}
        </div>
    );
};

export default RealtimeMonitor;
