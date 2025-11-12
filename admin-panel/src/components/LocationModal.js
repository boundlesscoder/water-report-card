"use client";

import { useState } from 'react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import PhoneInput from '@/components/PhoneInput';
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

// Location Modal Component
export default function LocationModal({ location, accountId, onSave, onClose }) {
  const [formData, setFormData] = useState(() => {
    // Create a default form with empty strings
    const defaultForm = {
      name: '',
      branch: '',
      location_type: '',
      region: '',
      route_code: '',
      status: 'active',
      phone: '',
      hours_of_operation: '',
      days_of_operation: '',
      // Address Information
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA',
      latitude: null,
      longitude: null,
      // Billing Information
      override_billing: false,
      billing_contact_name: '',
      billing_address_line1: '',
      billing_address_line2: '',
      billing_city: '',
      billing_state: '',
      billing_postal_code: '',
      billing_email: '',
      billing_contact_note: '',
      billing_type: '',
      billing_dept: '',
      billing_name: '',
      contacts_sales_tax: '',
      discount_rate: '',
      hourly_labor_rate: '',
      service_zone: '',
      // WiFi Information
      wifi_network_name: '',
      wifi_password: '',
      wifi_admin: '',
      // Site Details
      site_supervisor: '',
      supervisor_cell: '',
      site_phone: '',
      configuration_type: '',
      contractor: '',
      elect_foreman: '',
      electrical_contractor: '',
      installation_date: '',
      maintenance_contract_start_date: '',
      maintenance_contract_end_date: '',
      // Extended Location Information
      location_fax_number: '',
      location_architect_firm: '',
      location_architect: '',
      location_consultant: '',
      location_consultant_cell: '',
      location_maintenance_profile: '',
      location_contract_terms: '',
      location_general_notes: '',
      location_special_instructions: '',
      location_access_key: '',
      location_email_subscriber: false,
      location_custom_field_custom3: '',
      location_spelling_notes: ''
    };

    // If location data exists, merge it but convert null values to empty strings
    if (location) {
      const cleanedLocation = {};
      Object.keys(location).forEach(key => {
        if (location[key] === null || location[key] === undefined) {
          cleanedLocation[key] = '';
        } else if (typeof location[key] === 'boolean') {
          cleanedLocation[key] = location[key];
        } else {
          cleanedLocation[key] = String(location[key]);
        }
      });
      return { ...defaultForm, ...cleanedLocation };
    }

    return defaultForm;
  });

  const [activeTab, setActiveTab] = useState('basic');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // Handle address data structure
    if (payload.line1 || payload.city || payload.state) {
      payload.address = {
        line1: payload.line1,
        line2: payload.line2,
        city: payload.city,
        state: payload.state,
        postal_code: payload.postal_code,
        country: payload.country || 'USA'
      };
    }
    
    onSave(payload);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (addressComponents) => {
    setFormData(prev => ({
      ...prev,
      line1: addressComponents.address_line1,
      city: addressComponents.city,
      state: addressComponents.state,
      postal_code: addressComponents.zip,
      latitude: addressComponents.latitude || null,
      longitude: addressComponents.longitude || null
      // Note: line2 is kept as-is for user input
    }));
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: BuildingOfficeIcon },
    { id: 'address', name: 'Address', icon: MapPinIcon },
    { id: 'billing', name: 'Billing', icon: EnvelopeIcon },
    { id: 'wifi', name: 'WiFi & Site', icon: PhoneIcon },
    { id: 'notes', name: 'Notes', icon: PencilIcon }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {location ? 'Edit Location' : 'Add New Location'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Auto-filled if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => handleChange('location_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="retail_store">Retail Store</option>
                    <option value="office">Office</option>
                    <option value="plant">Plant</option>
                    <option value="school">School</option>
                    <option value="hospital">Hospital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => handleChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Code</label>
                  <input
                    type="text"
                    value={formData.route_code}
                    onChange={(e) => handleChange('route_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="under_construction">Under Construction</option>
                  </select>
                </div>
                <div>
                  <PhoneInput
                    label="Phone"
                    value={formData.phone}
                    onChange={(value) => handleChange('phone', value)}
                    placeholder="Enter phone number"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours of Operation</label>
                  <input
                    type="text"
                    value={formData.hours_of_operation}
                    onChange={(e) => handleChange('hours_of_operation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days of Operation</label>
                  <input
                    type="text"
                    value={formData.days_of_operation}
                    onChange={(e) => handleChange('days_of_operation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Monday - Friday"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Address Line 1"
                    value={formData.line1}
                    onChange={(value) => handleChange('line1', value)}
                    onAddressSelect={handleAddressSelect}
                    placeholder="Start typing address..."
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.line2}
                    onChange={(e) => handleChange('line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={formData.override_billing}
                  onChange={(e) => handleChange('override_billing', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Override customer billing settings for this location
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Contact Name</label>
                  <input
                    type="text"
                    value={formData.billing_contact_name}
                    onChange={(e) => handleChange('billing_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => handleChange('billing_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Zone</label>
                  <input
                    type="text"
                    value={formData.service_zone}
                    onChange={(e) => handleChange('service_zone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Labor Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourly_labor_rate}
                    onChange={(e) => handleChange('hourly_labor_rate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wifi' && (
            <div className="space-y-6">
              {/* WiFi Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">WiFi Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Network Name</label>
                    <input
                      type="text"
                      value={formData.wifi_network_name}
                      onChange={(e) => handleChange('wifi_network_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Password</label>
                    <input
                      type="password"
                      value={formData.wifi_password}
                      onChange={(e) => handleChange('wifi_password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Admin</label>
                    <input
                      type="text"
                      value={formData.wifi_admin}
                      onChange={(e) => handleChange('wifi_admin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Site Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Site Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Supervisor</label>
                    <input
                      type="text"
                      value={formData.site_supervisor}
                      onChange={(e) => handleChange('site_supervisor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <PhoneInput
                      label="Supervisor Cell"
                      value={formData.supervisor_cell}
                      onChange={(value) => handleChange('supervisor_cell', value)}
                      placeholder="Enter supervisor cell"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <PhoneInput
                      label="Site Phone"
                      value={formData.site_phone}
                      onChange={(value) => handleChange('site_phone', value)}
                      placeholder="Enter site phone"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
                    <input
                      type="text"
                      value={formData.contractor}
                      onChange={(e) => handleChange('contractor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                <textarea
                  value={formData.location_general_notes}
                  onChange={(e) => handleChange('location_general_notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={formData.location_special_instructions}
                  onChange={(e) => handleChange('location_special_instructions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Key</label>
                <input
                  type="text"
                  value={formData.location_access_key}
                  onChange={(e) => handleChange('location_access_key', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {location ? 'Update Location' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
