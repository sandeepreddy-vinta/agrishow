import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Monitor, Play, Clock, CheckCircle, SkipForward, Loader2, RefreshCw } from 'lucide-react';
import StatCard from './StatCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');
    const [data, setData] = useState(null);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/stats/analytics?period=${period}`);
            setData(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    const summary = data?.summary || {};
    const chartData = data?.chartData || [];
    const topContent = data?.topContent || [];
    const topDevices = data?.topDevices || [];
    const peakHours = data?.peakHours || [];
    const recentEvents = data?.recentEvents || [];

    // Format chart data for display
    const formattedChartData = chartData.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    // Create pie chart data from top content
    const pieData = topContent.slice(0, 5).map(c => ({
        name: c.contentName.length > 15 ? c.contentName.substring(0, 15) + '...' : c.contentName,
        value: c.plays,
    }));

    const stats = [
        { title: 'Total Plays', value: summary.totalPlays?.toString() || '0', change: `${summary.uniqueContent || 0} content items`, trend: 'neutral', icon: Play, color: 'primary' },
        { title: 'Completions', value: summary.totalCompletes?.toString() || '0', change: `${summary.avgCompletionRate || 0}% avg rate`, trend: 'up', icon: CheckCircle, color: 'success' },
        { title: 'Skips', value: summary.totalSkips?.toString() || '0', change: 'Content skipped', trend: 'neutral', icon: SkipForward, color: 'secondary' },
        { title: 'Active Devices', value: summary.uniqueDevices?.toString() || '0', change: 'Playing content', trend: 'up', icon: Monitor, color: 'accent' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Analytics</h1>
                    <p className="text-muted mt-1">Real-time insights into your digital signage network.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={fetchAnalytics}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Play Count Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Playback Over Time</h3>
                    {formattedChartData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={formattedChartData}>
                                    <defs>
                                        <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="plays" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPlays)" name="Plays" />
                                    <Area type="monotone" dataKey="completes" stroke="#10b981" fillOpacity={0.3} fill="#10b981" name="Completes" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted">
                            <p>No playback data yet. Data will appear when devices start playing content.</p>
                        </div>
                    )}
                </div>

                {/* Content Distribution Pie */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Content Distribution</h3>
                    {pieData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="h-[250px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20', color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-3xl font-bold text-white">{summary.totalPlays || 0}</span>
                                    <span className="text-xs text-muted">Total Plays</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {pieData.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-white text-sm">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted">
                            <p>No content data yet.</p>
                        </div>
                    )}
                </div>

                {/* Peak Hours */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Peak Hours</h3>
                    {peakHours.length > 0 && peakHours.some(h => h.plays > 0) ? (
                        <div className="space-y-4">
                            {peakHours.filter(h => h.plays > 0).map((hour, index) => (
                                <div key={hour.hour} className="flex items-center gap-4">
                                    <div className="w-16 text-muted text-sm">
                                        {hour.hour.toString().padStart(2, '0')}:00
                                    </div>
                                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-end pr-2"
                                            style={{ width: `${Math.max(10, (hour.plays / Math.max(...peakHours.map(h => h.plays))) * 100)}%` }}
                                        >
                                            <span className="text-xs text-white font-medium">{hour.plays}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted">
                            <p>No peak hour data yet.</p>
                        </div>
                    )}
                </div>

                {/* Top Performing Content */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Top Performing Content</h3>
                    {topContent.length > 0 ? (
                        <div className="space-y-4">
                            {topContent.slice(0, 5).map((content, i) => (
                                <div key={content.contentId} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <span className="text-2xl font-bold text-muted opacity-20">#{i + 1}</span>
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium truncate">{content.contentName}</h4>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                                            <span>{content.completionRate}% completion</span>
                                            <span>{content.uniqueDevices} devices</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                            <div 
                                                className="bg-primary h-full rounded-full" 
                                                style={{ width: `${Math.max(5, (content.plays / (topContent[0]?.plays || 1)) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold">{content.plays}</div>
                                        <div className="text-xs text-muted">Plays</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted">
                            <p>No content performance data yet.</p>
                        </div>
                    )}
                </div>

                {/* Top Devices */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-4">Top Active Devices</h3>
                    {topDevices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topDevices.slice(0, 6).map((device, i) => (
                                <div key={device.deviceId} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-white font-medium truncate">{device.franchiseName}</h4>
                                        <span className="text-xs text-muted">#{i + 1}</span>
                                    </div>
                                    <p className="text-xs text-muted mb-3 truncate">{device.location}</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-lg font-bold text-primary">{device.plays}</div>
                                            <div className="text-xs text-muted">Plays</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-green-400">{device.completes}</div>
                                            <div className="text-xs text-muted">Complete</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-yellow-400">{device.skips}</div>
                                            <div className="text-xs text-muted">Skips</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted">
                            <p>No device activity data yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Events */}
            {recentEvents.length > 0 && (
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-muted text-sm border-b border-white/5">
                                    <th className="pb-3 font-medium">Time</th>
                                    <th className="pb-3 font-medium">Action</th>
                                    <th className="pb-3 font-medium">Content</th>
                                    <th className="pb-3 font-medium">Device</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.slice(0, 10).map((event, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 text-sm text-muted">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                event.action === 'play' ? 'bg-primary/20 text-primary' :
                                                event.action === 'complete' ? 'bg-green-500/20 text-green-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {event.action}
                                            </span>
                                        </td>
                                        <td className="py-3 text-white text-sm truncate max-w-[200px]">{event.contentName}</td>
                                        <td className="py-3 text-muted text-sm truncate max-w-[150px]">{event.franchiseName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
