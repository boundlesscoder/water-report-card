'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  UserPlusIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function MultiCustomerInvitationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  inviterMembership,
  availableCustomers = [],
  availableRoles = []
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCustomers([]);
      setSelectedRole('');
      setSearchTerm('');
      setError('');
    }
  }, [isOpen]);

  const filteredCustomers = availableCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.full_path_name && customer.full_path_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCustomerToggle = (customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.some(c => c.id === customer.id);
      if (isSelected) {
        return prev.filter(c => c.id !== customer.id);
      } else {
        return [...prev, customer];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCustomers.length === 0) {
      setError('Please select at least one customer');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const invitationData = {
        target_customer_ids: selectedCustomers.map(c => c.id),
        target_role_id: selectedRole,
        grants: [] // Add grants if needed
      };

      await onSubmit(invitationData);
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UserPlusIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Multi-Customer Invitation</h2>
                  <p className="text-blue-100 text-sm sm:text-base">Select multiple customers for this invitation</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BuildingOffice2Icon className="w-4 h-4 inline mr-1" />
                  Role *
                </label>
                <select
                  required
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a role...</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.display_name} ({role.scope})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Customers
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by customer name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customers ({selectedCustomers.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No customers found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredCustomers.map(customer => {
                        const isSelected = selectedCustomers.some(c => c.id === customer.id);
                        return (
                          <div
                            key={customer.id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                            onClick={() => handleCustomerToggle(customer)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleCustomerToggle(customer)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{customer.name}</h4>
                                    {customer.full_path_name && customer.full_path_name !== customer.name && (
                                      <p className="text-sm text-gray-500">{customer.full_path_name}</p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                      {customer.location_city && customer.location_state 
                                        ? `${customer.location_city}, ${customer.location_state}`
                                        : 'No location specified'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckIcon className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Customers Summary */}
              {selectedCustomers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Customers:</h4>
                  <div className="space-y-1">
                    {selectedCustomers.map(customer => (
                      <div key={customer.id} className="flex items-center justify-between text-sm">
                        <span className="text-blue-800">{customer.name}</span>
                        <button
                          type="button"
                          onClick={() => handleCustomerToggle(customer)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>

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
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || selectedCustomers.length === 0 || !selectedRole}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlusIcon className="w-4 h-4" />
                  )}
                  Send Invitation ({selectedCustomers.length} customers)
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
