'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    email_verified: false,
    created_at: '',
    updated_at: '',
    // Additional read-only info from related tables
    memberships: [],
    consumer_profile: null,
    organizations: []
  });

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setError('Please log in to view your profile');
        setIsLoading(false);
        // Redirect to signin page after a short delay
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
        return;
      }
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken') || (user && user.token);
        if (!token) {
          throw new Error('No access token found. Please log in again.');
        }

        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        // Merge user data with additional profile info
        setProfileData({
          ...data.data.user,
          memberships: data.data.memberships || [],
          consumer_profile: data.data.consumer || null,
          organizations: data.data.memberships?.map(m => ({
            id: m.customer_id,
            name: m.customer_name,
            type: m.customer_status,
            role: m.role_display,
            role_key: m.role_key,
            is_primary: m.is_primary,
            is_active: m.is_active
          })) || []
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile data');
        // If it's an authentication error, redirect to signin
        if (err.message.includes('Session expired') || err.message.includes('No access token')) {
          setTimeout(() => {
            router.push('/signin');
          }, 2000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken') || (user && user.token);
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: profileData.first_name,
          last_name: profileData.last_name
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setProfileData(data.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Update user context with new data
      const updatedUser = { ...user, ...data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      // If it's an authentication error, redirect to signin
      if (err.message.includes('Session expired') || err.message.includes('No access token')) {
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        email_verified: user.email_verified || false,
        created_at: user.created_at || '',
        updated_at: user.updated_at || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">Manage your personal information and account settings</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckIcon className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.first_name || 'Not provided'}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.last_name || 'Not provided'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-1" />
                    Email Address
                  </div>
                </label>
                <div className="flex items-center">
                  <p className="text-gray-900">{profileData.email}</p>
                  {profileData.email_verified ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500 ml-2" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profileData.email_verified ? 'Verified' : 'Not verified'}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Member Since
                  </div>
                </label>
                <p className="text-gray-900">{formatDate(profileData.created_at)}</p>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Last Updated
                  </div>
                </label>
                <p className="text-gray-900">{formatDate(profileData.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Avatar Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Profile Picture</h2>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-semibold">
                  {profileData.first_name?.[0]?.toUpperCase() || 'U'}
                  {profileData.last_name?.[0]?.toUpperCase() || ''}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Profile pictures are generated from your initials
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Update your name above to change your initials
                </p>
              </div>
            </div>
          </div>

          {/* Organizations & Memberships Section */}
          {profileData.organizations && profileData.organizations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Organizations & Roles</h3>
              </div>
              <div className="space-y-4">
                {profileData.organizations.map((org, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{org.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{org.type?.replace('_', ' ') || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {org.role}
                        </span>
                        {org.is_primary && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        org.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consumer Profile Section */}
          {profileData.consumer_profile && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Consumer Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profileData.consumer_profile.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <PhoneIcon className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <p className="text-sm text-gray-900">{profileData.consumer_profile.phone}</p>
                  </div>
                )}
                {profileData.consumer_profile.default_country && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                      Default Country
                    </label>
                    <p className="text-sm text-gray-900">{profileData.consumer_profile.default_country}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marketing Opt-in
                  </label>
                  <p className="text-sm text-gray-900">
                    {profileData.consumer_profile.marketing_opt_in ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Opted In
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Not Opted In
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
