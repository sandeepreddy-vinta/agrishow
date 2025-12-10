import React, { useState } from 'react';
import { User, Shield, MoreVertical, Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState([
        { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', lastActive: 'Now' },
        { id: 2, name: 'John Doe', email: 'john@franchise.com', role: 'manager', status: 'active', lastActive: '2h ago' },
        { id: 3, name: 'Jane Smith', email: 'jane@franchise.com', role: 'viewer', status: 'inactive', lastActive: '3d ago' },
    ]);

    const handleRoleChange = (userId, newRole) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast.success('User role updated');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-muted mt-1">Manage access and permissions.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                    <Plus size={20} />
                    <span>Invite User</span>
                </button>
            </div>

            <div className="glass-panel overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-sm text-muted uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Last Active</th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{user.name}</p>
                                            <p className="text-sm text-muted">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-500/10 text-gray-400'}`}>
                                        {user.status === 'active' ? <Check size={12} /> : <X size={12} />}
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted">{user.lastActive}</td>
                                <td className="px-6 py-4">
                                    <button className="text-muted hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
