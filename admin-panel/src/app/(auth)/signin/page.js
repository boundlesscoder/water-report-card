"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../../../context/UserContext";
import Link from "next/link";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import api from "../../../services/api";

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useUser();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [submitError, setSubmitError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        isConsumerUser: false,
        errorType: ''
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const getModalContent = (errorType, isConsumerUser, errorMessage) => {
        switch (errorType) {
            case 'access_denied':
                return {
                    title: 'Access Restricted',
                    message: 'You have successfully authenticated, but your account type does not have access to the Water Report Card Admin Panel.',
                    isConsumerUser: true,
                    errorType: 'access_denied'
                };
            case 'authentication_failed':
                return {
                    title: 'Authentication Failed',
                    message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
                    isConsumerUser: false,
                    errorType: 'authentication_failed'
                };
            case 'login_failed':
                return {
                    title: 'Login Failed',
                    message: 'Unable to complete the login process. Please try again or contact support if the problem persists.',
                    isConsumerUser: false,
                    errorType: 'login_failed'
                };
            case 'server_error':
                return {
                    title: 'Server Error',
                    message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
                    isConsumerUser: false,
                    errorType: 'server_error'
                };
            default:
                return {
                    title: 'Login Error',
                    message: errorMessage || 'An unexpected error occurred. Please try again.',
                    isConsumerUser: false,
                    errorType: 'unknown'
                };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setIsSubmitting(true);

        try {
            const res = await api.post("/api/auth/login", formData);
            // API route returns: { accessToken, user, memberships, consumer, ... }
            const { accessToken, user, memberships, consumer } = res.data;

            // Store user data
            const userData = {
                ...user,
                memberships: memberships || [],
                consumer: consumer,
                token: accessToken,
                tokenExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
            };

            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("authToken", accessToken);

            // Update UserContext immediately
            setUser(userData);

            router.push("/dashboard");
        } catch (err) {
            console.error('Login error:', err);
            
            // Handle axios error response
            if (err.response) {
                const json = err.response.data;
                
                // Show modal for all authentication/authorization failures
                if (json?.showModal) {
                    const content = getModalContent(json.errorType, json.isConsumerUser, json.error);
                    setModalContent(content);
                    setShowAccessDeniedModal(true);
                    setSubmitError("");
                    return;
                }
                setSubmitError(json?.error || json?.message || "Login failed");
            } else {
                setSubmitError("Unexpected error. Try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Water Report Card</h1>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input 
                                id="email" 
                                type="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {submitError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{submitError}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link 
                            href="/forgot-password" 
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-blue-100 text-sm">
                        Copyright © 2025 waterreportcard.com
                    </p>
                    <p className="text-blue-100 text-sm">
                        All rights reserved.
                    </p>
                </div>
            </div>

            {/* Access Denied Modal */}
            {showAccessDeniedModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {modalContent.title}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAccessDeniedModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <div className="mb-6">
                                <p className="text-sm text-gray-600 mb-4">
                                    {modalContent.message}
                                </p>
                            
                                
                                {modalContent.errorType === 'authentication_failed' && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                        <h4 className="text-sm font-medium text-red-900 mb-2">
                                            Troubleshooting:
                                        </h4>
                                        <ul className="text-sm text-red-800 space-y-1">
                                            <li>• Check your email address for typos</li>
                                            <li>• Try resetting your password</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowAccessDeniedModal(false)}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                >
                                    {modalContent.isConsumerUser ? 'Try Different Account' : 'Try Again'}
                                </button>
                                {modalContent.isConsumerUser && (
                                    <a
                                        href="https://waterreportcard.com"
                                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 text-center rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-center"
                                    >
                                        Visit Main Site
                                    </a>
                                )}
                            </div>
                            
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
                                    {modalContent.isConsumerUser 
                                        ? 'Need admin access? Contact your system administrator.'
                                        : 'Having trouble? Contact support team "dave@waterreportcard.com.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}