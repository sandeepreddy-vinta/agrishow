import React, { useState, useEffect } from 'react';
import { GripVertical, Play, Monitor, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AssignmentManager = () => {
    const [content, setContent] = useState([]);
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [contentRes, franchisesRes] = await Promise.all([
                api.get('/content'),
                api.get('/franchises')
            ]);

            // New API returns { success: true, data: [...] }
            const contentList = contentRes.data.data || contentRes.data;
            const franchiseList = franchisesRes.data.data || franchisesRes.data;

            const contentData = contentList.map(c => ({ id: c.id, title: c.name, type: c.type }));

            // Fetch assignments for each franchise
            const franchisesWithItems = await Promise.all(franchiseList.map(async (f) => {
                try {
                    const assignRes = await api.get(`/assignments/${f.deviceId}`);
                    const assignData = assignRes.data.data || assignRes.data;
                    // Get the assignments array from the response
                    const assignments = assignData.assignments || [];
                    const items = assignments.map(content => ({
                        id: content.id,
                        title: content.name,
                        type: content.type
                    }));

                    return { ...f, items };
                } catch (e) {
                    console.error(`Failed to fetch assignments for ${f.deviceId}:`, e);
                    return { ...f, items: [] };
                }
            }));

            setContent(contentData);
            setFranchises(franchisesWithItems);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateAssignments = async (franchiseId, newItems) => {
        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;

        const contentIds = newItems.map(i => i.id);

        try {
            await api.post('/assignments', {
                deviceId: franchise.deviceId,
                contentIds
            });
            toast.success('Assignments updated');
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update assignments');
        }
    };

    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('content', JSON.stringify(item));
    };

    const handleDrop = async (e, franchiseId) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('content');
        if (data) {
            const item = JSON.parse(data);
            
            // Find the franchise and compute updated items BEFORE state update
            const franchise = franchises.find(f => f.id === franchiseId);
            if (!franchise) return;
            
            // Check for duplicates
            if (franchise.items.find(i => i.id === item.id)) {
                toast.error('Content already assigned');
                return;
            }
            
            const updatedItems = [...franchise.items, item];

            // Update local state
            setFranchises(prev => prev.map(f => {
                if (f.id === franchiseId) {
                    return { ...f, items: updatedItems };
                }
                return f;
            }));

            // Sync to backend
            await handleUpdateAssignments(franchiseId, updatedItems);
        }
    };

    const handleRemoveItem = async (franchiseId, itemId) => {
        // Find the franchise and compute updated items BEFORE state update
        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;
        
        const updatedItems = franchise.items.filter(i => i.id !== itemId);
        
        // Update local state
        setFranchises(prev => prev.map(f => {
            if (f.id === franchiseId) {
                return { ...f, items: updatedItems };
            }
            return f;
        }));
        
        // Sync to backend
        await handleUpdateAssignments(franchiseId, updatedItems);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white">Content Assignment</h1>
                <p className="text-muted mt-1">Drag and drop content to partners.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Source Column */}
                <div className="glass-panel p-6 flex flex-col overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-4">Content Library</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {content.length === 0 ? (
                            <p className="text-muted text-sm text-center italic">No content available</p>
                        ) : (
                            content.map(item => (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 cursor-grab active:cursor-grabbing flex items-center gap-3 transition-colors"
                                >
                                    <GripVertical size={20} className="text-muted" />
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <Play size={16} className="text-primary" />
                                    </div>
                                    <span className="font-medium text-white truncate max-w-[200px]">{item.title}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Target Column */}
                <div className="lg:col-span-2 glass-panel p-6 flex flex-col overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-4">Partners</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto content-start pr-2 custom-scrollbar">
                        {franchises.length === 0 ? (
                            <p className="text-muted text-center col-span-2">No partners found.</p>
                        ) : (
                            franchises.map(franchise => (
                                <div
                                    key={franchise.id}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, franchise.id)}
                                    className="p-4 rounded-xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors min-h-[200px] flex flex-col"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Monitor size={18} className="text-secondary" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white">{franchise.name}</h4>
                                            <p className="text-xs text-muted font-mono">{franchise.deviceId}</p>
                                        </div>
                                    </div>

                                    {franchise.items.length === 0 ? (
                                        <div className="h-32 flex items-center justify-center text-muted text-sm border border-white/5 rounded-lg border-dashed">
                                            Drop content here
                                        </div>
                                    ) : (
                                        <div className="space-y-2 flex-1">
                                            {franchise.items.map((item, idx) => (
                                                <div key={`${franchise.id}-${item.id}-${idx}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 text-sm group">
                                                    <span className="text-white truncate">{item.title}</span>
                                                    <button onClick={() => handleRemoveItem(franchise.id, item.id)} className="text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentManager;
