'use client';

import { useState } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * ContactDetailModal Component
 * Displays detailed contact information in an expandable modal
 */
export default function ContactDetailModal({ contact, isOpen, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    physicalAddress: false,
    shippingAddress: false,
    billingAddress: false,
    companyContact: true, // Default expanded
    maintenanceManagement: false,
    permissions: false
  });

  if (!isOpen || !contact) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get parent contact name if available
  const parentContactName = contact.parent_name || contact.parentContactName || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Parent Contact Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Contact Name
            </label>
            <input
              type="text"
              value={parentContactName}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            />
          </div>

          {/* Expandable Sections */}
          <div className="space-y-2">
            {/* Physical Address */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('physicalAddress')}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {expandedSections.physicalAddress ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">Physical Address</span>
              </button>
              {expandedSections.physicalAddress && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address</label>
                    <input
                      type="text"
                      value={contact.physical_address || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        value={contact.city || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <input
                        type="text"
                        value={contact.state || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={contact.zip || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Country</label>
                      <input
                        type="text"
                        value={contact.country || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('shippingAddress')}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {expandedSections.shippingAddress ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">Shipping Address</span>
              </button>
              {expandedSections.shippingAddress && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address</label>
                    <input
                      type="text"
                      value={contact.shipping_address || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('billingAddress')}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {expandedSections.billingAddress ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">Billing Address</span>
              </button>
              {expandedSections.billingAddress && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address</label>
                    <input
                      type="text"
                      value={contact.billing_address || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Company Contact Information */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('companyContact')}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {expandedSections.companyContact ? (
                  <ChevronDownIcon className="w-5 h-5 text-orange-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">Company Contact Information</span>
              </button>
              {expandedSections.companyContact && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={contact.name || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={contact.email || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={contact.phone || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contact Type</label>
                    <input
                      type="text"
                      value={contact.contact_type || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <input
                      type="text"
                      value={contact.category_description || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Location Name</label>
                    <input
                      type="text"
                      value={contact.location_name || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Maintenance Management Information */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('maintenanceManagement')}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {expandedSections.maintenanceManagement ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">Maintenance Management Information</span>
              </button>
              {expandedSections.maintenanceManagement && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hours of Operation</label>
                    <input
                      type="text"
                      value={contact.hours_of_operation || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Days of Operation</label>
                    <input
                      type="text"
                      value={contact.days_of_operation || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Service Zone</label>
                    <input
                      type="text"
                      value={contact.service_zone || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Route</label>
                    <input
                      type="text"
                      value={contact.route || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Water District (PWSID)</label>
                    <input
                      type="text"
                      value={contact.pwsid || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Permissions or Employees */}
            <div className="bg-white rounded-md border border-gray-200 bg-yellow-50">
              <button
                onClick={() => toggleSection('permissions')}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-yellow-100 transition-colors"
              >
                {expandedSections.permissions ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">Permissions or Employees Here</span>
              </button>
              {expandedSections.permissions && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-sm text-gray-600">Permissions and employee information will be displayed here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

