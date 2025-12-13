import React, { useState, useEffect } from 'react';
import { GripVertical, Play, Monitor, Loader2, Save, Folder, Shuffle, ListOrdered, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AssignmentManager = () => {
    const [content, setContent] = useState([]);
    const [folders, setFolders] = useState([]);
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [contentRes, foldersRes, franchisesRes] = await Promise.all([
                api.get('/content'),
                api.get('/folders'),
                api.get('/franchises')
            ]);

            const contentList = contentRes.data || contentRes;
            const folderList = foldersRes.data || foldersRes;
            const franchiseList = franchisesRes.data || franchisesRes;

            const contentData = contentList.map(c => ({ id: c.id, title: c.name, type: 'content', contentType: c.type }));
            const folderData = folderList.map(f => ({ id: f.id, title: f.name, type: 'folder', childCount: f.contentIds?.length || 0 }));

            // Fetch assignments for each franchise
            const franchisesWithItems = await Promise.all(franchiseList.map(async (f) => {
                try {
                    const assignRes = await api.get(`/assignments/${f.deviceId}`);
                    const assignData = assignRes.data || assignRes;
                    
                    const assignments = assignData.assignments || [];
                    const items = assignments.map(item => ({
                        id: item.id,
                        title: item.name,
                        type: item.type || 'content',
                        contentType: item.contentType
                    }));

                    return { 
                        ...f, 
                        items,
                        playbackOrder: assignData.franchise?.playbackOrder || 'sequential'
                    };
                } catch (e) {
                    console.error(`Failed to fetch assignments for ${f.deviceId}:`, e);
                    return { ...f, items: [], playbackOrder: 'sequential' };
                }
            }));

            setContent(contentData);
            setFolders(folderData);
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

    const handleUpdateAssignments = async (franchiseId, newItems, newOrder) => {
        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;

        // Simplify items for API
        const items = newItems.map(i => ({
            type: i.type,
            id: i.id
        }));

        try {
            await api.post('/assignments', {
                deviceId: franchise.deviceId,
                items,
                playbackOrder: newOrder || franchise.playbackOrder
            });
            toast.success('Assignments updated');
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update assignments');
        }
    };

    const togglePlaybackOrder = async (franchiseId) => {
        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;
        
        const newOrder = franchise.playbackOrder === 'sequential' ? 'random' : 'sequential';
        
        setFranchises(prev => prev.map(f => {
            if (f.id === franchiseId) {
                return { ...f, playbackOrder: newOrder };
            }
            return f;
        }));

        await handleUpdateAssignments(franchiseId, franchise.items, newOrder);
    };

    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('assignItem', JSON.stringify(item));
    };

    const handleDrop = async (e, franchiseId) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('assignItem');
        if (data) {
            const item = JSON.parse(data);
            
            const franchise = franchises.find(f => f.id === franchiseId);
            if (!franchise) return;
            
            // Check for duplicates
            if (franchise.items.find(i => i.id === item.id)) {
                toast.error('Item already assigned');
                return;
            }
            
            const updatedItems = [...franchise.items, item];

            setFranchises(prev => prev.map(f => {
                if (f.id === franchiseId) {
                    return { ...f, items: updatedItems };
                }
                return f;
            }));

            await handleUpdateAssignments(franchiseId, updatedItems);
        }
    };

    const handleRemoveItem = async (franchiseId, itemId) => {
        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;
        
        const updatedItems = franchise.items.filter(i => i.id !== itemId);
        
        setFranchises(prev => prev.map(f => {
            if (f.id === franchiseId) {
                return { ...f, items: updatedItems };
            }
            return f;
        }));
        
        await handleUpdateAssignments(franchiseId, updatedItems);
    };

    // Simple reordering logic (swap with up/down or drag within list - implementing simple move up/down for now or HTML5 Sortable later)
    // For now, let's just stick to append. If user wants to reorder, they can remove and re-add or we can add move buttons.
    // Given the requirement "Give an option to sort the play order", I should probably allow reordering.
    // Adding small up/down arrows is easy.
    
    const moveItem = async (franchiseId, index, direction) => {
        const franchise = franchises.find(f => f.id === franchiseId);
        if (!franchise) return;
        
        const newItems = [...franchise.items];
        if (direction === 'up' && index > 0) {
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        } else if (direction === 'down' && index < newItems.length - 1) {
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        } else {
            return;
        }

        setFranchises(prev => prev.map(f => {
            if (f.id === franchiseId) {
                return { ...f, items: newItems };
            }
            return f;
        }));

        await handleUpdateAssignments(franchiseId, newItems);
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
                <p className="text-muted mt-1">Drag folders or content to partners.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Source Column */}
                <div className="glass-panel p-6 flex flex-col overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-4">Library</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        
                        {/* Folders */}
                        {folders.length > 0 && (
                             <div className="mb-4">
                                <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Folders</h4>
                                <div className="space-y-2">
                                    {folders.map(folder => (
                                        <div
                                            key={folder.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, folder)}
                                            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 cursor-grab active:cursor-grabbing flex items-center gap-3 transition-colors"
                                        >
                                            <GripVertical size={16} className="text-muted" />
                                            <Folder size={18} className="text-primary" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white truncate">{folder.title}</div>
                                                <div className="text-xs text-muted">{folder.childCount} items</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}

                        {/* Content */}
                        <div>
                             <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Media</h4>
                             <div className="space-y-2">
                                {content.length === 0 ? (
                                    <p className="text-muted text-sm italic">No media found</p>
                                ) : (
                                    content.map(item => (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 cursor-grab active:cursor-grabbing flex items-center gap-3 transition-colors"
                                        >
                                            <GripVertical size={16} className="text-muted" />
                                            {item.contentType?.startsWith('video') ? (
                                                <Play size={18} className="text-blue-400" />
                                            ) : (
                                                <ImageIcon size={18} className="text-green-400" />
                                            )}
                                            <span className="font-medium text-white truncate flex-1">{item.title}</span>
                                        </div>
                                    ))
                                )}
                             </div>
                        </div>
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
                                    className="p-4 rounded-xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors min-h-[300px] flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Monitor size={18} className="text-secondary" />
                                            <div>
                                                <h4 className="font-bold text-white">{franchise.name}</h4>
                                                <p className="text-xs text-muted font-mono">{franchise.deviceId}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => togglePlaybackOrder(franchise.id)}
                                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium ${franchise.playbackOrder === 'random' ? 'bg-primary text-white' : 'bg-white/10 text-muted hover:text-white'}`}
                                            title="Toggle Playback Order"
                                        >
                                            {franchise.playbackOrder === 'random' ? (
                                                <>
                                                    <Shuffle size={14} /> Random
                                                </>
                                            ) : (
                                                <>
                                                    <ListOrdered size={14} /> Sequential
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {franchise.items.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-muted text-sm border border-white/5 rounded-lg border-dashed bg-black/10">
                                            Drop content or folders here
                                        </div>
                                    ) : (
                                        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
                                            {franchise.items.map((item, idx) => (
                                                <div key={`${franchise.id}-${item.id}-${idx}`} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 text-sm group hover:bg-black/30">
                                                    
                                                    {/* Reorder controls */}
                                                    {franchise.playbackOrder === 'sequential' && (
                                                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => moveItem(franchise.id, idx, 'up')}
                                                                disabled={idx === 0}
                                                                className="hover:text-primary disabled:opacity-20"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button 
                                                                onClick={() => moveItem(franchise.id, idx, 'down')}
                                                                disabled={idx === franchise.items.length - 1}
                                                                className="hover:text-primary disabled:opacity-20"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Type Icon */}
                                                    {item.type === 'folder' ? (
                                                        <Folder size={16} className="text-primary shrink-0" />
                                                    ) : (
                                                        item.contentType?.startsWith('video') ? 
                                                            <Play size={16} className="text-blue-400 shrink-0" /> : 
                                                            <ImageIcon size={16} className="text-green-400 shrink-0" />
                                                    )}

                                                    <span className="text-white truncate flex-1">{item.title}</span>
                                                    
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
