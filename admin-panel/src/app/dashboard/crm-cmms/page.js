'use client';

import React, { useState } from 'react';
import { usePlatformAdminRoute } from '../../../hooks/useRouteProtection';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import BusinessDashboard from '../../../components/crm-cmms/BusinessDashboard';
import BusinessModuleManager from '../../../components/crm-cmms/BusinessModuleManager';
import CustomerHierarchy from '../../../components/crm-cmms/CustomerHierarchy';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  // Route protection - only Platform Admins can access this page
  const { isPlatformAdmin, isLoading } = usePlatformAdminRoute();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      name: 'Business Dashboard',
      icon: ChartBarIcon,
      description: 'Overview of operations and key metrics'
    },
    {
      id: 'hierarchy',
      name: 'Customer Hierarchy',
      icon: UserGroupIcon,
      description: 'Accounts → Locations → Buildings → Floors → Rooms'
    },
    {
      id: 'manage',
      name: 'Data Management',
      icon: Cog6ToothIcon,
      description: 'Manage all business data organized by function'
    },
    {
      id: 'users',
      name: 'User Management',
      icon: UserGroupIcon,
      description: 'Manage user accounts and permissions'
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      icon: DocumentTextIcon,
      description: 'Generate reports and view analytics'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <BusinessDashboard />;
      case 'hierarchy':
        return <CustomerHierarchy />;
      case 'manage':
        return <BusinessModuleManager />;
      case 'users':
        return <UserManagementPlaceholder />;
      case 'reports':
        return <ReportsPlaceholder />;
      default:
        return <BusinessDashboard />;
    }
  };

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
      <div className="space-y-6">
        {/* Header - matching existing CRM style */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              CRM & CMMS Administration
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your customer relationships and maintenance operations
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Navigation Tabs - matching existing CRM grid style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm px-3 py-2 rounded flex items-center justify-center ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div>
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

// Placeholder components for tabs not yet implemented
const UserManagementPlaceholder = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <div className="text-center">
      <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
      <p className="text-gray-600 max-w-sm mx-auto">
        User management functionality will be implemented here. This will include 
        user accounts, roles, permissions, and access control.
      </p>
    </div>
  </div>
);

const ReportsPlaceholder = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <div className="text-center">
      <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
      <p className="text-gray-600 max-w-sm mx-auto">
        Comprehensive reporting and analytics dashboard will be available here. 
        Generate custom reports for customers, maintenance, and business operations.
      </p>
    </div>
  </div>
);

export default AdminPanel;
