import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Request interceptor - Add auth headers
api.interceptors.request.use(
    (config) => {
        // Add JWT token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Also add API key for backwards compatibility
        const apiKey = import.meta.env.VITE_API_KEY;
        if (apiKey) {
            config.headers['X-API-Key'] = apiKey;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
            return Promise.reject({
                response: {
                    data: { message: 'Network error. Please check your connection.' }
                }
            });
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // Only redirect if not already on login page and not a login request
            const isLoginRequest = error.config?.url?.includes('/auth/login');
            const isOnLoginPage = window.location.pathname === '/login';
            
            if (!isLoginRequest && !isOnLoginPage) {
                // Clear stored auth data
                localStorage.removeItem('auth_token');
                // Redirect to login
                window.location.href = '/login';
            }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.warn('Access forbidden:', error.response.data?.message);
        }

        // Handle 500 Server errors
        if (error.response?.status >= 500) {
            console.error('Server error:', error.response.data);
        }

        return Promise.reject(error);
    }
);

// Helper methods for common operations
export const apiHelper = {
    // GET with better error handling
    get: async (url, config = {}) => {
        const response = await api.get(url, config);
        return response.data;
    },

    // POST with better error handling
    post: async (url, data = {}, config = {}) => {
        const response = await api.post(url, data, config);
        return response.data;
    },

    // PUT with better error handling
    put: async (url, data = {}, config = {}) => {
        const response = await api.put(url, data, config);
        return response.data;
    },

    // DELETE with better error handling
    delete: async (url, config = {}) => {
        const response = await api.delete(url, config);
        return response.data;
    },

    // Upload file with progress
    uploadFile: async (url, formData, onProgress = null) => {
        const response = await api.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress ? (e) => {
                const percent = Math.round((e.loaded * 100) / e.total);
                onProgress(percent);
            } : undefined,
        });
        return response.data;
    },
};

export default api;
