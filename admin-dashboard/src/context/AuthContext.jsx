import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    // Check if token is valid on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');
            if (storedToken) {
                try {
                    // Verify token with backend
                    const response = await api.get('/auth/me', {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    
                    if (response.data.success) {
                        setUser(response.data.data);
                        setToken(storedToken);
                    } else {
                        // Invalid token, clear it
                        localStorage.removeItem('auth_token');
                        setToken(null);
                    }
                } catch (error) {
                    console.error('Auth verification failed:', error);
                    localStorage.removeItem('auth_token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (response.data.success) {
                const { token: newToken, user: userData } = response.data.data;
                
                localStorage.setItem('auth_token', newToken);
                setToken(newToken);
                setUser(userData);
                
                return { success: true, user: userData };
            }
            
            return { success: false, error: response.data.message || 'Login failed' };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            return { success: false, error: message };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (token) {
                await api.post('/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
        }
    }, [token]);

    const refreshToken = useCallback(async () => {
        try {
            const response = await api.post('/auth/refresh', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                const newToken = response.data.data.token;
                localStorage.setItem('auth_token', newToken);
                setToken(newToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }, [token]);

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        refreshToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
