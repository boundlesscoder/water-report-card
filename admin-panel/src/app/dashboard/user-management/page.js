"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAdminRoute } from '../../../hooks/useRouteProtection';
import { useUser } from '../../../context/UserContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';
import CustomerAssignmentModal from '../../../components/user-management/CustomerAssignmentModal';
import InviteUserModal from '../../../components/user-management/InviteUserModal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function UserManagementPage() {
  // Route protection - allow authenticated users with appropriate roles
  const { hasAdminAccess, isLoading } = useAdminRoute();
  const { user } = useUser();

  // Get token function
  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.token;
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  }, []);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActiveStatus, setFilterActiveStatus] = useState('active'); // 'all', 'active', 'inactive'
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [userToInactive, setUserToInactive] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [userToActivate, setUserToActivate] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCustomerAssignmentModal, setShowCustomerAssignmentModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Include inactive users based on filter
      const includeInactive = filterActiveStatus === 'all' || filterActiveStatus === 'inactive';
      console.log('Fetching users from API... filterActiveStatus:', filterActiveStatus, 'includeInactive:', includeInactive);
      
      const response = await api.get(`/api/auth/users?includeInactive=${includeInactive}`);
      const data = response.data;
      
      console.log('API response:', {
        success: data.success,
        totalUsers: data.users?.length,
        activeUsers: data.users?.filter(u => u.is_active).length,
        inactiveUsers: data.users?.filter(u => !u.is_active).length
      });
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Handle axios error response
      if (error.response) {
        const errorData = error.response.data;
        setModalError(errorData?.error || errorData?.message || `Failed to fetch users (${error.response.status})`);
      } else {
        setModalError(error.message || 'Failed to fetch users');
      }
      setShowErrorModal(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterActiveStatus]);

  const handleDeleteUser = async (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleInactiveUser = async (user) => {
    setUserToInactive(user);
    setShowInactiveModal(true);
  };

  const confirmInactiveUser = async () => {
    if (!userToInactive) return;
    
    setIsDeactivating(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setModalError('No authentication token found');
        setShowErrorModal(true);
        return;
      }
      
      const response = await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userToInactive.id, action: 'inactive' }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          return;
        }
        
        let errorMessage = `Failed to deactivate user (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('User deactivated successfully:', data);
      
      // Refresh the users list
      await fetchUsers();
      
      // Close modal
      setShowInactiveModal(false);
      setUserToInactive(null);
      
    } catch (error) {
      console.error('Error deactivating user:', error);
      setModalError(error.message);
      setShowErrorModal(true);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActiveUser = async (user) => {
    setUserToActivate(user);
    setShowActiveModal(true);
  };

  const confirmActiveUser = async () => {
    if (!userToActivate) return;
    
    setIsActivating(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setModalError('No authentication token found');
        setShowErrorModal(true);
        return;
      }
      
      const response = await fetch(`/api/auth/users/${userToActivate.id}/active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          return;
        }
        
        let errorMessage = `Failed to reactivate user (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('User reactivated successfully:', data);
      
      // Refresh the users list
      await fetchUsers();
      
      // Close modal
      setShowActiveModal(false);
      setUserToActivate(null);
      
    } catch (error) {
      console.error('Error reactivating user:', error);
      setModalError(error.message);
      setShowErrorModal(true);
    } finally {
      setIsActivating(false);
    }
  };

  const handleInviteUser = () => {
    setShowInviteModal(true);
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    fetchUsers(); // Refresh users list after successful invitation
  };


  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setModalError('No authentication token found');
        setShowErrorModal(true);
        return;
      }
      
      const response = await fetch('/api/auth/users', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          return;
        }
        
        let errorMessage = `Failed to delete user (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            console.error('Backend error details:', errorData.details);
          }
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('User deleted successfully:', data);
      
      // Refresh the users list
      await fetchUsers();
      
      // Close modal
      setShowDeleteModal(false);
      setUserToDelete(null);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setModalError(error.message || 'Failed to delete user');
      setShowErrorModal(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
      user.memberships?.some(m => m.role_key === filterRole);
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'verified' && user.email_verified) ||
      (filterStatus === 'unverified' && !user.email_verified);
    
    const matchesActiveStatus = filterActiveStatus === 'all' ||
      (filterActiveStatus === 'active' && user.is_active) ||
      (filterActiveStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus && matchesActiveStatus;
  });

  const getRoleDisplayName = (roleKey) => {
    const roleNames = {
      // New role hierarchy
      'waterreportcard_super_admin': 'WaterReportCard Super Admin',
      'liquoslabs_general_manager': 'LiquosLabs General Manager',
      'customer_service_manager': 'Customer Service Manager',
      'accounting_manager': 'Accounting Manager',
      'channel_sales_manager': 'Channel/Sales Manager',
      'it_manager': 'IT Manager',
      'tech_support': 'Tech Support',
      'accounting_staff': 'Accounting Dept. Staff',
      'platform_field_sales': 'Field Sales (Platform)',
      'platform_account_manager': 'Account Manager (Platform)',
      'platform_contractor': 'Contractor (Platform)',
      'platform_developer': 'Developer (Platform)',
      'national_account_admin': 'National Account Admin',
      'customer_admin': 'Customer administrator (Regional Account)',
      // 'regional_account_admin' removed (alias of customer_admin)
      'customer_account_admin': 'Customer Account Admin',
      'branch_manager': 'Branch Manager',
      'sales_manager': 'Sales Manager',
      'accounting_dept_manager': 'Accounting Dept. Manager',
      'service_manager': 'Service Manager',
      'location_account_manager': 'Account Manager (Location)',
      'location_field_sales': 'Field Sales (Location)',
      'branch_key_employee': 'Branch Key Employee',
      'field_technician': 'Field Technician',
      'third_party_vendor': 'Third Party Vendor',
      'wrc_user': 'Water Report Card (B2C) User',
      
    };
    return roleNames[roleKey] || roleKey;
  };

  const getRoleBadgeColor = (roleKey) => {
    switch (roleKey) {
      // New role hierarchy
      case 'waterreportcard_super_admin': return 'bg-purple-100 text-purple-800';
      case 'liquoslabs_general_manager': return 'bg-indigo-100 text-indigo-800';
      case 'customer_service_manager': return 'bg-blue-100 text-blue-800';
      case 'accounting_manager': return 'bg-green-100 text-green-800';
      case 'channel_sales_manager': return 'bg-orange-100 text-orange-800';
      case 'it_manager': return 'bg-cyan-100 text-cyan-800';
      case 'tech_support': return 'bg-gray-100 text-gray-800';
      case 'accounting_staff': return 'bg-green-100 text-green-800';
      case 'platform_field_sales': return 'bg-orange-100 text-orange-800';
      case 'platform_account_manager': return 'bg-blue-100 text-blue-800';
      case 'platform_contractor': return 'bg-yellow-100 text-yellow-800';
      case 'platform_developer': return 'bg-cyan-100 text-cyan-800';
      case 'national_account_admin': return 'bg-red-100 text-red-800';
      case 'customer_admin': return 'bg-red-100 text-red-800';
      case 'regional_account_admin': return 'bg-orange-100 text-orange-800';
      case 'customer_account_admin': return 'bg-pink-100 text-pink-800';
      case 'branch_manager': return 'bg-yellow-100 text-yellow-800';
      case 'sales_manager': return 'bg-orange-100 text-orange-800';
      case 'accounting_dept_manager': return 'bg-green-100 text-green-800';
      case 'service_manager': return 'bg-blue-100 text-blue-800';
      case 'location_account_manager': return 'bg-blue-100 text-blue-800';
      case 'location_field_sales': return 'bg-orange-100 text-orange-800';
      case 'branch_key_employee': return 'bg-teal-100 text-teal-800';
      case 'field_technician': return 'bg-gray-100 text-gray-800';
      case 'third_party_vendor': return 'bg-gray-100 text-gray-800';
      case 'wrc_user': return 'bg-gray-100 text-gray-800';
      
      default: return 'bg-gray-100 text-gray-800';
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

  if (!hasAdminAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need to be logged in to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {(() => {
                const highest = user?.memberships?.filter(m => m.is_active).sort((a,b) => (b.hierarchy_lvl||0)-(a.hierarchy_lvl||0))[0];
                const roleKey = highest?.role_key;
                const names = {
                  waterreportcard_super_admin: 'WaterReportCard Super Admin',
                  liquoslabs_general_manager: 'LiquosLabs General Manager',
                  customer_service_manager: 'Customer Service Manager',
                  accounting_manager: 'Accounting Manager',
                  channel_sales_manager: 'Channel/Sales Manager',
                  it_manager: 'IT Manager',
                  tech_support: 'Tech Support',
                  accounting_staff: 'Accounting Dept. Staff',
                  platform_field_sales: 'Field Sales (Platform)',
                  platform_account_manager: 'Account Manager (Platform)',
                  platform_contractor: 'Contractor (Platform)',
                  platform_developer: 'Developer (Platform)',
                  national_account_admin: 'National Account Admin',
                  customer_admin: 'Customer administrator (Regional Account)',
                  customer_account_admin: 'Customer Account Admin',
                  branch_manager: 'Branch Manager',
                  sales_manager: 'Sales Manager',
                  accounting_dept_manager: 'Accounting Dept. Manager',
                  service_manager: 'Service Manager',
                  location_account_manager: 'Account Manager (Location)',
                  location_field_sales: 'Field Sales (Location)',
                  branch_key_employee: 'Branch Key Employee',
                  field_technician: 'Field Technician',
                  third_party_vendor: 'Third Party Vendor'
                };
                return names[roleKey] || 'User Management';
              })()}
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCustomerAssignmentModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <BuildingOfficeIcon className="w-5 h-5" />
              Assign Customers
            </button>
            <button 
              onClick={handleInviteUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Invite User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Current Filter:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              filterActiveStatus === 'active' ? 'bg-green-100 text-green-800' :
              filterActiveStatus === 'inactive' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {filterActiveStatus === 'active' ? 'Active Users Only' :
               filterActiveStatus === 'inactive' ? 'Inactive Users Only' :
               'All Users (Active + Inactive)'}
            </span>
            <span className="text-gray-500">
              ({filteredUsers.length} users shown)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <select
                value={filterActiveStatus}
                onChange={(e) => setFilterActiveStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active Users</option>
                <option value="inactive">Inactive Users</option>
                <option value="all">All Users</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="waterreportcard_super_admin">WaterReportCard Super Admin</option>
                <option value="liquoslabs_general_manager">LiquosLabs General Manager</option>
                <option value="customer_service_manager">Customer Service Manager</option>
                <option value="accounting_manager">Accounting Manager</option>
                <option value="channel_sales_manager">Channel/Sales Manager</option>
                <option value="it_manager">IT Manager</option>
                <option value="tech_support">Tech Support</option>
                <option value="accounting_staff">Accounting Dept. Staff</option>
                <option value="platform_field_sales">Field Sales (Platform)</option>
                <option value="platform_account_manager">Account Manager (Platform)</option>
                <option value="platform_contractor">Contractor (Platform)</option>
                <option value="platform_developer">Developer (Platform)</option>
                <option value="national_account_admin">National Account Admin</option>
                <option value="customer_admin">Customer administrator (Regional Account)</option>
                <option value="customer_account_admin">Customer Account Admin</option>
                <option value="branch_manager">Branch Manager</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="accounting_dept_manager">Accounting Dept. Manager</option>
                <option value="service_manager">Service Manager</option>
                <option value="location_account_manager">Account Manager (Location)</option>
                <option value="location_field_sales">Field Sales (Location)</option>
                <option value="branch_key_employee">Branch Key Employee</option>
                <option value="field_technician">Field Technician</option>
                <option value="third_party_vendor">Third Party Vendor</option>
                <option value="wrc_user">Water Report Card (B2C) User</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="verified">Email Verified</option>
                <option value="unverified">Email Unverified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No users have been created yet.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {user.first_name} {user.last_name}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.memberships?.map((membership) => (
                            <span
                              key={membership.id}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(membership.role_key)}`}
                            >
                              {getRoleDisplayName(membership.role_key)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_verified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.email_verified ? (
                            <><CheckCircleIcon className="w-3 h-3 mr-1" /> Verified</>
                          ) : (
                            <><XCircleIcon className="w-3 h-3 mr-1" /> Unverified</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {user.is_active ? (
                            <button 
                              onClick={() => handleInactiveUser(user)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Deactivate user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleActiveUser(user)}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivate user"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isDeleting}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{userToDelete.first_name} {userToDelete.last_name}</strong> ({userToDelete.email})?
              </p>
              <p className="text-sm text-red-600 mb-4">
                This action cannot be undone. The user will be permanently removed from the system.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Confirmation Modal */}
      {showInactiveModal && userToInactive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Deactivate User</h3>
              </div>
              <button
                onClick={() => {
                  setShowInactiveModal(false);
                  setUserToInactive(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isDeactivating}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to deactivate <strong>{userToInactive.first_name} {userToInactive.last_name}</strong> ({userToInactive.email})?
              </p>
              <p className="text-sm text-yellow-600 mb-4">
                The user will be marked as inactive and will not appear in the active users list. This action can be reversed.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowInactiveModal(false);
                    setUserToInactive(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isDeactivating}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmInactiveUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeactivating}
                >
                  {isDeactivating ? 'Deactivating...' : 'Deactivate User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {showActiveModal && userToActivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Reactivate User</h3>
              </div>
              <button
                onClick={() => {
                  setShowActiveModal(false);
                  setUserToActivate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isActivating}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to reactivate <strong>{userToActivate.first_name} {userToActivate.last_name}</strong> ({userToActivate.email})?
              </p>
              <p className="text-sm text-green-600 mb-4">
                The user will be marked as active and will be able to access the system again.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowActiveModal(false);
                    setUserToActivate(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isActivating}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmActiveUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isActivating}
                >
                  {isActivating ? 'Reactivating...' : 'Reactivate User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal - Using new component */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
        user={user}
        token={getToken()}
      />

      {/* Customer Assignment Modal */}
      {showCustomerAssignmentModal && (
        <CustomerAssignmentModal
          isOpen={showCustomerAssignmentModal}
          onClose={() => setShowCustomerAssignmentModal(false)}
          onSuccess={() => {
            setShowCustomerAssignmentModal(false);
            // Optionally refresh the users list
            fetchUsers();
          }}
        />
      )}
    </DashboardLayout>
  );
}



