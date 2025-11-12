'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  BuildingOffice2Icon, 
  MapPinIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  UserIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  WifiIcon, 
  CogIcon, 
  UserGroupIcon, 
  InformationCircleIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import api from '../../../../services/api';

export default function CustomerDetailModal({ isOpen, onClose, customerId, token }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomerDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/customers/${customerId}`);
      setCustomer(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId, fetchCustomerDetails]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const formatAddress = (line1, line2, city, state, zip) => {
    const parts = [line1, line2, city, state, zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BuildingOffice2Icon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
              <p className="text-sm text-gray-500">View comprehensive customer information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <BuildingOffice2Icon className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-lg text-red-600 mb-2">Failed to load customer details</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchCustomerDetails}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200"
              >
                Retry
              </button>
            </div>
          ) : customer ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{customer.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status === 'active' ? 'bg-green-100 text-green-800' :
                      customer.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      customer.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hierarchy Level</label>
                    <p className="text-sm text-gray-900">{customer.hierarchy_level || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Customer</label>
                    <p className="text-sm text-gray-900">{customer.parent_name || 'Root Customer'}</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Location Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location Name</label>
                    <p className="text-sm text-gray-900">{customer.location_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{formatPhone(customer.location_phone_no)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm text-gray-900">
                      {formatAddress(
                        customer.location_address_line_1,
                        customer.location_address_line_2,
                        customer.location_city,
                        customer.location_state,
                        customer.location_zip
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Region</label>
                    <p className="text-sm text-gray-900">{customer.location_region || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Zone</label>
                    <p className="text-sm text-gray-900">{customer.location_service_zone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Primary Contact */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Primary Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">
                      {customer.contact_1_first_name && customer.contact_1_last_name 
                        ? `${customer.contact_1_first_name} ${customer.contact_1_last_name}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="text-sm text-gray-900">{customer.contact_1_title || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{customer.contact_1_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Direct Line</label>
                    <p className="text-sm text-gray-900">{formatPhone(customer.contact_1_direct_line)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cell Phone</label>
                    <p className="text-sm text-gray-900">{formatPhone(customer.contact_1_cell_phone)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{customer.contact_1_notes || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Billing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Billing Email</label>
                    <p className="text-sm text-gray-900">{customer.billing_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Billing Type</label>
                    <p className="text-sm text-gray-900">{customer.billing_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Labor Rate</label>
                    <p className="text-sm text-gray-900">
                      {customer.hourly_labor_rate ? `$${customer.hourly_labor_rate}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discount Rate</label>
                    <p className="text-sm text-gray-900">
                      {customer.discount_rate ? `${customer.discount_rate}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Billing Address</label>
                    <p className="text-sm text-gray-900">
                      {formatAddress(
                        customer.billing_address_line_1,
                        customer.billing_address_line_2,
                        customer.billing_city,
                        customer.billing_state,
                        customer.billing_zip
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Information */}
              {(customer.wifi_network_name || customer.architect_firm || customer.site_phone) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CogIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Technical Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.wifi_network_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">WiFi Network</label>
                        <p className="text-sm text-gray-900">{customer.wifi_network_name}</p>
                      </div>
                    )}
                    {customer.architect_firm && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Architect Firm</label>
                        <p className="text-sm text-gray-900">{customer.architect_firm}</p>
                      </div>
                    )}
                    {customer.site_phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Site Phone</label>
                        <p className="text-sm text-gray-900">{formatPhone(customer.site_phone)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* System Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(customer.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-sm text-gray-900">{formatDate(customer.updated_at)}</p>
                  </div>
                  {customer.url && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <a 
                        href={customer.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <GlobeAltIcon className="w-4 h-4 mr-1" />
                        {customer.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* General Notes */}
              {customer.general_notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                    General Notes
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{customer.general_notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
