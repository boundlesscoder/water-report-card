"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';

// Hook to protect routes that require Platform Admin access
export const usePlatformAdminRoute = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If no user (logged out), redirect to signin
    if (!user) {
      router.push('/signin');
      return;
    }

    // Check if user is Platform Admin
    const isPlatformAdmin = user && (
      user.is_admin || // Legacy admin flag
      (user.memberships && user.memberships.some(m => m.role_key === 'waterreportcard_super_admin'))
    );

    // If user is not a Platform Admin, redirect to dashboard
    if (!isPlatformAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Return whether user is Platform Admin
  const isPlatformAdmin = user && (
    user.is_admin || // Legacy admin flag
    (user.memberships && user.memberships.some(m => m.role_key === 'waterreportcard_super_admin'))
  );

  return {
    isPlatformAdmin,
    isLoading,
    user
  };
};

// Hook to protect routes that require any admin access
export const useAdminRoute = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If no user (logged out), redirect to signin
    if (!user) {
      router.push('/signin');
      return;
    }

    // Unified admin access rule
    const hasAdminAccess = user && (
      (user.consumer == null) ||
      (user.memberships && user.memberships.some(m => m.is_active && m.role_key !== 'wrc_user'))
    );

    // If user doesn't have admin access, redirect to signin
    if (!hasAdminAccess) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  // Return whether user has admin access
  const hasAdminAccess = user && (
    (user.consumer == null) ||
    (user.memberships && user.memberships.some(m => m.is_active && m.role_key !== 'wrc_user'))
  );

  return {
    hasAdminAccess,
    isLoading,
    user
  };
};
