import React, { useState } from 'react';
import { MapPin, Monitor, MoreHorizontal, Power, Trash2, Edit } from 'lucide-react';

const FranchiseCard = ({ franchise, onEdit, onDelete }) => {
    const isOnline = franchise.status === 'online';
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="glass-panel p-6 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white">
                    <Monitor size={24} className={isOnline ? 'text-success' : 'text-error'} />
                </div>
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-muted hover:text-white"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-lg shadow-xl z-10">
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    onEdit(franchise);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-white/5 flex items-center gap-2 rounded-t-lg"
                            >
                                <Edit size={16} />
                                Edit Details
                            </button>
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    onDelete(franchise);
                                }}
                                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-b-lg"
                            >
                                <Trash2 size={16} />
                                Delete Partner
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{franchise.name}</h3>
            <div className="flex items-center gap-2 text-muted text-sm mb-4">
                <MapPin size={14} />
                <span>{franchise.location}</span>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Status</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-error'}`}></span>
                        <span className={isOnline ? 'text-success' : 'text-error'}>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Screens</span>
                    <span className="text-white font-medium">{franchise.screens} Devices</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Last Ping</span>
                    <span className="text-white font-medium">{franchise.lastPing}</span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                <button 
                    onClick={() => window.location.href = `/assignments`}
                    className="flex-1 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-medium transition-colors"
                >
                    Manage Content
                </button>
            </div>
        </div>
    );
};

export default FranchiseCard;
