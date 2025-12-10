import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Loader2, X } from 'lucide-react';
import FranchiseCard from './FranchiseCard';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const AddFranchiseModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({ name: '', location: '', deviceId: '' });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd(formData);
            setFormData({ name: '', location: '', deviceId: '' });
            onClose();
        } catch (error) {
            // Error handled in parent
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add New Franchise</h2>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Franchise Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="e.g. Downtown Center"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Location</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="e.g. 123 Main St, NY"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Device ID</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Unique Device Identifier"
                            value={formData.deviceId}
                            onChange={e => setFormData({ ...formData, deviceId: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted hover:text-white transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FranchiseManager = () => {
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isaddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchFranchises = async () => {
        try {
            const response = await api.get('/franchises');
            // New API returns { success: true, data: [...] }
            const franchiseData = response.data.data || response.data;
            const mapped = franchiseData.map(f => ({
                ...f,
                screens: 1,
                lastPing: f.lastSync ? formatDistanceToNow(new Date(f.lastSync), { addSuffix: true }) : 'Never'
            }));
            setFranchises(mapped);
        } catch (error) {
            console.error('Failed to fetch franchises:', error);
            toast.error('Failed to load franchises');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFranchises();
    }, []);

    const handleAddFranchise = async (data) => {
        try {
            const response = await api.post('/franchises', data);
            const result = response.data.data || response.data;
            
            // Show token to user - IMPORTANT!
            if (result.token) {
                toast.success(
                    <div>
                        <p className="font-bold mb-2">Franchise registered!</p>
                        <p className="text-xs mb-1">Device Token (save this!):</p>
                        <code className="text-xs bg-black/30 px-2 py-1 rounded block break-all">{result.token}</code>
                    </div>,
                    { duration: 10000 }
                );
            } else {
                toast.success('Franchise registered successfully');
            }
            
            fetchFranchises();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to register franchise';
            toast.error(msg);
            throw error;
        }
    };

    const handleDeleteFranchise = async (franchise) => {
        if (!confirm(`Are you sure you want to delete "${franchise.name}"? This action cannot be undone.`)) {
            return;
        }

        const toastId = toast.loading('Deleting franchise...');
        try {
            await api.delete(`/franchises/${franchise.id}`);
            toast.success('Franchise deleted successfully', { id: toastId });
            fetchFranchises();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to delete franchise';
            toast.error(msg, { id: toastId });
        }
    };

    const handleEditFranchise = (franchise) => {
        toast('Edit functionality coming soon!', { icon: '🔧' });
        // TODO: Implement edit modal
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
            <AddFranchiseModal
                isOpen={isaddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddFranchise}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Franchise Management</h1>
                    <p className="text-muted mt-1">Monitor and manage all franchise locations.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                    <Plus size={20} />
                    <span>Add Franchise</span>
                </button>
            </div>

            {/* Map Placeholder */}
            <div className="glass-panel p-1 rounded-xl overflow-hidden h-48 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin size={48} className="mx-auto text-primary mb-2 opacity-50" />
                        <p className="text-white font-medium">Interactive Map View</p>
                        <p className="text-sm text-muted">Coming soon</p>
                    </div>
                </div>
            </div>

            {franchises.length === 0 ? (
                <div className="text-center py-12 text-muted">
                    No franchises found. Click "Add Franchise" to register your first device.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {franchises.map(franchise => (
                        <FranchiseCard 
                            key={franchise.id} 
                            franchise={franchise} 
                            onEdit={handleEditFranchise} 
                            onDelete={handleDeleteFranchise} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
export default FranchiseManager;
