'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOffice2Icon, MapPinIcon, EnvelopeIcon, PhoneIcon, UserIcon, DocumentTextIcon, CurrencyDollarIcon, WifiIcon, CogIcon, UserGroupIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import AddressAutocomplete from '../../../../components/AddressAutocomplete';
import PhoneInput from '../../../../components/PhoneInput';
import api from '../../../../services/api';

export default function EditCustomerModal({ isOpen, onClose, customer, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');

  // Define sections for sidebar navigation
  const sections = [
    { id: 'basic', name: 'Basic Info', icon: BuildingOffice2Icon },
    { id: 'location', name: 'Location', icon: MapPinIcon },
    { id: 'billing', name: 'Billing', icon: CurrencyDollarIcon },
    { id: 'contacts', name: 'Contacts', icon: UserIcon },
    { id: 'technical', name: 'Technical', icon: WifiIcon },
    { id: 'service', name: 'Service Provider', icon: CogIcon },
    { id: 'employees', name: 'Employees', icon: UserGroupIcon },
    { id: 'additional', name: 'Additional', icon: InformationCircleIcon }
  ];

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      console.log('EditCustomerModal - Customer data received:', customer);
      console.log('EditCustomerModal - Customer keys:', Object.keys(customer));
      console.log('EditCustomerModal - Address-related fields:', {
        location_zip: customer.location_zip,
        billing_zip: customer.billing_zip,
        location_address_line_1: customer.location_address_line_1,
        location_city: customer.location_city,
        location_state: customer.location_state,
        billing_address_line_1: customer.billing_address_line_1,
        billing_city: customer.billing_city,
        billing_state: customer.billing_state
      });
      setFormData({
        name: customer.name || '',
        status: customer.status || 'active',
        contact_id: customer.contact_id || '',
        contact_name: customer.contact_name || '',
        sub_contact_name: customer.sub_contact_name || '',
        sub_contact_parent_id: customer.sub_contact_parent_id || '',
        
        // Location information
        location_name: customer.location_name || '',
        location_address_line_1: customer.location_address_line_1 || '',
        location_address_line_2: customer.location_address_line_2 || '',
        location_city: customer.location_city || '',
        location_state: customer.location_state || '',
        location_zip: customer.location_zip || '',
        location_country: customer.location_country || '',
        location_region: customer.location_region || '',
        location_campus: customer.location_campus || '',
        location_building_name: customer.location_building_name || '',
        location_route: customer.location_route || '',
        location_pwsid: customer.location_pwsid || '',
        location_phone_no: customer.location_phone_no || '',
        location_service_zone: customer.location_service_zone || '',
        
        // Billing information
        billing_contact_type: customer.billing_contact_type || '',
        billing_address_contact_name: customer.billing_address_contact_name || '',
        billing_address_line_1: customer.billing_address_line_1 || '',
        billing_address_line_2: customer.billing_address_line_2 || '',
        billing_city: customer.billing_city || '',
        billing_state: customer.billing_state || '',
        billing_zip: customer.billing_zip || '',
        billing_country: customer.billing_country || '',
        billing_email: customer.billing_email || '',
        billing_contact_note: customer.billing_contact_note || '',
        billing_type: customer.billing_type || '',
        billing_name: customer.billing_name || '',
        hourly_labor_rate: customer.hourly_labor_rate || '',
        discount_rate: customer.discount_rate || '',
        sales_tax_rate: customer.sales_tax_rate || '',
        
        // Contact information
        contact_1_email: customer.contact_1_email || '',
        contact_1_first_name: customer.contact_1_first_name || '',
        contact_1_last_name: customer.contact_1_last_name || '',
        contact_1_direct_line: customer.contact_1_direct_line || '',
        contact_1_cell_phone: customer.contact_1_cell_phone || '',
        contact_1_title: customer.contact_1_title || '',
        contact_1_notes: customer.contact_1_notes || '',
        
        contact_2_name: customer.contact_2_name || '',
        contact_2_title: customer.contact_2_title || '',
        contact_2_direct_line: customer.contact_2_direct_line || '',
        contact_2_email: customer.contact_2_email || '',
        contact_2_cell: customer.contact_2_cell || '',
        contact_2_notes: customer.contact_2_notes || '',
        
        // Technical information
        wifi_network_name: customer.wifi_network_name || '',
        wifi_password: customer.wifi_password || '',
        wifi_admin: customer.wifi_admin || '',
        
        // Service provider information
        architect_firm: customer.architect_firm || '',
        architect_fax_no: customer.architect_fax_no || '',
        maintenance_profile: customer.maintenance_profile || '',
        architect_electrical_contractor: customer.architect_electrical_contractor || '',
        mntc_con_start_date: customer.mntc_con_start_date || '',
        mntc_con_end_date: customer.mntc_con_end_date || '',
        elect_foreman: customer.elect_foreman || '',
        billing_dept_consultant: customer.billing_dept_consultant || '',
        installation_date: customer.installation_date || '',
        consultant_cell: customer.consultant_cell || '',
        spelling_contractor: customer.spelling_contractor || '',
        route_site_supervisor: customer.route_site_supervisor || '',
        configuration_type: customer.configuration_type || '',
        supervisor_cell: customer.supervisor_cell || '',
        site_phone: customer.site_phone || '',
        
        // Employee information
        employees_contact_1: customer.employees_contact_1 || '',
        employees_contact_1_last_name: customer.employees_contact_1_last_name || '',
        employees_contact_1_direct_line: customer.employees_contact_1_direct_line || '',
        employees_contact_1_cell_phone: customer.employees_contact_1_cell_phone || '',
        employees_contact_1_email: customer.employees_contact_1_email || '',
        employees_contact_1_title: customer.employees_contact_1_title || '',
        employees_key_person: customer.employees_key_person || '',
        employees_contact_notes: customer.employees_contact_notes || '',
        
        // Additional business fields
        access_key: customer.access_key || '',
        email_subscriber: customer.email_subscriber || false,
        contract_terms: customer.contract_terms || '',
        custom_field_custom3: customer.custom_field_custom3 || '',
        general_notes: customer.general_notes || '',
        special_instructions: customer.special_instructions || '',
        
        // Lead source and marketing
        referral_lead_source: customer.referral_lead_source || '',
        url: customer.url || '',
        
        // System fields
        created_at: customer.created_at || '',
        updated_at: customer.updated_at || ''
      });
      console.log('EditCustomerModal - Form data initialized:', {
        name: customer.name || '',
        location_zip: customer.location_zip || '',
        billing_zip: customer.billing_zip || '',
        contact_1_notes: customer.contact_1_notes || '',
        billing_contact_note: customer.billing_contact_note || '',
        access_key: customer.access_key || '',
        contract_terms: customer.contract_terms || '',
        custom_field_custom3: customer.custom_field_custom3 || '',
        // Debug all address-related fields
        location_address_line_1: customer.location_address_line_1 || '',
        location_address_line_2: customer.location_address_line_2 || '',
        location_city: customer.location_city || '',
        location_state: customer.location_state || '',
        location_country: customer.location_country || '',
        location_pwsid: customer.location_pwsid || '',
        billing_address_line_1: customer.billing_address_line_1 || '',
        billing_address_line_2: customer.billing_address_line_2 || '',
        billing_city: customer.billing_city || '',
        billing_state: customer.billing_state || '',
        billing_country: customer.billing_country || ''
      });
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressSelect = (addressComponents) => {
    setFormData(prev => ({
      ...prev,
      location_address_line_1: addressComponents.address_line1 || prev.location_address_line_1,
      location_address_line_2: addressComponents.address_line2 || prev.location_address_line_2,
      location_city: addressComponents.city || prev.location_city,
      location_state: addressComponents.state || prev.location_state,
      location_zip: addressComponents.zip || prev.location_zip,
      location_latitude: addressComponents.latitude || prev.location_latitude,
      location_longitude: addressComponents.longitude || prev.location_longitude,
    }));
  };

  const handleBillingAddressSelect = (addressComponents) => {
    setFormData(prev => ({
      ...prev,
      billing_address_line_1: addressComponents.address_line1 || prev.billing_address_line_1,
      billing_address_line_2: addressComponents.address_line2 || prev.billing_address_line_2,
      billing_city: addressComponents.city || prev.billing_city,
      billing_state: addressComponents.state || prev.billing_state,
      billing_zip: addressComponents.zip || prev.billing_zip,
      billing_latitude: addressComponents.latitude || prev.billing_latitude,
      billing_longitude: addressComponents.longitude || prev.billing_longitude,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/api/customers/${customer.id}`, formData);

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
              {/* Basic Information */}
              {activeSection === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status || 'active'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="prospect">Prospect</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Parent Customer</label>
                      <select
                        name="parent_id"
                        value={formData.parent_id || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No parent (root customer)</option>
                        {/* Note: availableCustomers would need to be passed as prop */}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact ID</label>
                      <input
                        type="text"
                        name="contact_id"
                        value={formData.contact_id || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                      <input
                        type="text"
                        name="contact_name"
                        value={formData.contact_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Location Information */}
              {activeSection === 'location' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    Location Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                      <input
                        type="text"
                        name="location_name"
                        value={formData.location_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <AddressAutocomplete
                        label="Address"
                        value={formData.location_address_line_1}
                        onChange={(value) => setFormData(prev => ({ ...prev, location_address_line_1: value }))}
                        onAddressSelect={handleAddressSelect}
                        placeholder="Start typing address for suggestions..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                      <input
                        type="text"
                        name="location_address_line_2"
                        value={formData.location_address_line_2 || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Apartment, suite, unit, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="location_city"
                        value={formData.location_city || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto-filled from address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="location_state"
                        value={formData.location_state || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto-filled from address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        name="location_zip"
                        value={formData.location_zip || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto-filled from address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                      <input
                        type="text"
                        name="location_region"
                        value={formData.location_region || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                      <input
                        type="text"
                        name="location_campus"
                        value={formData.location_campus || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Building Name</label>
                      <input
                        type="text"
                        name="location_building_name"
                        value={formData.location_building_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                      <input
                        type="text"
                        name="location_route"
                        value={formData.location_route || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PWSID</label>
                      <input
                        type="text"
                        name="location_pwsid"
                        value={formData.location_pwsid || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <PhoneInput
                        label="Phone Number"
                        value={formData.location_phone_no}
                        onChange={(value) => setFormData(prev => ({ ...prev, location_phone_no: value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Zone</label>
                      <input
                        type="text"
                        name="location_service_zone"
                        value={formData.location_service_zone || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Information */}
              {activeSection === 'billing' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Billing Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Contact Type</label>
                      <input
                        type="text"
                        name="billing_contact_type"
                        value={formData.billing_contact_type || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Contact Name</label>
                      <input
                        type="text"
                        name="billing_address_contact_name"
                        value={formData.billing_address_contact_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <AddressAutocomplete
                        label="Billing Address"
                        value={formData.billing_address_line_1}
                        onChange={(value) => setFormData(prev => ({ ...prev, billing_address_line_1: value }))}
                        onAddressSelect={handleBillingAddressSelect}
                        placeholder="Start typing billing address for suggestions..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Address Line 2</label>
                      <input
                        type="text"
                        name="billing_address_line_2"
                        value={formData.billing_address_line_2 || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Apartment, suite, unit, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing City</label>
                      <input
                        type="text"
                        name="billing_city"
                        value={formData.billing_city || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto-filled from address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing State</label>
                      <input
                        type="text"
                        name="billing_state"
                        value={formData.billing_state || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto-filled from address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing ZIP</label>
                      <input
                        type="text"
                        name="billing_zip"
                        value={formData.billing_zip || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto-filled from address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Email</label>
                      <input
                        type="email"
                        name="billing_email"
                        value={formData.billing_email || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Contact Note</label>
                      <input
                        type="text"
                        name="billing_contact_note"
                        value={formData.billing_contact_note || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Type</label>
                      <input
                        type="text"
                        name="billing_type"
                        value={formData.billing_type || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Name</label>
                      <input
                        type="text"
                        name="billing_name"
                        value={formData.billing_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Labor Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        name="hourly_labor_rate"
                        value={formData.hourly_labor_rate || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="discount_rate"
                        value={formData.discount_rate || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sales Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.0001"
                        name="sales_tax_rate"
                        value={formData.sales_tax_rate || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {activeSection === 'contacts' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2" />
                    Contact Information
                  </h3>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Primary Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            name="contact_1_first_name"
                            value={formData.contact_1_first_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            name="contact_1_last_name"
                            value={formData.contact_1_last_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            name="contact_1_email"
                            value={formData.contact_1_email || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                          <input
                            type="text"
                            name="contact_1_title"
                            value={formData.contact_1_title || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <PhoneInput
                            label="Direct Line"
                            value={formData.contact_1_direct_line}
                            onChange={(value) => setFormData(prev => ({ ...prev, contact_1_direct_line: value }))}
                            placeholder="Enter direct line"
                          />
                        </div>
                        
                        <div>
                          <PhoneInput
                            label="Cell Phone"
                            value={formData.contact_1_cell_phone}
                            onChange={(value) => setFormData(prev => ({ ...prev, contact_1_cell_phone: value }))}
                            placeholder="Enter cell phone"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Notes</label>
                          <textarea
                            name="contact_1_notes"
                            value={formData.contact_1_notes || ''}
                            onChange={handleInputChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter contact notes..."
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Secondary Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                          <input
                            type="text"
                            name="contact_2_name"
                            value={formData.contact_2_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                          <input
                            type="text"
                            name="contact_2_title"
                            value={formData.contact_2_title || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            name="contact_2_email"
                            value={formData.contact_2_email || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <PhoneInput
                            label="Direct Line"
                            value={formData.contact_2_direct_line}
                            onChange={(value) => setFormData(prev => ({ ...prev, contact_2_direct_line: value }))}
                            placeholder="Enter direct line"
                          />
                        </div>
                        
                        <div>
                          <PhoneInput
                            label="Cell Phone"
                            value={formData.contact_2_cell}
                            onChange={(value) => setFormData(prev => ({ ...prev, contact_2_cell: value }))}
                            placeholder="Enter cell phone"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Notes</label>
                          <textarea
                            name="contact_2_notes"
                            value={formData.contact_2_notes || ''}
                            onChange={handleInputChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter contact notes..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Information */}
              {activeSection === 'technical' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <WifiIcon className="w-5 h-5 mr-2" />
                    Technical Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WiFi Network Name</label>
                      <input
                        type="text"
                        name="wifi_network_name"
                        value={formData.wifi_network_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WiFi Password</label>
                      <input
                        type="password"
                        name="wifi_password"
                        value={formData.wifi_password || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WiFi Admin</label>
                      <input
                        type="text"
                        name="wifi_admin"
                        value={formData.wifi_admin || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Service Provider Information */}
              {activeSection === 'service' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <CogIcon className="w-5 h-5 mr-2" />
                    Service Provider Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Architect Firm</label>
                      <input
                        type="text"
                        name="architect_firm"
                        value={formData.architect_firm || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Architect Fax No</label>
                      <input
                        type="text"
                        name="architect_fax_no"
                        value={formData.architect_fax_no || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Profile</label>
                      <input
                        type="text"
                        name="maintenance_profile"
                        value={formData.maintenance_profile || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Architect Electrical Contractor</label>
                      <input
                        type="text"
                        name="architect_electrical_contractor"
                        value={formData.architect_electrical_contractor || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Contract Start Date</label>
                      <input
                        type="date"
                        name="mntc_con_start_date"
                        value={formData.mntc_con_start_date || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Contract End Date</label>
                      <input
                        type="date"
                        name="mntc_con_end_date"
                        value={formData.mntc_con_end_date || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Electrical Foreman</label>
                      <input
                        type="text"
                        name="elect_foreman"
                        value={formData.elect_foreman || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Dept Consultant</label>
                      <input
                        type="text"
                        name="billing_dept_consultant"
                        value={formData.billing_dept_consultant || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Installation Date</label>
                      <input
                        type="date"
                        name="installation_date"
                        value={formData.installation_date || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <PhoneInput
                        label="Consultant Cell"
                        value={formData.consultant_cell}
                        onChange={(value) => setFormData(prev => ({ ...prev, consultant_cell: value }))}
                        placeholder="Enter consultant cell"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Spelling Contractor</label>
                      <input
                        type="text"
                        name="spelling_contractor"
                        value={formData.spelling_contractor || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Route Site Supervisor</label>
                      <input
                        type="text"
                        name="route_site_supervisor"
                        value={formData.route_site_supervisor || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Configuration Type</label>
                      <input
                        type="text"
                        name="configuration_type"
                        value={formData.configuration_type || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <PhoneInput
                        label="Supervisor Cell"
                        value={formData.supervisor_cell}
                        onChange={(value) => setFormData(prev => ({ ...prev, supervisor_cell: value }))}
                        placeholder="Enter supervisor cell"
                      />
                    </div>
                    
                    <div>
                      <PhoneInput
                        label="Site Phone"
                        value={formData.site_phone}
                        onChange={(value) => setFormData(prev => ({ ...prev, site_phone: value }))}
                        placeholder="Enter site phone"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Employee Information */}
              {activeSection === 'employees' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Employee Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee Contact 1</label>
                      <input
                        type="text"
                        name="employees_contact_1"
                        value={formData.employees_contact_1 || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee Contact 1 Last Name</label>
                      <input
                        type="text"
                        name="employees_contact_1_last_name"
                        value={formData.employees_contact_1_last_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <PhoneInput
                        label="Employee Contact 1 Direct Line"
                        value={formData.employees_contact_1_direct_line}
                        onChange={(value) => setFormData(prev => ({ ...prev, employees_contact_1_direct_line: value }))}
                        placeholder="Enter direct line"
                      />
                    </div>
                    
                    <div>
                      <PhoneInput
                        label="Employee Contact 1 Cell Phone"
                        value={formData.employees_contact_1_cell_phone}
                        onChange={(value) => setFormData(prev => ({ ...prev, employees_contact_1_cell_phone: value }))}
                        placeholder="Enter cell phone"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee Contact 1 Email</label>
                      <input
                        type="email"
                        name="employees_contact_1_email"
                        value={formData.employees_contact_1_email || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee Contact 1 Title</label>
                      <input
                        type="text"
                        name="employees_contact_1_title"
                        value={formData.employees_contact_1_title || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee Key Person</label>
                      <input
                        type="text"
                        name="employees_key_person"
                        value={formData.employees_key_person || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee Contact Notes</label>
                      <textarea
                        name="employees_contact_notes"
                        value={formData.employees_contact_notes || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {activeSection === 'additional' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2" />
                    Additional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Referral Lead Source</label>
                      <input
                        type="text"
                        name="referral_lead_source"
                        value={formData.referral_lead_source || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                      <input
                        type="url"
                        name="url"
                        value={formData.url || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access Key</label>
                      <input
                        type="text"
                        name="access_key"
                        value={formData.access_key || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contract Terms</label>
                      <input
                        type="text"
                        name="contract_terms"
                        value={formData.contract_terms || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Field 3</label>
                      <input
                        type="text"
                        name="custom_field_custom3"
                        value={formData.custom_field_custom3 || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="email_subscriber"
                          checked={formData.email_subscriber}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Email Subscriber</span>
                      </label>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">General Notes</label>
                      <textarea
                        name="general_notes"
                        value={formData.general_notes || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                      <textarea
                        name="special_instructions"
                        value={formData.special_instructions || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
