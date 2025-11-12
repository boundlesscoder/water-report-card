'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePlatformAdminRoute } from '../../../hooks/useRouteProtection';
import {
  UserGroupIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import InfoBox from '../../../components/dashboard/InfoBox';
import SalesChart from '../../../components/dashboard/SalesChart';
import DirectChat from '../../../components/dashboard/DirectChat';
import TodoList from '../../../components/dashboard/TodoList';
import Calendar from '../../../components/dashboard/Calendar';
import VisitorsMap from '../../../components/dashboard/VisitorsMap';
import SalesGraph from '../../../components/dashboard/SalesGraph';

const DashboardV1Page = () => {
  // Route protection - only Platform Admins can access this page
  const { isPlatformAdmin, isLoading } = usePlatformAdminRoute();
  
  const [users, setUsers] = useState([]);
  const [userStatsLoading, setUserStatsLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch user data for statistics
  const fetchUsers = async () => {
    setUserStatsLoading(true);
    try {
      console.log('Fetching user statistics from API...');
      
      // Get the access token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        // If no token, the usePlatformAdminRoute hook will handle redirect
        console.log('No auth token found, route protection will handle redirect');
        return;
      }
      
      const response = await fetch('/api/auth/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('User stats API response status:', response.status);
      
      if (!response.ok) {
        // Handle 401 Unauthorized - clear token and let route protection handle redirect
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          console.log('Token expired, route protection will handle redirect');
          return;
        }
        
        let errorMessage = `Failed to fetch user stats (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('User stats API response data:', data);
      
      if (data.success) {
        // Set mock users array with stats for compatibility with existing UI
        const mockUsers = Array(data.stats.totalUsers).fill(null).map((_, index) => ({
          id: `mock-${index}`,
          email_verified: index < data.stats.verifiedUsers,
          memberships: index < data.stats.platformAdmins ? [{ role_key: 'waterreportcard_super_admin' }] : [{ role_key: 'wrc_user' }]
        }));
        setUsers(mockUsers);
      } else {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      setModalError(error.message || 'Failed to fetch user statistics');
      setShowErrorModal(true);
      // Set empty array on error to avoid breaking the UI
      setUsers([]);
    } finally {
      setUserStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calculate user statistics
  const totalUsers = users.length;
  const verifiedUsers = users.filter(user => user.email_verified).length;
  const platformAdmins = users.filter(user => user.memberships?.some(m => m.role_key === 'waterreportcard_super_admin')).length;
  const unverifiedUsers = users.filter(user => !user.email_verified).length;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const infoBoxes = [
    {
      title: 'Total Users',
      value: userStatsLoading ? '...' : totalUsers.toString(),
      icon: UserGroupIcon,
      color: 'green',
      trend: 12
    },
    {
      title: 'Verified Users',
      value: userStatsLoading ? '...' : verifiedUsers.toString(),
      icon: CheckCircleIcon,
      color: 'green',
      trend: 8
    },
    {
      title: 'Platform Admins',
      value: userStatsLoading ? '...' : platformAdmins.toString(),
      icon: BuildingOfficeIcon,
      color: 'green',
      trend: 2
    },
    {
      title: 'Unverified Users',
      value: userStatsLoading ? '...' : unverifiedUsers.toString(),
      icon: XCircleIcon,
      color: 'red',
      trend: -3
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Show access denied if not Platform Admin
  if (!isPlatformAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Conditional rendering based on authentication status
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Info Boxes */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {infoBoxes.map((box, index) => (
            <InfoBox
              key={index}
              title={box.title}
              value={box.value}
              icon={box.icon}
              color={box.color}
              trend={box.trend}
            />
          ))}
        </motion.div>

        {/* Charts and Widgets Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <SalesChart />
          </div>

          {/* Direct Chat */}
          <div>
            <Calendar />
          </div>
        </motion.div>

        {/* Second Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitors Map */}
          <div>
            <VisitorsMap />
          </div>

          {/* Sales Graph */}
          <div className="lg:col-span-2">
            <SalesGraph />
          </div>
        </motion.div>
      </motion.div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">{modalError}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    fetchUsers();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardV1Page;
