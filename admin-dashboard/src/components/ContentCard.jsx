import React from 'react';
import { Play, Image, MoreVertical, Trash2, Eye } from 'lucide-react';

const ContentCard = ({ content, onDelete, onPreview }) => {
    const isVideo = content.type === 'video';

    return (
        <div className="glass-panel group relative overflow-hidden transition-all hover:scale-[1.02]">
            <div className="aspect-video bg-black/50 relative">
                {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Play size={32} className="text-white opacity-50" />
                    </div>
                ) : (
                    <img src={content.url} alt={content.title} className="w-full h-full object-cover" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                        onClick={() => onPreview(content)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Preview"
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        onClick={() => onDelete(content.id)}
                        className="p-2 rounded-full bg-error/10 hover:bg-error/20 text-error transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h4 className="font-medium text-white line-clamp-1" title={content.title}>{content.title}</h4>
                        <p className="text-sm text-muted">{content.size} • {content.duration || 'Image'}</p>
                    </div>
                    <button className="text-muted hover:text-white">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentCard;
