"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function MembershipManagementModal({ user, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberships, setMemberships] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  
  const [newMembership, setNewMembership] = useState({
    orgId: '',
    roleId: ''
  });

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchData();
    }
  }, [isOpen, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [membershipsResp, orgsResp, rolesResp] = await Promise.all([
        api.get(`/api/auth/users/${user.id}/memberships`),
        api.get('/api/auth/organizations'),
        api.get('/api/auth/roles')
      ]);
      
      setMemberships(membershipsResp.data.memberships || []);
      setOrganizations(orgsResp.data.organizations || []);
      setRoles(rolesResp.data.roles || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      setShowAddForm(false);
      await fetchData();
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
      await fetchData();
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
      await fetchData();
      onUpdate?.();
    } catch (err) {
      console.error('Error removing membership:', err);
      setError(err.response?.data?.error || 'Failed to remove membership');
    } finally {
      setSaving(false);
    }
  };

  const getRoleInfo = (roleName) => {
    const roleInfo = {
      'ADMIN': {
        name: 'Administrator',
        description: 'Full access to everything',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: ShieldCheckIcon
      },
      'SERVICE_MANAGER': {
        name: 'Service Manager',
        description: 'Manage services and users',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: BuildingOfficeIcon
      },
      'CUSTOMER_USER': {
        name: 'Customer User',
        description: 'Basic user access',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: BuildingOfficeIcon
      }
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Memberships & Roles
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.firstname} {user?.lastname} ({user?.email})
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <>
                  {/* Error/Success Messages */}
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-700">{error}</span>
                    </div>
                  )}
                  
                  {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-700">{success}</span>
                    </div>
                  )}

                  {/* Current Memberships */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Current Memberships</h3>
                    
                    {memberships.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No memberships found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {memberships.map((membership) => {
                          const roleInfo = getRoleInfo(membership.role_name);
                          const orgTypeInfo = getOrgTypeInfo(membership.org_type);
                          const isEditing = editingMembership === membership.membership_id;
                          
                          return (
                            <div key={membership.membership_id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${orgTypeInfo.color}`}>
                                      {orgTypeInfo.name}
                                    </span>
                                    <span className="font-medium text-gray-900">{membership.org_name}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <roleInfo.icon className="h-4 w-4 text-gray-500" />
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${roleInfo.color}`}>
                                      {roleInfo.name}
                                    </span>
                                    <span className="text-sm text-gray-600">{roleInfo.description}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <select
                                        value={membership.role_id}
                                        onChange={(e) => handleUpdateMembership(membership.membership_id, e.target.value)}
                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                        disabled={saving}
                                      >
                                        {roles.map((role) => (
                                          <option key={role.id} value={role.id}>
                                            {getRoleInfo(role.name).name}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => setEditingMembership(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        <XCircleIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setEditingMembership(membership.membership_id)}
                                        className="text-blue-600 hover:text-blue-800"
                                        disabled={saving}
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveMembership(membership.membership_id)}
                                        className="text-red-600 hover:text-red-800"
                                        disabled={saving}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add New Membership */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Add New Membership</h3>
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Add Membership</span>
                      </button>
                    </div>
                    
                    {showAddForm && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Organization
                            </label>
                            <select
                              value={newMembership.orgId}
                              onChange={(e) => setNewMembership({ ...newMembership, orgId: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select organization...</option>
                              {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                  {org.name} ({getOrgTypeInfo(org.type).name})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role
                            </label>
                            <select
                              value={newMembership.roleId}
                              onChange={(e) => setNewMembership({ ...newMembership, roleId: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select role...</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {getRoleInfo(role.name).name} - {getRoleInfo(role.name).description}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={handleAddMembership}
                            disabled={saving || !newMembership.orgId || !newMembership.roleId}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {saving ? 'Adding...' : 'Add Membership'}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddForm(false);
                              setNewMembership({ orgId: '', roleId: '' });
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
