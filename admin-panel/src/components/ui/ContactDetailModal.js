'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * ContactDetailModal Component
 * Displays detailed contact information in an expandable modal
 * Supports add/edit modes and parent/sub contact types
 */
export default function ContactDetailModal({ contact, isOpen, onClose, onSave, mode = 'edit', type = 'parent', allContacts = [], onEditSubContact, onAddSubContact }) {
  const [editedContact, setEditedContact] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    physicalAddress: false,
    shippingAddress: false,
    billingAddress: false,
    companyContact: true, // Default expanded
    maintenanceManagement: false,
    permissions: false,
    subContacts: false
  });

  // Initialize edited contact when contact changes or mode/type changes
  useEffect(() => {
    if (mode === 'add') {
      // Initialize empty contact for add mode
      setEditedContact({
        name: '',
        email: '',
        phone: '',
        contact_type: '',
        category_description: '',
        location_name: '',
        physical_address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        shipping_address: '',
        billing_address: '',
        hours_of_operation: '',
        days_of_operation: '',
        service_zone: '',
        route: '',
        pwsid: '',
        parent_id: type === 'sub' ? (contact?.parent_id || null) : undefined
      });
    } else if (contact) {
      setEditedContact({ ...contact });
    }
  }, [contact, mode, type]);

  if (!isOpen) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field, value) => {
    setEditedContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedContact);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && contact) {
      setEditedContact({ ...contact });
    } else {
      setEditedContact({});
    }
    onClose();
  };

  // Get parent contacts for sub-contact selection
  const parentContacts = allContacts.filter(c => c.parent_id === null || c.parent_id === undefined);

  // Get sub-contacts for parent contact management
  const subContacts = mode === 'edit' && type === 'parent' && contact
    ? allContacts.filter(c => c.parent_id === contact.id)
    : [];

  // Get parent contact name if available
  const parentContactName = editedContact.parent_id
    ? parentContacts.find(c => c.id === editedContact.parent_id)?.name || ''
    : (contact?.parent_name || contact?.parentContactName || '');
  
  // Use edited contact for display
  const displayContact = editedContact;

  // Get modal title
  const getModalTitle = () => {
    if (mode === 'add') {
      return type === 'parent' ? 'Add Parent Contact' : 'Add Sub-Contact';
    } else {
      return type === 'parent' ? 'Edit Parent Contact' : 'Edit Sub-Contact';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Parent Contact Name (for parent contacts in edit mode) */}
          {type === 'parent' && mode === 'edit' && contact && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Contact Name
              </label>
              <input
                type="text"
                value={contact.name || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          )}

          {/* Parent Contact Selector (for sub-contacts) */}
          {(type === 'sub' || (mode === 'edit' && contact && contact.parent_id)) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Contact {mode === 'add' ? '*' : ''}
              </label>
              <select
                value={editedContact.parent_id ? String(editedContact.parent_id) : ''}
                onChange={(e) => handleInputChange('parent_id', e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={mode === 'add' && type === 'sub'}
              >
                <option value="">Select Parent Contact</option>
                {parentContacts.map(parent => (
                  <option key={parent.id} value={String(parent.id)}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Expandable Sections */}
          <div className="space-y-2">
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
                      value={displayContact.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={displayContact.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={displayContact.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contact Type</label>
                    <input
                      type="text"
                      value={displayContact.contact_type || ''}
                      onChange={(e) => handleInputChange('contact_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <input
                      type="text"
                      value={displayContact.category_description || ''}
                      onChange={(e) => handleInputChange('category_description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Location Name</label>
                    <input
                      type="text"
                      value={displayContact.location_name || ''}
                      onChange={(e) => handleInputChange('location_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

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
                      value={displayContact.physical_address || ''}
                      onChange={(e) => handleInputChange('physical_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        value={displayContact.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <input
                        type="text"
                        value={displayContact.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={displayContact.zip || ''}
                        onChange={(e) => handleInputChange('zip', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Country</label>
                      <input
                        type="text"
                        value={displayContact.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={displayContact.shipping_address || ''}
                      onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={displayContact.billing_address || ''}
                      onChange={(e) => handleInputChange('billing_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={displayContact.hours_of_operation || ''}
                      onChange={(e) => handleInputChange('hours_of_operation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Days of Operation</label>
                    <input
                      type="text"
                      value={displayContact.days_of_operation || ''}
                      onChange={(e) => handleInputChange('days_of_operation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Service Zone</label>
                    <input
                      type="text"
                      value={displayContact.service_zone || ''}
                      onChange={(e) => handleInputChange('service_zone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Route</label>
                    <input
                      type="text"
                      value={displayContact.route || ''}
                      onChange={(e) => handleInputChange('route', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Water District (PWSID)</label>
                    <input
                      type="text"
                      value={displayContact.pwsid || ''}
                      onChange={(e) => handleInputChange('pwsid', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sub-Contacts Management (for parent contacts) */}
            {(type === 'parent' || (mode === 'edit' && contact && !contact.parent_id)) && (
              <div className="bg-white rounded-md border border-gray-200">
                <button
                  onClick={() => toggleSection('subContacts')}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {expandedSections.subContacts ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">
                    Sub-Contacts {subContacts.length > 0 && `(${subContacts.length})`}
                  </span>
                </button>
                {expandedSections.subContacts && (
                  <div className="px-4 pb-4 space-y-3">
                    {subContacts.length > 0 ? (
                      <div className="space-y-2">
                        {subContacts.map(subContact => (
                          <div
                            key={subContact.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{subContact.name}</p>
                              {subContact.email && (
                                <p className="text-xs text-gray-500">{subContact.email}</p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (onEditSubContact) {
                                  onEditSubContact(subContact);
                                }
                              }}
                              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No sub-contacts yet.</p>
                    )}
                    <button
                      onClick={() => {
                        if (onAddSubContact && contact) {
                          onAddSubContact(contact);
                        }
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Sub-Contact
                    </button>
                  </div>
                )}
              </div>
            )}

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

        {/* Footer with Save and Cancel buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

