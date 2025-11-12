// api.js for admin panel
import { LOCAL_STORAGE } from "@/utils/constants";
import axios from "axios";

// Use the same backend URL pattern as the main frontend
const getBackendURL = () => {
    // Always use environment variable if set
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // For development, always use localhost backend
    return 'http://localhost:2018';
};

const baseURL = getBackendURL();

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Adds JWT to request header if it exists
api.interceptors.request.use(
    (config) => {
        // Try to get token from user object in localStorage
        const userData = localStorage.getItem('user');
        let token = null;
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                token = user.token;
            } catch (error) {
                // Silent fail
            }
        }
        
        // Fallback to direct token storage
        if (!token) {
            token = localStorage.getItem('authToken') || localStorage.getItem(LOCAL_STORAGE?.JWT_TOKEN || 'token');
        }

        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepts responses to handle global errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Response Error:', error.response.status, error.response.data);
            if (error.response.status === 401) {
                // Handle unauthorized errors globally, e.g., redirect to login
                console.log('Unauthorized access - redirecting to login...');
                // Optionally clear local storage and redirect
                // localStorage.removeItem('user');
                // localStorage.removeItem('authToken');
                // window.location.href = '/signin'; 
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('API Request Error: No response received', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('API Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;