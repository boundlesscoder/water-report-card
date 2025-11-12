import axios from 'axios';

// Base API URL - Use the same logic as the main API service
const getBackendURL = () => {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // Use environment variable if set
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Force localhost for development when running on localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
        return 'http://localhost:2018';
    }
    
    // Production logic
    if (isProduction) {
        // If we're on waterreportcard.com, the backend might be on the same domain
        if (
            hostname === 'waterreportcard.com' ||
            hostname === 'www.waterreportcard.com' ||
            hostname === 'admin.waterreportcard.com'
        ) {
            return 'https://waterreportcard.com';
        }
        // For other production domains, use the same domain
        return `https://${hostname}`;
    }
    
    // Development - default to backend port
    return 'http://localhost:2018';
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: getBackendURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies
    const token = localStorage.getItem('authToken') || getCookie('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - show access denied message
      console.error('Access denied');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export { apiClient };
