import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * AuthGuard - Protects routes that require authentication
 */
const AuthGuard = ({ children, requiredRole = null }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="animate-spin text-primary" />
                    <p className="text-muted">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role if required
    if (requiredRole && user?.role !== requiredRole) {
        // Check if user has sufficient permissions
        const roleHierarchy = { admin: 3, manager: 2, viewer: 1 };
        const userLevel = roleHierarchy[user?.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        if (userLevel < requiredLevel) {
            return (
                <div className="h-screen w-full flex items-center justify-center bg-background">
                    <div className="glass-panel p-8 text-center max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
                        <p className="text-muted mb-6">
                            You don't have permission to access this page.
                            Required role: <span className="text-primary">{requiredRole}</span>
                        </p>
                        <Navigate to="/" replace />
                    </div>
                </div>
            );
        }
    }

    return children;
};

/**
 * GuestGuard - Protects routes that should only be accessible when NOT authenticated
 */
export const GuestGuard = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
        const from = location.state?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    return children;
};

export default AuthGuard;
