"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  MapPinIcon,
  KeyIcon,
  PencilIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import MembershipManagementModal from './MembershipManagementModal';

export default function UserDetailModal({ user, isOpen, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [grantablePermissions, setGrantablePermissions] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [showAddMembershipForm, setShowAddMembershipForm] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [newMembership, setNewMembership] = useState({
    orgId: '',
    roleId: ''
  });

  // Form states - using business-friendly names
  const [profileForm, setProfileForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    isVerified: false,
    isAdmin: false
  });

  const [accessForm, setAccessForm] = useState({
    company: '', // Instead of tenantOrgId
    regions: '', // Instead of allowedRegionCodes
    customers: [], // Instead of allowedAccountIds
    locations: [] // Instead of allowedLocationIds
  });

  const [permissionsForm, setPermissionsForm] = useState({
    canSubmitWorkOrders: false,
    canInviteUsers: false,
    canEditUsers: false,
    canViewCustomers: false,
    canViewLocations: false,
    canCreateLocations: false
  });

  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        password: '',
        isVerified: user.is_verified || false,
        isAdmin: user.is_admin || false
      });
      fetchUserDetails();
      fetchAuditLogs();
      fetchOrganizations();
      fetchCustomers();
      fetchLocations();
      fetchAvailableRoles();
      fetchGrantablePermissions();
    }
  }, [isOpen, user]);

  // Fetch memberships when memberships tab is opened
  useEffect(() => {
    if (isOpen && user && activeTab === 'memberships') {
      fetchMemberships();
    }
  }, [isOpen, user, activeTab]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      // Fetch detailed user information including scopes and permissions
      const [userResp, scopesResp, permsResp] = await Promise.all([
        api.get(`/api/auth/users/${user.id}`),
        api.get(`/api/auth/users/${user.id}/scopes`).catch(() => ({ data: {} })),
        api.get(`/api/auth/users/${user.id}/permissions`).catch(() => ({ data: { capabilities: [] } }))
      ]);

      setUserDetails(userResp.data);
      
      if (scopesResp.data) {
        setAccessForm({
          company: scopesResp.data.tenant_org_id || '',
          regions: (scopesResp.data.allowed_region_codes || []).join(', '),
          customers: scopesResp.data.allowed_account_ids || [],
          locations: scopesResp.data.allowed_location_ids || []
        });
      }

      if (permsResp.data && permsResp.data.capabilities) {
        const caps = permsResp.data.capabilities;
        setPermissionsForm({
          canSubmitWorkOrders: caps.includes('workorders.submit'),
          canInviteUsers: caps.includes('users.invite'),
          canEditUsers: caps.includes('users.write'),
          canViewCustomers: caps.includes('customers.read'),
          canViewLocations: caps.includes('locations.read'),
          canCreateLocations: caps.includes('locations.create')
        });
      }
    } catch (err) {
      setError('Failed to fetch user details');
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get(`/api/auth/users/${user.id}/audit`);
      setAuditLogs(response.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchMemberships = async () => {
    setMembershipsLoading(true);
    try {
      const [membershipsResp, rolesResp] = await Promise.all([
        api.get(`/api/auth/users/${user.id}/memberships`),
        api.get('/api/auth/roles')
      ]);
      setMemberships(membershipsResp.data.memberships || []);
      setRoles(rolesResp.data.roles || []);
    } catch (err) {
      console.error('Error fetching memberships data:', err);
      setMemberships([]);
      setRoles([]);
    } finally {
      setMembershipsLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await api.get('/api/auth/roles/invitable');
      setAvailableRoles(response.data.roles || []);
    } catch (err) {
      console.error('Error fetching available roles:', err);
      setAvailableRoles([]);
    }
  };

  const fetchGrantablePermissions = async () => {
    try {
      const response = await api.get('/api/auth/permissions/grantable');
      setGrantablePermissions(response.data.permissions || []);
      setUserRole(response.data.userRole || '');
    } catch (err) {
      console.error('Error fetching grantable permissions:', err);
      setGrantablePermissions([]);
      setUserRole('');
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/api/auth/organizations');
      setOrganizations(response.data.organizations || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setOrganizations([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      // This would be a real API call to get customers
      // For now, using mock data
      setCustomers([
        { id: '1', name: 'Press Coffee', region: 'Arizona', locations: ['Downtown Phoenix', 'Tempe', 'Scottsdale'] },
        { id: '2', name: 'Green Valley Restaurant', region: 'Arizona', locations: ['Main Location'] },
        { id: '3', name: 'Desert Tech Solutions', region: 'Nevada', locations: ['Las Vegas', 'Reno'] }
      ]);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      // This would be a real API call to get locations
      // For now, using mock data
      setLocations([
        { id: '1', name: 'Downtown Phoenix', customer: 'Press Coffee', region: 'Arizona' },
        { id: '2', name: 'Tempe', customer: 'Press Coffee', region: 'Arizona' },
        { id: '3', name: 'Scottsdale', customer: 'Press Coffee', region: 'Arizona' },
        { id: '4', name: 'Main Location', customer: 'Green Valley Restaurant', region: 'Arizona' },
        { id: '5', name: 'Las Vegas', customer: 'Desert Tech Solutions', region: 'Nevada' },
        { id: '6', name: 'Reno', customer: 'Desert Tech Solutions', region: 'Nevada' }
      ]);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Membership management functions
  const handleAddMembership = async () => {
    if (!newMembership.orgId || !newMembership.roleId) {
      setError('Please select both organization and role');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await api.post(`/api/auth/users/${user.id}/memberships`, newMembership);
      
      setSuccess('Membership added successfully');
      setNewMembership({ orgId: '', roleId: '' });
      setShowAddMembershipForm(false);
      await fetchMemberships();
      onUpdate?.();
    } catch (err) {
      console.error('Error adding membership:', err);
      setError(err.response?.data?.error || 'Failed to add membership');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMembership = async (membershipId, roleId) => {
    try {
      setSaving(true);
      setError('');
      
      await api.put(`/api/auth/users/${user.id}/memberships/${membershipId}`, { roleId });
      
      setSuccess('Membership updated successfully');
      setEditingMembership(null);
      await fetchMemberships();
      onUpdate?.();
    } catch (err) {
      console.error('Error updating membership:', err);
      setError(err.response?.data?.error || 'Failed to update membership');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMembership = async (membershipId) => {
    if (!confirm('Are you sure you want to remove this membership? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await api.delete(`/api/auth/users/${user.id}/memberships/${membershipId}`);
      
      setSuccess('Membership removed successfully');
      await fetchMemberships();
      onUpdate?.();
    } catch (err) {
      console.error('Error removing membership:', err);
      setError(err.response?.data?.error || 'Failed to remove membership');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (roleName) => {
    const roleNames = {
      // Platform roles
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
      
      // Customer roles
      'national_account_admin': 'National Account Admin',
      'customer_admin': 'Customer administrator (Regional Account)',
      'regional_account_admin': 'Regional Account Admin',
      'customer_account_admin': 'Customer Account Admin',
      
      // Location roles
      'branch_manager': 'Branch Manager',
      'sales_manager': 'Sales Manager',
      'accounting_dept_manager': 'Accounting Dept. Manager',
      'service_manager': 'Service Manager',
      'location_account_manager': 'Account Manager (Location)',
      'location_field_sales': 'Field Sales (Location)',
      'branch_key_employee': 'Branch Key Employee',
      'field_technician': 'Field Technician',
      'third_party_vendor': 'Third Party Vendor',
      
      // Consumer role
      'wrc_user': 'Water Report Card (B2C) User',
      
      // Legacy support (deprecated)
      'PLATFORM_ADMIN': 'Platform Administrator',
      'PLATFORM_SERVICE_MANAGER': 'Platform Service Manager',
      'CUSTOMER_ADMIN': 'Customer Administrator',
      'CUSTOMER_SERVICE_MANAGER': 'Customer Service Manager',
      'LOCATION_MANAGER': 'Location Manager',
      'LOCATION_SERVICE_MANAGER': 'Location Service Manager',
      'SUBCONTRACTOR_ADMIN': 'Subcontractor Administrator',
      'SUBCONTRACTOR_SERVICE_MANAGER': 'Subcontractor Service Manager',
      'CUSTOMER_EMPLOYEE': 'Customer Employee',
      'LOCATION_EMPLOYEE': 'Location Employee',
      'SUBCONTRACTOR_EMPLOYEE': 'Subcontractor Employee',
      'ADMIN': 'Administrator',
      'SERVICE_MANAGER': 'Service Manager',
      'CUSTOMER_USER': 'Customer User'
    };
    return roleNames[roleName] || roleName;
  };

  const getRoleInfo = (roleName) => {
    const roleInfo = {
      // Platform roles
      'waterreportcard_super_admin': {
        name: 'WaterReportCard Super Admin',
        description: 'Controls the entire system - manages LiquosLabs, content management, shopping cart',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: ShieldCheckIcon
      },
      'liquoslabs_general_manager': {
        name: 'LiquosLabs General Manager',
        description: 'Manages LiquosLabs platform - can invite customer service, accounting, channel/sales, IT managers',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: BuildingOfficeIcon
      },
      'customer_service_manager': {
        name: 'Customer Service Manager',
        description: 'Manages customer support - can invite tech support',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: BuildingOfficeIcon
      },
      'accounting_manager': {
        name: 'Accounting Manager',
        description: 'Manages accounting operations - can invite accounting staff',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: BuildingOfficeIcon
      },
      'channel_sales_manager': {
        name: 'Channel/Sales Manager',
        description: 'Manages sales channels - can invite field sales, account managers, national account admins',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: BuildingOfficeIcon
      },
      'it_manager': {
        name: 'IT Manager',
        description: 'Manages IT operations - can invite contractors and developers',
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        icon: BuildingOfficeIcon
      },
      'tech_support': {
        name: 'Tech Support',
        description: 'Provides technical support to customers',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: UserIcon
      },
      'accounting_staff': {
        name: 'Accounting Dept. Staff',
        description: 'Handles accounting tasks and financial operations',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: UserIcon
      },
      'platform_field_sales': {
        name: 'Field Sales (Platform)',
        description: 'Platform-level field sales representative',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: UserIcon
      },
      'platform_account_manager': {
        name: 'Account Manager (Platform)',
        description: 'Manages platform accounts - can invite customer admins and regional account admins',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: BuildingOfficeIcon
      },
      'platform_contractor': {
        name: 'Contractor (Platform)',
        description: 'Platform-level contractor',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: UserIcon
      },
      'platform_developer': {
        name: 'Developer (Platform)',
        description: 'Platform-level developer',
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        icon: UserIcon
      },
      
      // Customer roles
      'national_account_admin': {
        name: 'National Account Admin',
        description: 'Manages large national accounts (e.g., ARAMARK) - can invite branch managers',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: BuildingOfficeIcon
      },
      'customer_admin': {
        name: 'Customer administrator (Regional Account)',
        description: 'Manages regional customer accounts',
        color: 'bg-red-100 text-red-800 border-red-200'
      },
      'regional_account_admin': {
        name: 'Regional Account Admin',
        description: 'Manages regional accounts - can invite customer account admins',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: BuildingOfficeIcon
      },
      'customer_account_admin': {
        name: 'Customer Account Admin',
        description: 'Manages customer accounts - can invite branch key employees and vendors',
        color: 'bg-pink-100 text-pink-800 border-pink-200',
        icon: BuildingOfficeIcon
      },
      
      // Location roles
      'branch_manager': {
        name: 'Branch Manager',
        description: 'Manages branch operations - can invite sales, accounting, service managers',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: BuildingOfficeIcon
      },
      'sales_manager': {
        name: 'Sales Manager',
        description: 'Manages sales operations - can invite account managers',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: BuildingOfficeIcon
      },
      'accounting_dept_manager': {
        name: 'Accounting Dept. Manager',
        description: 'Manages branch accounting - handles payables, receivables, payroll',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: BuildingOfficeIcon
      },
      'service_manager': {
        name: 'Service Manager',
        description: 'Manages service operations - can invite field technicians and third party vendors',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: BuildingOfficeIcon
      },
      'location_account_manager': {
        name: 'Account Manager (Location)',
        description: 'Manages location accounts - can invite field sales and customer account admins',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: BuildingOfficeIcon
      },
      'location_field_sales': {
        name: 'Field Sales (Location)',
        description: 'Location-level field sales representative',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: UserIcon
      },
      'branch_key_employee': {
        name: 'Branch Key Employee',
        description: 'Key employee at branch location',
        color: 'bg-teal-100 text-teal-800 border-teal-200',
        icon: UserIcon
      },
      'field_technician': {
        name: 'Field Technician',
        description: 'Field service technician',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: UserIcon
      },
      'third_party_vendor': {
        name: 'Third Party Vendor',
        description: 'External vendor providing services',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: UserIcon
      },
      
      // Consumer role
      'wrc_user': {
        name: 'Water Report Card (B2C) User',
        description: 'Consumer user for B2C services',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: UserIcon
      },
      
    };
    return roleInfo[roleName] || { name: roleName, description: 'Custom role', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: ShieldCheckIcon };
  };

  const getOrgTypeInfo = (orgType) => {
    const typeInfo = {
      'PLATFORM': {
        name: 'Platform',
        description: 'System-wide access',
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      'CUSTOMER': {
        name: 'Customer',
        description: 'Customer organization',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    };
    return typeInfo[orgType] || { name: orgType, description: 'Organization', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await api.put(`/api/auth/users/${user.id}`, {
        firstname: profileForm.firstname,
        lastname: profileForm.lastname,
        email: profileForm.email,
        ...(profileForm.password && { password: profileForm.password }),
        is_verified: profileForm.isVerified,
        is_admin: profileForm.isAdmin
      });
      
      setSuccess('Profile updated successfully!');
      onUpdate();
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveAccess = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Convert business-friendly data back to technical format
      await api.post(`/api/auth/users/${user.id}/scopes`, {
        tenant_org_id: accessForm.company,
        allowed_region_codes: accessForm.regions.split(',').map(r => r.trim()).filter(r => r),
        allowed_account_ids: accessForm.customers,
        allowed_location_ids: accessForm.locations
      });
      
      setSuccess('Access permissions updated successfully!');
      onUpdate();
    } catch (err) {
      setError('Failed to update access permissions');
      console.error('Error updating access:', err);
    } finally {
      setSaving(false);
    }
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Convert business-friendly permissions back to technical format
      const capabilities = [];
      if (permissionsForm.canSubmitWorkOrders) capabilities.push('workorders.submit');
      if (permissionsForm.canInviteUsers) capabilities.push('users.invite');
      if (permissionsForm.canEditUsers) capabilities.push('users.write');
      if (permissionsForm.canViewCustomers) capabilities.push('customers.read');
      if (permissionsForm.canViewLocations) capabilities.push('locations.read');
      if (permissionsForm.canCreateLocations) capabilities.push('locations.create');
      
      await api.post(`/api/auth/users/${user.id}/permissions`, {
        capabilities
      });
      
      setSuccess('Permissions updated successfully!');
      onUpdate();
    } catch (err) {
      setError('Failed to update permissions');
      console.error('Error updating permissions:', err);
    } finally {
      setSaving(false);
    }
  };


  const getStatusInfo = (user) => {
    if (user.deleted_at) {
      return {
        name: 'Removed',
        description: 'User has been deleted',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircleIcon
      };
    }
    if (user.suspended_at) {
      return {
        name: 'Suspended',
        description: 'Temporarily disabled',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: ClockIcon
      };
    }
    if (user.is_active) {
      return {
        name: 'Active',
        description: 'Can log in and use the system',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon
      };
    }
    return {
      name: 'Inactive',
      description: 'Cannot log in',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: ExclamationTriangleIcon
    };
  };

  if (!isOpen || !user) return null;

  const roleInfo = getRoleInfo(user.role);
  const statusInfo = getStatusInfo(user);
  const RoleIcon = roleInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <AnimatePresence key={`modal-${user.id}`}>
      <motion.div
        key={`modal-backdrop-${user.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          key={`modal-content-${user.id}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">
                    {user.firstname && user.lastname 
                      ? `${user.firstname} ${user.lastname}`
                      : user.email
                    }
                  </h2>
                  <p className="text-blue-100">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'profile', name: 'Profile', icon: UserIcon },
                { id: 'memberships', name: 'Memberships', icon: BuildingOfficeIcon },
                { id: 'access', name: 'Access & Scope', icon: GlobeAltIcon },
                { id: 'permissions', name: 'Permissions', icon: KeyIcon },
                { id: 'activity', name: 'Activity Log', icon: ClockIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-gray-600">Loading user details...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.firstname}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, firstname: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.lastname}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, lastname: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password (leave blank to keep current)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={profileForm.password}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profileForm.isVerified}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, isVerified: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Email Verified</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profileForm.isAdmin}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Administrator</span>
                      </label>
                    </div>

                    {/* Current Role & Status Display */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Current Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <RoleIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">{roleInfo.name}</p>
                            <p className="text-sm text-gray-500">{roleInfo.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">{statusInfo.name}</p>
                            <p className="text-sm text-gray-500">{statusInfo.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Access Tab */}
                {activeTab === 'access' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">What is Access & Scope?</h3>
                      <p className="text-sm text-blue-700">
                        This determines which companies, customers, and locations this user can see and work with. 
                        Think of it as defining their &quot;work area&quot; in your organization.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company/Organization
                      </label>
                      <select
                        value={accessForm.company}
                        onChange={(e) => setAccessForm(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a company...</option>
                        {(organizations || []).map(org => (
                          <option key={org.id || org.name} value={org.id}>
                            {org.name} ({org.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regions (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={accessForm.regions}
                        onChange={(e) => setAccessForm(prev => ({ ...prev, regions: e.target.value }))}
                        placeholder="e.g., Arizona, Nevada, California"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        List the regions this user can work in
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customers
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                        {(customers || []).map(customer => (
                          <label key={customer.id || customer.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={accessForm.customers.includes(customer.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAccessForm(prev => ({
                                    ...prev,
                                    customers: [...prev.customers, customer.id]
                                  }));
                                } else {
                                  setAccessForm(prev => ({
                                    ...prev,
                                    customers: prev.customers.filter(id => id !== customer.id)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="font-medium text-gray-900">{customer.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({customer.region})</span>
                              <div className="text-xs text-gray-400">
                                Locations: {customer.locations.join(', ')}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Locations
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                        {(locations || []).map(location => (
                          <label key={location.id || location.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={accessForm.locations.includes(location.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAccessForm(prev => ({
                                    ...prev,
                                    locations: [...prev.locations, location.id]
                                  }));
                                } else {
                                  setAccessForm(prev => ({
                                    ...prev,
                                    locations: prev.locations.filter(id => id !== location.id)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="font-medium text-gray-900">{location.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({location.customer})</span>
                              <span className="text-xs text-gray-400 ml-2">- {location.region}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Memberships Tab */}
                {activeTab === 'memberships' && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">Manage Memberships & Roles</h3>
                      <p className="text-sm text-green-700">
                        Control which organizations this user belongs to and what role they have in each organization. 
                        This determines their access level and permissions across different parts of your system.
                      </p>
                      {userRole && availableRoles.length > 0 && (
                        <p className="text-xs text-green-600 mt-2">
                          <strong>Your role:</strong> {getRoleDisplayName(userRole)} - You can assign these roles: {availableRoles.map(role => getRoleDisplayName(role.name)).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Current Memberships</h4>
                        <p className="text-sm text-gray-600">Manage user&apos;s organization memberships and roles</p>
                      </div>
                      <button
                        onClick={() => setShowAddMembershipForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add Membership
                      </button>
                    </div>

                    {/* Memberships List */}
                    {membershipsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading memberships...</span>
                      </div>
                    ) : memberships.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No memberships found</p>
                        <p className="text-gray-500 text-sm mt-1">
                          This user is not currently a member of any organizations.
                        </p>
                        <button
                          onClick={() => setShowAddMembershipForm(true)}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add First Membership
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {memberships.map((membership) => (
                          <div key={membership.membership_id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <h5 className="font-medium text-gray-900">{membership.org_name}</h5>
                                    <p className="text-sm text-gray-600">
                                      {membership.org_type} • Role: {membership.role_name}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  membership.role_scope === 'ORG' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {membership.role_scope}
                                </span>
                                <button
                                  onClick={() => setEditingMembership(membership)}
                                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Edit membership"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMembership(membership.membership_id)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Remove membership"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Membership Form */}
                    {showAddMembershipForm && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Membership</h4>
                        {availableRoles.length === 0 ? (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>No roles available for assignment:</strong> As a {getRoleDisplayName(userRole)}, you cannot assign roles to other users. Only users with higher privileges can assign roles.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Organization
                              </label>
                              <select
                                value={newMembership.orgId}
                                onChange={(e) => setNewMembership(prev => ({ ...prev, orgId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select organization...</option>
                                {(organizations || []).map(org => (
                                  <option key={org.id} value={org.id}>
                                    {org.name} ({org.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role
                              </label>
                              <select
                                value={newMembership.roleId}
                                onChange={(e) => setNewMembership(prev => ({ ...prev, roleId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select role...</option>
                                {(availableRoles || []).map(role => (
                                  <option key={role.id} value={role.id}>
                                    {getRoleDisplayName(role.name)} ({role.scope})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={handleAddMembership}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                          >
                            {saving ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckIcon className="w-4 h-4" />
                            )}
                            Add Membership
                          </button>
                          <button
                            onClick={() => {
                              setShowAddMembershipForm(false);
                              setNewMembership({ orgId: '', roleId: '' });
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit Membership Form */}
                    {editingMembership && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Edit Membership</h4>
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            Organization: <span className="font-medium">{editingMembership.org_name}</span>
                          </p>
                        </div>
                        {availableRoles.length === 0 ? (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>No roles available for assignment:</strong> As a {getRoleDisplayName(userRole)}, you cannot change roles for other users. Only users with higher privileges can modify roles.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Role
                            </label>
                            <select
                              value={editingMembership.role_id}
                              onChange={(e) => setEditingMembership(prev => ({ ...prev, role_id: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {(availableRoles || []).map(role => (
                                <option key={role.id} value={role.id}>
                                  {getRoleDisplayName(role.name)} ({role.scope})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => handleUpdateMembership(editingMembership.membership_id, editingMembership.role_id)}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                          >
                            {saving ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckIcon className="w-4 h-4" />
                            )}
                            Update Membership
                          </button>
                          <button
                            onClick={() => setEditingMembership(null)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Permissions Tab */}
                {activeTab === 'permissions' && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">What are Permissions?</h3>
                      <p className="text-sm text-green-700">
                        These are specific actions this user can perform. You can grant or remove individual permissions 
                        regardless of their role. This gives you fine-grained control over what each person can do.
                      </p>
                      {userRole && (
                        <p className="text-xs text-green-600 mt-2">
                          <strong>Your role:</strong> {getRoleDisplayName(userRole)} - You can grant these permissions to users you manage.
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const allPermissions = [
                          {
                            key: 'canSubmitWorkOrders',
                            capability: 'workorders.submit',
                            title: 'Submit Work Orders',
                            description: 'Can create and submit new work orders',
                            icon: '📋'
                          },
                          {
                            key: 'canInviteUsers',
                            capability: 'users.invite',
                            title: 'Invite Team Members',
                            description: 'Can send invitations to new users',
                            icon: '👥'
                          },
                          {
                            key: 'canEditUsers',
                            capability: 'users.write',
                            title: 'Edit User Profiles',
                            description: 'Can modify other users&apos; information',
                            icon: '✏️'
                          },
                          {
                            key: 'canViewCustomers',
                            capability: 'customers.read',
                            title: 'View Customers',
                            description: 'Can see customer information and data',
                            icon: '🏢'
                          },
                          {
                            key: 'canViewLocations',
                            capability: 'locations.read',
                            title: 'View Locations',
                            description: 'Can see location details and information',
                            icon: '📍'
                          },
                          {
                            key: 'canCreateLocations',
                            capability: 'locations.create',
                            title: 'Create Locations',
                            description: 'Can add new locations to the system',
                            icon: '➕'
                          }
                        ];
                        
                        const filteredPermissions = allPermissions.filter(permission => grantablePermissions.includes(permission.capability));

                        return filteredPermissions.length === 0 ? (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>No additional permissions available:</strong> As a {getRoleDisplayName(userRole)}, you cannot grant additional permissions beyond what the role provides by default.
                            </p>
                          </div>
                        ) : (
                          filteredPermissions.map(permission => (
                            <div key={permission.key} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                              <span className="text-2xl">{permission.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={permissionsForm[permission.key]}
                                    onChange={(e) => setPermissionsForm(prev => ({
                                      ...prev,
                                      [permission.key]: e.target.checked
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{permission.title}</h4>
                                    <p className="text-sm text-gray-500">{permission.description}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Activity Log</h3>
                      <p className="text-sm text-gray-600">
                        This shows recent actions taken by or affecting this user
                      </p>
                    </div>

                    {auditLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(auditLogs || []).map((log, index) => (
                          <div key={log.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{log.action}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleString()}
                                {log.actor_email && ` • by ${log.actor_email}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                {error && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    {success}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                {activeTab === 'profile' && (
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    Save Profile
                  </button>
                )}
                {activeTab === 'access' && (
                  <button
                    onClick={saveAccess}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    Save Access
                  </button>
                )}
                {activeTab === 'permissions' && (
                  <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    Save Permissions
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Membership Management Modal */}
      <MembershipManagementModal
        user={user}
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        onUpdate={() => {
          fetchUserDetails();
          fetchMemberships();
          onUpdate?.();
        }}
      />
    </AnimatePresence>
  );
}