import React, { useEffect, useState } from 'react';
import { Folder, Users, Monitor, Share2, Loader2, Activity, Upload } from 'lucide-react';
import StatCard from './StatCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await api.get('/stats');
            // New API returns { success: true, data: {...} }
            const data = response.data.data || response.data;

            // Transform API data to StatCard format - ALL REAL DATA
            const formattedStats = [
                { title: 'Total Franchises', value: data.franchises?.total?.toString() || '0', change: `${data.franchises?.online || 0} Online`, trend: 'neutral', icon: Users, color: 'primary' },
                { title: 'Online Screens', value: data.franchises?.online?.toString() || '0', change: 'Real-time', trend: 'up', icon: Monitor, color: 'success' },
                { title: 'Content Items', value: data.content?.total?.toString() || '0', change: `${data.content?.videos || 0} videos, ${data.content?.images || 0} images`, trend: 'neutral', icon: Folder, color: 'secondary' },
                { title: 'Active Assignments', value: data.assignments?.totalDevicesWithContent?.toString() || '0', change: 'Devices with content', trend: 'neutral', icon: Share2, color: 'accent' },
            ];
            setStatsData(formattedStats);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Fallback on error
            setStatsData([
                { title: 'Total Franchises', value: '-', change: '-', trend: 'neutral', icon: Users, color: 'primary' },
                { title: 'Online Screens', value: '-', change: '-', trend: 'neutral', icon: Monitor, color: 'success' },
                { title: 'Content Items', value: '-', change: '-', trend: 'neutral', icon: Folder, color: 'secondary' },
                { title: 'Active Assignments', value: '-', change: '-', trend: 'neutral', icon: Share2, color: 'accent' },
            ]);
            toast.error('Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-muted mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => window.location.href = '/content'}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                        Upload Content
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Activity size={48} className="text-muted mb-4" />
                        <h4 className="text-white font-medium mb-2">No Recent Activity</h4>
                        <p className="text-muted text-sm">Activity will appear here when devices start playing content</p>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={() => window.location.href = '/content'}
                            className="w-full px-4 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg transition-colors text-left flex items-center gap-3"
                        >
                            <Upload size={20} />
                            <span className="font-medium">Upload Content</span>
                        </button>
                        <button 
                            onClick={() => window.location.href = '/franchises'}
                            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors text-left flex items-center gap-3"
                        >
                            <Users size={20} />
                            <span className="font-medium">Add Franchise</span>
                        </button>
                        <button 
                            onClick={() => window.location.href = '/assignments'}
                            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors text-left flex items-center gap-3"
                        >
                            <Monitor size={20} />
                            <span className="font-medium">Manage Assignments</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
