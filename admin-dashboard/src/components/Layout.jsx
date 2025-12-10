import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Folder, Users, Share2, Settings, LogOut, Menu, X, Activity, BarChart3 } from 'lucide-react';
import { cn } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SidebarItem = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-muted hover:bg-white/5 hover:text-white"
            )
        }
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const NavItems = ({ onItemClick }) => (
        <>
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={onItemClick} />
            <SidebarItem to="/live" icon={Activity} label="Live Monitor" onClick={onItemClick} />
            <SidebarItem to="/content" icon={Folder} label="Content Library" onClick={onItemClick} />
            <SidebarItem to="/franchises" icon={Users} label="Franchises" onClick={onItemClick} />
            <SidebarItem to="/assignments" icon={Share2} label="Assignments" onClick={onItemClick} />
            <SidebarItem to="/analytics" icon={BarChart3} label="Analytics" onClick={onItemClick} />
            <SidebarItem to="/settings" icon={Settings} label="Settings" onClick={onItemClick} />
        </>
    );

    return (
        <div className="min-h-screen bg-background text-text flex font-sans">
            {/* Desktop Sidebar */}
            <aside className="w-64 p-6 hidden md:flex flex-col gap-6 sticky top-0 h-screen border-r border-white/5 bg-surface/30 backdrop-blur-xl">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-white">F</span>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        FranchiseOS
                    </h1>
                </div>

                <nav className="flex-1 space-y-2 mt-4 overflow-y-auto pr-2 custom-scrollbar">
                    <NavItems />
                </nav>

                {/* User Info */}
                {user && (
                    <div className="px-4 py-3 bg-white/5 rounded-xl">
                        <p className="text-white font-medium truncate">{user.name}</p>
                        <p className="text-muted text-sm truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full uppercase font-bold">
                            {user.role}
                        </span>
                    </div>
                )}

                <div className="pt-4 border-t border-white/5">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-400 hover:bg-red-500/10 w-full transition-colors group"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 p-6 flex flex-col gap-6 bg-surface border-r border-white/5 z-50 transform transition-transform duration-300 md:hidden",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                            <span className="font-bold text-white">F</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">FranchiseOS</h1>
                    </div>
                    <button 
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 text-muted hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto">
                    <NavItems onItemClick={() => setMobileMenuOpen(false)} />
                </nav>

                {user && (
                    <div className="px-4 py-3 bg-white/5 rounded-xl">
                        <p className="text-white font-medium truncate">{user.name}</p>
                        <p className="text-muted text-sm truncate">{user.email}</p>
                    </div>
                )}

                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-400 hover:bg-red-500/10 w-full transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                    <button 
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 text-muted hover:text-white md:hidden"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="font-bold md:hidden">FranchiseOS</div>
                    <div className="hidden md:block" />
                    {user && (
                        <div className="text-right hidden md:block">
                            <p className="text-white text-sm font-medium">{user.name}</p>
                            <p className="text-muted text-xs">{user.role}</p>
                        </div>
                    )}
                    <div className="md:hidden w-10" /> {/* Spacer for centering */}
                </header>
                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
