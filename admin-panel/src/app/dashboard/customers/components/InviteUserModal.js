'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, UsersIcon, BuildingOffice2Icon, UserPlusIcon } from '@heroicons/react/24/outline';

export default function InviteUserModal({ isOpen, onClose, onSuccess, user, token }) {
  const [formData, setFormData] = useState({
    invitee_email: '',
    target_role_key: '',
    target_customer_ids: []
  });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch available roles and customers
  useEffect(() => {
    if (isOpen) {
      fetchAvailableData();
    }
  }, [isOpen]);

  const fetchAvailableData = async () => {
    setLoadingData(true);
    try {
      
      const [rolesResponse, customersResponse] = await Promise.all([
        fetch('/api/invitations/available-roles', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/invitations/available-customers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!rolesResponse.ok || !customersResponse.ok) {
        throw new Error('Failed to fetch available data');
      }

      const [rolesData, customersData] = await Promise.all([
        rolesResponse.json(),
        customersResponse.json()
      ]);

      setAvailableRoles(rolesData.data);
      setAvailableCustomers(customersData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerToggle = (customerId) => {
    setFormData(prev => ({
      ...prev,
      target_customer_ids: prev.target_customer_ids.includes(customerId)
        ? prev.target_customer_ids.filter(id => id !== customerId)
        : [...prev.target_customer_ids, customerId]
    }));
  };

  const handleSelectAllCustomers = () => {
    setFormData(prev => ({
      ...prev,
      target_customer_ids: availableCustomers.map(c => c.id)
    }));
  };

  const handleDeselectAllCustomers = () => {
    setFormData(prev => ({
      ...prev,
      target_customer_ids: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      const data = await response.json();
      onSuccess(data.data);
      onClose();
      
      // Reset form
      setFormData({
        invitee_email: '',
        target_role_key: '',
        target_customer_ids: []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send User Invitation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Email */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <EnvelopeIcon className="w-5 h-5 mr-2" />
                  Invitation Details
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="invitee_email"
                    value={formData.invitee_email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@company.com"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2" />
                  Role Assignment
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Role *
                  </label>
                  <select
                    name="target_role_key"
                    value={formData.target_role_key}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a role</option>
                    {availableRoles.map(role => (
                      <option key={role.key} value={role.key}>
                        {role.display_name} ({role.scope})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    UsersIcon will be assigned this role in the selected customers
                  </p>
                </div>
              </div>

              {/* Customer Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                    Customer Assignment
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCustomers}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllCustomers}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  {availableCustomers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No customers available for invitation
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {availableCustomers.map(customer => (
                        <label
                          key={customer.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.target_customer_ids.includes(customer.id)}
                            onChange={() => handleCustomerToggle(customer.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.full_path} • {customer.status}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                
                {formData.target_customer_ids.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {formData.target_customer_ids.length} customer(s) selected
                  </div>
                )}
              </div>

              {/* Summary */}
              {formData.invitee_email && formData.target_role_key && formData.target_customer_ids.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Invitation Summary</h4>
                  <div className="text-sm text-blue-800">
                    <p><strong>Email:</strong> {formData.invitee_email}</p>
                    <p><strong>Role:</strong> {availableRoles.find(r => r.key === formData.target_role_key)?.display_name}</p>
                    <p><strong>Customers:</strong> {formData.target_customer_ids.length} selected</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingData || !formData.invitee_email || !formData.target_role_key || formData.target_customer_ids.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <UserPlusIcon className="w-4 h-4" />
              <span>{loading ? 'Sending...' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
