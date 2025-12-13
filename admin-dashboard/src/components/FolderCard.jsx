import React from 'react';
import { Folder, MoreVertical, Trash2, Edit } from 'lucide-react';

const FolderCard = ({ folder, onDelete, onEdit, onClick }) => {
    return (
        <div 
            onClick={() => onClick(folder)}
            className="glass-panel p-4 group relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer bg-white/5 hover:bg-white/10"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Folder size={24} />
                </div>
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                            onClick={() => onEdit(folder)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(folder.id)}
                            className="p-1.5 rounded-lg hover:bg-error/10 text-muted hover:text-error transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-bold text-white text-lg line-clamp-1" title={folder.name}>{folder.name}</h4>
                <p className="text-sm text-muted mt-1">{folder.contentIds?.length || 0} items</p>
            </div>
        </div>
    );
};

export default FolderCard;
