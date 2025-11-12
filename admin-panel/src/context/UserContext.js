"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AbilityProvider } from "./AbilityContext";

const UserContext = createContext({
    user: null,
    setUser: () => {},
    refreshUserData: async () => {},
    logout: () => {},
    isLoading: true,
});

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    
    const publicPaths = [
        "/signin", 
        "/forgot-password", 
        "/reset-password", 
        "/accept-invite",
        "/verify-email"
    ];

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = () => {
            
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
                setIsLoading(false);
                setHasCheckedAuth(true);
                return;
            }
            
            const stored = localStorage.getItem("user");
            if (!stored) {
                setIsLoading(false);
                setHasCheckedAuth(true);
                return;
            }

            try {
                const parsed = JSON.parse(stored);
                
                if (!parsed.token || new Date(parsed.tokenExpiry) < new Date()) {
                    throw new Error("Expired or invalid token");
                }
                
                setUser(parsed);
            } catch (error) {
                localStorage.removeItem("user");
                localStorage.removeItem("authToken");
            } finally {
                setIsLoading(false);
                setHasCheckedAuth(true);
            }
        };

        // Add a small delay to ensure hydration is complete
        const timer = setTimeout(checkAuth, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => setIsHydrated(true), []);

    // Handle redirects only after authentication check is complete
    useEffect(() => {
        if (!isHydrated || !hasCheckedAuth || isRedirecting) return;

        const isAdminRoute = pathname.startsWith('/dashboard');
        const isPublicPath = publicPaths.includes(pathname);

        // Check if user has admin panel access
        // Allow: any non-consumer (no consumer profile) OR any active non-wrc_user membership OR legacy is_admin
        const hasAdminAccess = user && (
            user.is_admin ||
            (user.consumer == null) ||
            (user.memberships && user.memberships.some(m => m.is_active && m.role_key !== 'wrc_user'))
        );

        // If user is not logged in and trying to access protected route
        if (!user && !isPublicPath) {
            setIsRedirecting(true);
            router.push("/signin");
            return;
        }

        // If user is logged in but doesn't have admin access and trying to access admin route
        if (user && !hasAdminAccess && isAdminRoute) {
            setIsRedirecting(true);
            router.push("/signin");
            return;
        }

        // If user is logged in with admin access and on signin page, redirect to dashboard
        if (user && hasAdminAccess && pathname === "/signin") {
            setIsRedirecting(true);
            router.push("/dashboard");
            return;
        }

    }, [user, pathname, isHydrated, hasCheckedAuth, router, isRedirecting]);

    // Reset redirecting flag when pathname changes
    useEffect(() => {
        setIsRedirecting(false);
    }, [pathname]);

    // Listen for storage changes (when user logs in from another tab/window)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "user") {
                if (e.newValue) {
                    try {
                        const parsed = JSON.parse(e.newValue);
                        setUser(parsed);
                    } catch (error) {
                    }
                } else {
                    setUser(null);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        setUser(null);
        router.push("/signin");
    };

    // Show loading spinner only during initial authentication check
    if (!isHydrated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                    <p className="mt-2 text-sm text-gray-500">Initializing application...</p>
                </div>
            </div>
        );
    }

    // Fallback for any unexpected state
    if (!hasCheckedAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <UserContext.Provider value={{ 
            user, 
            setUser, 
            refreshUserData: async () => {},
            logout,
            isLoading
        }}>
            <AbilityProvider role={user?.primaryRole || user?.role || "user"}>{children}</AbilityProvider>
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);