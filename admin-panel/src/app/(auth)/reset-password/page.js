"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({ 
        password: "", 
        confirmPassword: "" 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [token, setToken] = useState("");

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (!tokenParam) {
            setError("Invalid or missing reset token");
        } else {
            setToken(tokenParam);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    token, 
                    password: formData.password 
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json?.error || "Failed to reset password");
                return;
            }

            setIsSuccess(true);
        } catch (err) {
            setError("Unexpected error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
                <div className="max-w-md w-full space-y-8 p-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">Water Report Card</h1>
                        <p className="text-blue-100">Password Reset Complete</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successfully</h2>
                            <p className="text-gray-600 mb-6">
                                Your password has been reset successfully. You can now sign in with your new password.
                            </p>
                            <Link 
                                href="/signin" 
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-block text-center"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-blue-100 text-sm">
                            Copyright © 2025 waterreportcard.com All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
                <div className="max-w-md w-full space-y-8 p-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">Water Report Card</h1>
                        <p className="text-blue-100">Invalid Reset Link</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
                            <p className="text-gray-600 mb-6">
                                This password reset link is invalid or has expired. Please request a new password reset.
                            </p>
                            <Link 
                                href="/forgot-password" 
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-block text-center"
                            >
                                Request New Reset Link
                            </Link>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-blue-100 text-sm">
                            Copyright © 2025 waterreportcard.com All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Water Report Card</h1>
                    <p className="text-blue-100">Set new password</p>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input 
                                id="password" 
                                type="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your new password"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <input 
                                id="confirmPassword" 
                                type="password" 
                                value={formData.confirmPassword} 
                                onChange={handleChange} 
                                required 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm your new password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link 
                            href="/signin" 
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-blue-100 text-sm">
                        Copyright © 2025 waterreportcard.com All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
