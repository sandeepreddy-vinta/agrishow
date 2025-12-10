import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileVideo, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ContentCard from './ContentCard';
import UploadModal from './UploadModal';
import api from '../services/api';
import { formatBytes } from '../utils/helpers';

const ContentLibrary = () => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchContent = async () => {
        try {
            const response = await api.get('/content');
            // New API returns { success: true, data: [...] }
            const contentData = response.data.data || response.data;
            // Map to frontend format
            const mapped = contentData.map(item => ({
                id: item.id,
                title: item.name,
                type: item.type,
                size: formatBytes(item.size),
                duration: item.duration ? `${item.duration}s` : '-',
                url: item.url,
                rawDate: item.uploadDate
            }));
            setContent(mapped);
        } catch (error) {
            console.error('Failed to fetch content:', error);
            toast.error('Failed to load content library');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleUpload = async (files) => {
        const toastId = toast.loading(`Uploading ${files.length} files...`);
        let successCount = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name); // Optional: Allow renaming

            try {
                await api.post('/content/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                toast.error(`Failed: ${file.name}`, { id: toastId }); // Show error but continue
            }
        }

        if (successCount > 0) {
            toast.success(`Uploaded ${successCount}/${files.length} files`, { id: toastId });
            fetchContent();
        } else {
            toast.dismiss(toastId);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        const toastId = toast.loading('Deleting content...');
        try {
            await api.delete(`/content/${id}`);
            setContent(prev => prev.filter(c => c.id !== id));
            toast.success('Content deleted', { id: toastId });
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete content', { id: toastId });
        }
    };

    const filteredContent = content.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || item.type === filter;
        return matchesSearch && matchesFilter;
    });

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
                    <h1 className="text-3xl font-bold text-white">Content Library</h1>
                    <p className="text-muted mt-1">Manage your digital assets and media.</p>
                </div>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                    <Plus size={20} />
                    <span>Upload Content</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-surface/30 p-4 rounded-xl backdrop-blur-md border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                    <input
                        type="text"
                        placeholder="Search content..."
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

            {/* Grid */}
            {filteredContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredContent.map(item => (
                        <ContentCard
                            key={item.id}
                            content={item}
                            onDelete={handleDelete}
                            onPreview={(c) => window.open(c.url, '_blank')}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                        <Filter size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white">No content found</h3>
                    <p className="text-muted mt-2">Try adjusting your filters or upload new content.</p>
                </div>
            )}

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
            />
        </div>
    );
};

export default ContentLibrary;
