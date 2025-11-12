"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  BuildingOfficeIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function CustomerAssignmentModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchInvitationsNeedingAssignment();
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchInvitationsNeedingAssignment = async () => {
    try {
      const response = await api.get('/api/invitations/needing-customer-assignment');
      setInvitations(response.data.data || []);
    } catch (err) {
      console.error('Error fetching invitations needing assignment:', err);
      setError('Failed to fetch invitations needing customer assignment');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers');
    }
  };

  const handleAssignCustomer = async () => {
    if (!selectedInvitation || !selectedCustomer) {
      setError('Please select an invitation and a customer');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/api/invitations/assign-customer', {
        invitation_id: selectedInvitation.invitation_id,
        customer_id: selectedCustomer
      });

      setSuccess('Customer assigned to invitation successfully');
      
      // Refresh the invitations list
      await fetchInvitationsNeedingAssignment();
      
      // Reset selection
      setSelectedInvitation(null);
      setSelectedCustomer('');
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error assigning customer to invitation:', err);
      setError(err.response?.data?.error || 'Failed to assign customer to invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setSelectedInvitation(null);
    setSelectedCustomer('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Assign Customers to Invitations
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-green-800">{success}</span>
              </div>
            )}

            {invitations.length === 0 ? (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No invitations need customer assignment</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Invitations List */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Invitations Needing Assignment ({invitations.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.invitation_id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedInvitation?.invitation_id === invitation.invitation_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedInvitation(invitation)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <UserIcon className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-gray-900">
                                  {invitation.invitee_email}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>Role: {invitation.target_role_display}</div>
                                <div>Invited: {new Date(invitation.invited_at).toLocaleDateString()}</div>
                                <div>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {invitation.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Select Customer
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customer
                        </label>
                        <select
                          value={selectedCustomer}
                          onChange={(e) => setSelectedCustomer(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a customer...</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedInvitation && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Selected Invitation</h4>
                          <div className="text-sm text-gray-600">
                            <div><strong>Email:</strong> {selectedInvitation.invitee_email}</div>
                            <div><strong>Role:</strong> {selectedInvitation.target_role_display}</div>
                            <div><strong>Invited:</strong> {new Date(selectedInvitation.invited_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleAssignCustomer}
                        disabled={loading || !selectedInvitation || !selectedCustomer}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            Assign Customer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
