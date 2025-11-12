// API configuration for different environments
export function getBackendURL() {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // Use environment variable if set
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Production logic
    if (isProduction) {
        // If we're on waterreportcard.com, the backend might be on the same domain
        if (hostname === 'waterreportcard.com' || hostname === 'www.waterreportcard.com') {
            return 'https://waterreportcard.com';
        }
        // For other production domains, use the same domain
        return `https://${hostname}`;
    }
    
    // Development - default to localhost
    return 'http://localhost:2018';
}

export const BACKEND_URL = getBackendURL(); 