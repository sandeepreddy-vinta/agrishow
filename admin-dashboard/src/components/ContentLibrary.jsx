import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileVideo, Image as ImageIcon, Loader2, FolderPlus, Folder as FolderIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ContentCard from './ContentCard';
import FolderCard from './FolderCard';
import UploadModal from './UploadModal';
import CreateFolderModal from './CreateFolderModal';
import api from '../services/api';
import { formatBytes } from '../utils/helpers';

const ContentLibrary = () => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [content, setContent] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState(null); // null = root

    const fetchData = async () => {
        try {
            const [contentRes, foldersRes] = await Promise.all([
                api.get('/content'),
                api.get('/folders')
            ]);

            // Content
            const contentData = contentRes.data || contentRes;
            const mappedContent = contentData.map(item => ({
                id: item.id,
                title: item.name,
                type: item.type,
                size: formatBytes(item.size),
                duration: item.duration ? `${item.duration}s` : '-',
                url: item.url,
                rawDate: item.uploadDate
            }));
            setContent(mappedContent);

            // Folders
            const foldersData = foldersRes.data || foldersRes;
            setFolders(foldersData);

        } catch (error) {
            console.error('Failed to load library:', error);
            toast.error('Failed to load library');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpload = async (files) => {
        const toastId = toast.loading(`Uploading ${files.length} files...`);
        let successCount = 0;
        let uploadedIds = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);

            try {
                const res = await api.post('/content/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 0, // No timeout
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                });
                // Assuming response has the new content object
                const newContent = res.data || res;
                if (newContent && newContent.id) {
                    uploadedIds.push(newContent.id);
                }
                successCount++;
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                toast.error(`Failed: ${file.name}`, { id: toastId });
            }
        }

        if (successCount > 0) {
            toast.success(`Uploaded ${successCount}/${files.length} files`, { id: toastId });
            
            // If inside a folder, add these new contents to the folder
            if (currentFolder && uploadedIds.length > 0) {
                await addContentToFolder(currentFolder.id, uploadedIds);
            }
            
            fetchData();
        } else {
            toast.dismiss(toastId);
        }
    };

    const handleCreateFolder = async (name) => {
        try {
            await api.post('/folders', { name });
            toast.success('Folder created');
            fetchData();
        } catch (error) {
            console.error('Failed to create folder:', error);
            toast.error('Failed to create folder');
        }
    };

    const handleDeleteContent = async (id) => {
        if (!confirm('Are you sure you want to delete this content?')) return;
        const toastId = toast.loading('Deleting content...');
        try {
            await api.delete(`/content/${id}`);
            setContent(prev => prev.filter(c => c.id !== id));
            toast.success('Content deleted', { id: toastId });
            fetchData(); // Refresh to update folders that might have had this content
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete content', { id: toastId });
        }
    };

    const handleDeleteFolder = async (id) => {
        if (!confirm('Are you sure you want to delete this folder? Content inside will NOT be deleted.')) return;
        try {
            await api.delete(`/folders/${id}`);
            setFolders(prev => prev.filter(f => f.id !== id));
            if (currentFolder?.id === id) setCurrentFolder(null);
            toast.success('Folder deleted');
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete folder');
        }
    };

    const addContentToFolder = async (folderId, contentIds) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;
        
        const existingIds = folder.contentIds || [];
        // Merge unique
        const newContentIds = [...new Set([...existingIds, ...contentIds])];

        try {
            await api.put(`/folders/${folderId}`, {
                contentIds: newContentIds
            });
            // Don't toast here if it's part of upload flow, or do it if manual
        } catch (e) {
            console.error('Failed to add to folder', e);
        }
    };

    const handleRemoveFromFolder = async (folderId, contentId) => {
         const folder = folders.find(f => f.id === folderId);
         if (!folder) return;
         
         const newContentIds = (folder.contentIds || []).filter(id => id !== contentId);
         
         try {
             await api.put(`/folders/${folderId}`, {
                 contentIds: newContentIds
             });
             toast.success('Removed from folder');
             fetchData();
         } catch (e) {
             toast.error('Failed to remove');
         }
    };

    // Filter Logic
    // If currentFolder is null: Show all folders AND all content that is NOT in any folder? 
    // Or just show all folders and all content (flat view vs folder view).
    // Let's go with: Root shows Folders + Unorganized Content (or All Content).
    // Actually, traditionally: Folders first, then Content.
    
    // When inside a folder: Show only content in that folder.

    const displayedFolders = currentFolder ? [] : folders.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedContent = content.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || item.type === filter;
        
        // Folder logic
        if (currentFolder) {
            // Must be in the folder
            const isInFolder = currentFolder.contentIds?.includes(item.id);
            return matchesSearch && matchesFilter && isInFolder;
        } else {
            // Root view: Show content. 
            // Optional: Hide content that is already in a folder? 
            // For now, let's show ALL content in root for easy access, or maybe just "Uncategorized"?
            // User requirement: "Assign folder to partners, in folder there will be videos and photos"
            // Usually this implies a file system structure.
            // Let's show content that is NOT in the current folder view (which is root).
            // Actually, showing all content in root might be cluttered if we have folders.
            // Let's simple filter: If root, show all.
            return matchesSearch && matchesFilter;
        }
    });

    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('contentId', item.id);
    };

    const handleFolderDrop = async (e, folder) => {
        e.preventDefault();
        const contentId = e.dataTransfer.getData('contentId');
        if (contentId) {
            // Add to folder
            const toastId = toast.loading(`Moving to ${folder.name}...`);
            try {
                // Get current folder content
                const existing = folder.contentIds || [];
                if (existing.includes(contentId)) {
                    toast.success('Already in folder', { id: toastId });
                    return;
                }
                
                await api.put(`/folders/${folder.id}`, {
                    contentIds: [...existing, contentId]
                });
                toast.success('Added to folder', { id: toastId });
                fetchData();
            } catch (err) {
                toast.error('Failed to move', { id: toastId });
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        {currentFolder && (
                            <button 
                                onClick={() => setCurrentFolder(null)}
                                className="hover:bg-white/10 p-1 rounded-lg transition-colors mr-2"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        {currentFolder ? currentFolder.name : 'Content Library'}
                    </h1>
                    <p className="text-muted mt-1">
                        {currentFolder ? `${displayedContent.length} items` : 'Manage your digital assets and folders.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    {!currentFolder && (
                        <button
                            onClick={() => setIsCreateFolderOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                        >
                            <FolderPlus size={20} />
                            <span>New Folder</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                        <Plus size={20} />
                        <span>Upload Content</span>
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-surface/30 p-4 rounded-xl backdrop-blur-md border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/5"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'text-muted hover:bg-white/5'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('video')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${filter === 'video' ? 'bg-primary text-white' : 'text-muted hover:bg-white/5'}`}
                    >
                        <FileVideo size={18} />
                        Video
                    </button>
                    <button
                        onClick={() => setFilter('image')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${filter === 'image' ? 'bg-primary text-white' : 'text-muted hover:bg-white/5'}`}
                    >
                        <ImageIcon size={18} />
                        Image
                    </button>
                </div>
            </div>

            {/* Folders Section (Only in Root) */}
            {!currentFolder && displayedFolders.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FolderIcon size={20} className="text-muted" />
                        Folders
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {displayedFolders.map(folder => (
                            <div
                                key={folder.id}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleFolderDrop(e, folder)}
                            >
                                <FolderCard
                                    folder={folder}
                                    onClick={setCurrentFolder}
                                    onDelete={handleDeleteFolder}
                                    onEdit={(f) => {
                                        // Simple rename prompt for now
                                        const newName = prompt('Rename folder:', f.name);
                                        if (newName && newName !== f.name) {
                                            api.put(`/folders/${f.id}`, { name: newName })
                                                .then(() => {
                                                    toast.success('Folder renamed');
                                                    fetchData();
                                                });
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Section */}
            <div>
                 {(currentFolder || displayedFolders.length === 0 || searchQuery) && (
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileVideo size={20} className="text-muted" />
                        {currentFolder ? 'Folder Content' : 'All Content'}
                    </h3>
                 )}
                
                {displayedContent.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayedContent.map(item => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                            >
                                <ContentCard
                                    content={item}
                                    onDelete={currentFolder ? () => handleRemoveFromFolder(currentFolder.id, item.id) : handleDeleteContent}
                                    onPreview={(c) => window.open(c.url, '_blank')}
                                    // If in folder, maybe show "Remove from folder" icon instead of delete?
                                    // ContentCard needs to be flexible or we wrapper it.
                                    // For now passing custom onDelete is enough if ContentCard uses it.
                                    actionIcon={currentFolder ? 'remove' : 'delete'}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                            <Filter size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">No content found</h3>
                        <p className="text-muted mt-2">
                            {currentFolder 
                                ? "This folder is empty. Upload content or drag files here." 
                                : "Upload new content to get started."}
                        </p>
                    </div>
                )}
            </div>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
            />

            <CreateFolderModal
                isOpen={isCreateFolderOpen}
                onClose={() => setIsCreateFolderOpen(false)}
                onCreate={handleCreateFolder}
            />
        </div>
    );
};

export default ContentLibrary;
