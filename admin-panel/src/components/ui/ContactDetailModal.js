'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  XMarkIcon, 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Papa from 'papaparse';
import AddressAutocomplete from '../AddressAutocomplete';

/**
 * ContactDetailModal Component
 * Displays detailed contact information in an expandable modal
 * Supports add/edit modes and parent/sub contact types
 */
export default function ContactDetailModal({ 
  contact, 
  isOpen, 
  onClose, 
  onSave, 
  mode = 'edit', 
  type = 'parent', 
  allContacts = [], 
  onEditSubContact, 
  onAddSubContact,
  onImportSubContacts
}) {
  const [editedContact, setEditedContact] = useState({});
  const [employees, setEmployees] = useState([]);
  const [sameAsLocationAddress, setSameAsLocationAddress] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    contactInfo: true, // Default expanded
    locationAddress: false,
    shippingAddress: false,
    billingAddress: false,
    maintenanceManagement: false,
    employees: false
  });
  const [warningMessage, setWarningMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Extract unique contact types and organize hierarchically (similar to SearchBar)
  const { contactTypesFlat, contactTypesHierarchical } = useMemo(() => {
    const types = new Set();
    allContacts.forEach(c => {
      if (c.contact_type) types.add(c.contact_type);
    });
    
    // Organize hierarchically for values with '/'
    const flatTypes = [];
    const hierarchicalMap = new Map();
    
    types.forEach(type => {
      if (typeof type === 'string' && type.includes('/')) {
        const parts = type.split('/').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          const parent = parts[0];
          const child = parts.slice(1).join('/');
          const childKey = child.toLowerCase();
          
          if (!hierarchicalMap.has(parent)) {
            hierarchicalMap.set(parent, new Map());
          }
          if (!hierarchicalMap.get(parent).has(childKey)) {
            hierarchicalMap.get(parent).set(childKey, {
              child: child,
              fullValue: type
            });
          }
        } else {
          flatTypes.push(type);
        }
      } else {
        flatTypes.push(type);
      }
    });
    
    // Build hierarchical structure: parent -> [children]
    const hierarchical = [];
    hierarchicalMap.forEach((childrenMap, parent) => {
      const uniqueChildren = Array.from(childrenMap.values())
        .sort((a, b) => a.child.localeCompare(b.child))
        .map(({ child, fullValue }) => ({
          value: fullValue,
          label: child
        }));
      
      hierarchical.push({
        parent: parent,
        children: uniqueChildren
      });
    });
    
    // Sort hierarchical by parent name
    hierarchical.sort((a, b) => a.parent.localeCompare(b.parent));
    
    // Sort flat types
    flatTypes.sort();
    
    return {
      contactTypesFlat: flatTypes,
      contactTypesHierarchical: hierarchical
    };
  }, [allContacts]);

  const categories = useMemo(() => {
    const cats = new Set();
    allContacts.forEach(c => {
      if (c.category_description) cats.add(c.category_description);
    });
    return Array.from(cats).sort();
  }, [allContacts]);

  // Clear messages when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setWarningMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Initialize edited contact when contact changes or mode/type changes
  useEffect(() => {
    if (mode === 'add') {
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
        shipping_city: '',
        shipping_state: '',
        shipping_zip: '',
        shipping_country: '',
        billing_address: '',
        billing_city: '',
        billing_state: '',
        billing_zip: '',
        billing_country: '',
        hours_of_operation_start: '',
        hours_of_operation_end: '',
        days_of_operation_start: '',
        days_of_operation_end: '',
        service_zone: '',
        route: '',
        pwsid: '',
        parent_id: type === 'sub' ? (contact?.parent_id || null) : undefined
      });
      setEmployees([]);
      setSameAsLocationAddress(false);
    } else if (contact) {
      setEditedContact({ ...contact });
      // Parse hours and days if they exist
      if (contact.hours_of_operation) {
        const hoursMatch = contact.hours_of_operation.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
        if (hoursMatch) {
          setEditedContact(prev => ({
            ...prev,
            hours_of_operation_start: hoursMatch[1],
            hours_of_operation_end: hoursMatch[2]
          }));
        }
      }
      if (contact.days_of_operation) {
        const daysMatch = contact.days_of_operation.match(/(\w+day)\s*-\s*(\w+day)/i);
        if (daysMatch) {
          setEditedContact(prev => ({
            ...prev,
            days_of_operation_start: daysMatch[1],
            days_of_operation_end: daysMatch[2]
          }));
        }
      }
      // Initialize employees if they exist
      if (contact.employees && Array.isArray(contact.employees)) {
        setEmployees(contact.employees);
      } else {
        setEmployees([]);
      }
      // Check if shipping address is same as location address
      if (contact.shipping_address === contact.physical_address &&
          contact.shipping_city === contact.city &&
          contact.shipping_state === contact.state &&
          contact.shipping_zip === contact.zip) {
        setSameAsLocationAddress(true);
      }
    }
  }, [contact, mode, type]);

  // Update shipping address when "Same as Location Address" is checked
  useEffect(() => {
    if (sameAsLocationAddress) {
      setEditedContact(prev => ({
        ...prev,
        shipping_address: prev.physical_address || '',
        shipping_city: prev.city || '',
        shipping_state: prev.state || '',
        shipping_zip: prev.zip || '',
        shipping_country: prev.country || ''
      }));
    }
  }, [sameAsLocationAddress, editedContact.physical_address, editedContact.city, editedContact.state, editedContact.zip, editedContact.country]);

  if (!isOpen) return null;

  // Validation functions
  const isValidEmail = (email) => {
    if (!email) return true; // Empty is valid (optional field)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    if (!phone) return true; // Empty is valid (optional field)
    const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  // Section validation
  const isSectionValid = (section) => {
    switch (section) {
      case 'contactInfo':
        return editedContact.name && 
               (!editedContact.email || isValidEmail(editedContact.email)) &&
               (!editedContact.phone || isValidPhone(editedContact.phone)) &&
               editedContact.contact_type &&
               editedContact.category_description &&
               editedContact.location_name;
      case 'locationAddress':
        return editedContact.physical_address &&
               editedContact.city &&
               editedContact.state &&
               editedContact.zip &&
               editedContact.country;
      case 'shippingAddress':
        if (sameAsLocationAddress) return true;
        return editedContact.shipping_address &&
               editedContact.shipping_city &&
               editedContact.shipping_state &&
               editedContact.shipping_zip &&
               editedContact.shipping_country;
      case 'billingAddress':
        return editedContact.billing_address &&
               editedContact.billing_city &&
               editedContact.billing_state &&
               editedContact.billing_zip &&
               editedContact.billing_country;
      case 'maintenanceManagement':
        return editedContact.hours_of_operation_start &&
               editedContact.hours_of_operation_end &&
               editedContact.days_of_operation_start &&
               editedContact.days_of_operation_end &&
               editedContact.service_zone &&
               editedContact.route &&
               editedContact.pwsid;
      case 'employees':
        return employees.length === 0 || employees.every(emp => 
          emp.name && 
          (!emp.email || isValidEmail(emp.email)) &&
          (!emp.phone || isValidPhone(emp.phone))
        );
      default:
        return true;
    }
  };

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

  // Handle address selection from AddressAutocomplete for Location Address
  const handleLocationAddressSelect = (addressComponents) => {
    setEditedContact(prev => ({
      ...prev,
      physical_address: addressComponents.address_line1 || prev.physical_address,
      city: addressComponents.city || prev.city,
      state: addressComponents.state || prev.state,
      zip: addressComponents.zip || prev.zip,
      country: addressComponents.country || prev.country || 'USA'
    }));
    // If "Same as Location Address" is checked, also update shipping address
    if (sameAsLocationAddress) {
      setEditedContact(prev => ({
        ...prev,
        shipping_address: addressComponents.address_line1 || prev.physical_address,
        shipping_city: addressComponents.city || prev.city,
        shipping_state: addressComponents.state || prev.state,
        shipping_zip: addressComponents.zip || prev.zip,
        shipping_country: addressComponents.country || prev.country || 'USA'
      }));
    }
  };

  // Handle address selection from AddressAutocomplete for Shipping Address
  const handleShippingAddressSelect = (addressComponents) => {
    setEditedContact(prev => ({
      ...prev,
      shipping_address: addressComponents.address_line1 || prev.shipping_address,
      shipping_city: addressComponents.city || prev.shipping_city,
      shipping_state: addressComponents.state || prev.shipping_state,
      shipping_zip: addressComponents.zip || prev.shipping_zip,
      shipping_country: addressComponents.country || prev.shipping_country || 'USA'
    }));
  };

  // Handle address selection from AddressAutocomplete for Billing Address
  const handleBillingAddressSelect = (addressComponents) => {
    setEditedContact(prev => ({
      ...prev,
      billing_address: addressComponents.address_line1 || prev.billing_address,
      billing_city: addressComponents.city || prev.billing_city,
      billing_state: addressComponents.state || prev.billing_state,
      billing_zip: addressComponents.zip || prev.billing_zip,
      billing_country: addressComponents.country || prev.billing_country || 'USA'
    }));
  };

  const handleSave = () => {
    // Clear previous messages
    setWarningMessage('');

    // Define all sections to check
    const sections = [
      { key: 'contactInfo', name: 'Contact Information' },
      { key: 'locationAddress', name: 'Location Address' },
      { key: 'shippingAddress', name: 'Shipping Address' },
      { key: 'billingAddress', name: 'Billing Address' },
      { key: 'maintenanceManagement', name: 'Maintenance Management Information' },
      { key: 'employees', name: 'Employees' }
    ];

    // Check if all sections are valid
    const invalidSections = sections.filter(section => !isSectionValid(section.key));
    
    if (invalidSections.length > 0) {
      // Show warning message with incomplete sections
      const sectionNames = invalidSections.map(s => s.name).join(', ');
      setWarningMessage(`Please complete the following sections: ${sectionNames}`);
      
      // Expand all invalid sections so user can see what needs to be filled
      setExpandedSections(prev => {
        const updated = { ...prev };
        invalidSections.forEach(section => {
          updated[section.key] = true;
        });
        return updated;
      });
      
      return; // Don't save, return to modal
    }

    // All sections are valid - proceed with save
    // Set parent_id correctly: null for parent contacts, use modal data for sub-contacts
    const parentId = type === 'parent' ? null : (editedContact.parent_id || null);
    
    // Combine hours and days of operation
    const contactToSave = {
      ...editedContact,
      parent_id: parentId,
      hours_of_operation: editedContact.hours_of_operation_start && editedContact.hours_of_operation_end
        ? `${editedContact.hours_of_operation_start} - ${editedContact.hours_of_operation_end}`
        : '',
      days_of_operation: editedContact.days_of_operation_start && editedContact.days_of_operation_end
        ? `${editedContact.days_of_operation_start} - ${editedContact.days_of_operation_end}`
        : '',
      employees: employees
    };
    
    if (onSave) {
      // Show success message
      setSuccessMessage('Contact saved successfully!');
      // Call onSave to update parent component data
      onSave(contactToSave);
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1500);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && contact) {
      setEditedContact({ ...contact });
    } else {
      setEditedContact({});
    }
    setWarningMessage('');
    setSuccessMessage('');
    onClose();
  };

  // Get parent contacts for sub-contact selection
  const parentContacts = allContacts.filter(c => c.parent_id === null || c.parent_id === undefined);

  // Employee management
  const handleAddEmployee = () => {
    setEmployees(prev => [...prev, {
      id: `emp-${Date.now()}-${Math.random()}`,
      name: '',
      email: '',
      phone: '',
      role: '',
      note: ''
    }]);
  };

  const handleEmployeeChange = (id, field, value) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  const handleRemoveEmployee = (id) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const handleImportEmployees = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const importedEmployees = results.data
              .filter(row => row.name || row.email || row.phone)
              .map((row, index) => ({
                id: `emp-import-${Date.now()}-${index}`,
                name: row.name || '',
                email: row.email || '',
                phone: row.phone || '',
                role: row.role || '',
                note: row.note || ''
              }));
            setEmployees(prev => [...prev, ...importedEmployees]);
          },
          error: (error) => {
            alert('Error parsing CSV file: ' + error.message);
          }
        });
      } else if (file.name.endsWith('.xlsx')) {
        // For XLSX, we would need xlsx library
        alert('XLSX import requires additional library. Please use CSV format for now.');
      }
    };
    input.click();
  };

  // Time options
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour % 12 || 12;
      const m = minute.toString().padStart(2, '0');
      const ampm = hour < 12 ? 'AM' : 'PM';
      timeOptions.push(`${h}:${m} ${ampm}`);
    }
  }

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
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
          {/* Warning Message */}
          {warningMessage && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">{warningMessage}</p>
              </div>
              <button
                onClick={() => setWarningMessage('')}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Parent Contact Selector (for sub-contacts) */}
          {type === 'sub' && (
            <div className="mb-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
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
                <div>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv,.xlsx';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        const parentId = editedContact.parent_id;
                        if (!parentId && mode === 'add') {
                          alert('Please select a parent contact first before importing sub-contacts.');
                          return;
                        }
                        
                        if (file.name.endsWith('.csv')) {
                          Papa.parse(file, {
                            header: true,
                            complete: (results) => {
                              const importedSubContacts = results.data
                                .filter(row => row.name || row.email || row.phone)
                                .map((row, index) => ({
                                  id: `sub-import-${Date.now()}-${index}`,
                                  parent_id: parentId || editedContact.parent_id,
                                  name: row.name || '',
                                  email: row.email || '',
                                  phone: row.phone || '',
                                  contact_type: row.contact_type || '',
                                  category_description: row.category_description || '',
                                  location_name: row.location_name || '',
                                  physical_address: row.physical_address || row.address || '',
                                  city: row.city || '',
                                  state: row.state || '',
                                  zip: row.zip || '',
                                  country: row.country || 'USA',
                                  shipping_address: row.shipping_address || '',
                                  shipping_city: row.shipping_city || row.city || '',
                                  shipping_state: row.shipping_state || row.state || '',
                                  shipping_zip: row.shipping_zip || row.zip || '',
                                  shipping_country: row.shipping_country || row.country || 'USA',
                                  billing_address: row.billing_address || '',
                                  billing_city: row.billing_city || row.city || '',
                                  billing_state: row.billing_state || row.state || '',
                                  billing_zip: row.billing_zip || row.zip || '',
                                  billing_country: row.billing_country || row.country || 'USA',
                                  hours_of_operation_start: row.hours_of_operation_start || '',
                                  hours_of_operation_end: row.hours_of_operation_end || '',
                                  days_of_operation_start: row.days_of_operation_start || '',
                                  days_of_operation_end: row.days_of_operation_end || '',
                                  service_zone: row.service_zone || '',
                                  route: row.route || '',
                                  pwsid: row.pwsid || row.water_district || ''
                                }));
                              if (onImportSubContacts) {
                                onImportSubContacts(importedSubContacts);
                              } else {
                                alert(`Successfully imported ${importedSubContacts.length} sub-contacts. Please use the callback to save them.`);
                              }
                            },
                            error: (error) => {
                              alert('Error parsing CSV file: ' + error.message);
                            }
                          });
                        } else if (file.name.endsWith('.xlsx')) {
                          alert('XLSX import requires additional library. Please use CSV format for now.');
                        }
                      };
                      input.click();
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Import Sub-Contacts
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Sections */}
          <div className="space-y-2">
            {/* Contact Information */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('contactInfo')}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.contactInfo ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">Contact Information</span>
                </div>
                {!expandedSections.contactInfo && (
                  isSectionValid('contactInfo') ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  )
                )}
              </button>
              {expandedSections.contactInfo && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={editedContact.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter contact name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-3">
                      <label className="block text-sm text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={editedContact.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                        className={`w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          editedContact.email && !isValidEmail(editedContact.email) 
                            ? 'border-red-500' 
                            : 'border-gray-300'
                        }`}
                      />
                      {editedContact.email && !isValidEmail(editedContact.email) && (
                        <p className="text-xs text-red-500 mt-1">Invalid email format</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editedContact.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        className={`w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          editedContact.phone && !isValidPhone(editedContact.phone) 
                            ? 'border-red-500' 
                            : 'border-gray-300'
                        }`}
                      />
                      {editedContact.phone && !isValidPhone(editedContact.phone) && (
                        <p className="text-xs text-red-500 mt-1">Invalid phone number</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contact Type</label>
                    <select
                      value={editedContact.contact_type || ''}
                      onChange={(e) => handleInputChange('contact_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Contact Type</option>
                      {/* Flat types (no hierarchy) */}
                      {contactTypesFlat.map((type, index) => (
                        <option key={`flat-${index}`} value={type}>
                          {type}
                        </option>
                      ))}
                      {/* Hierarchical types with optgroups */}
                      {contactTypesHierarchical.map((group, groupIndex) => (
                        <optgroup key={`group-${groupIndex}`} label={group.parent}>
                          {group.children.map((child, childIndex) => (
                            <option key={`child-${groupIndex}-${childIndex}`} value={child.value}>
                              {child.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <select
                      value={editedContact.category_description || ''}
                      onChange={(e) => handleInputChange('category_description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Location Name</label>
                    <input
                      type="text"
                      value={editedContact.location_name || ''}
                      onChange={(e) => handleInputChange('location_name', e.target.value)}
                      placeholder="Enter location name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location Address */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('locationAddress')}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.locationAddress ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">Location Address</span>
                </div>
                {!expandedSections.locationAddress && (
                  isSectionValid('locationAddress') ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  )
                )}
              </button>
              {expandedSections.locationAddress && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <AddressAutocomplete
                      label="Address"
                      value={editedContact.physical_address || ''}
                      onChange={(value) => handleInputChange('physical_address', value)}
                      onAddressSelect={handleLocationAddressSelect}
                      placeholder="Type address or select from suggestions..."
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        value={editedContact.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter city"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <input
                        type="text"
                        value={editedContact.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Enter state"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={editedContact.zip || ''}
                        onChange={(e) => handleInputChange('zip', e.target.value)}
                        placeholder="Enter ZIP code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Country</label>
                      <input
                        type="text"
                        value={editedContact.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Enter country"
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
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.shippingAddress ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">Shipping Address</span>
                </div>
                {!expandedSections.shippingAddress && (
                  isSectionValid('shippingAddress') ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  )
                )}
              </button>
              {expandedSections.shippingAddress && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="sameAsLocation"
                      checked={sameAsLocationAddress}
                      onChange={(e) => setSameAsLocationAddress(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sameAsLocation" className="text-sm font-medium text-gray-700">
                      Same as Location Address
                    </label>
                  </div>
                  <div>
                    {!sameAsLocationAddress ? (
                      <AddressAutocomplete
                        label="Address"
                        value={editedContact.shipping_address || ''}
                        onChange={(value) => handleInputChange('shipping_address', value)}
                        onAddressSelect={handleShippingAddressSelect}
                        placeholder="Type address or select from suggestions..."
                        className="w-full"
                      />
                    ) : (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Address</label>
                        <input
                          type="text"
                          value={editedContact.physical_address || ''}
                          placeholder="Same as Location Address"
                          disabled={true}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        value={sameAsLocationAddress ? (editedContact.city || '') : (editedContact.shipping_city || '')}
                        onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                        placeholder={sameAsLocationAddress ? "Same as Location Address" : "Enter city"}
                        disabled={sameAsLocationAddress}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          sameAsLocationAddress ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <input
                        type="text"
                        value={sameAsLocationAddress ? (editedContact.state || '') : (editedContact.shipping_state || '')}
                        onChange={(e) => handleInputChange('shipping_state', e.target.value)}
                        placeholder={sameAsLocationAddress ? "Same as Location Address" : "Enter state"}
                        disabled={sameAsLocationAddress}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          sameAsLocationAddress ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={sameAsLocationAddress ? (editedContact.zip || '') : (editedContact.shipping_zip || '')}
                        onChange={(e) => handleInputChange('shipping_zip', e.target.value)}
                        placeholder={sameAsLocationAddress ? "Same as Location Address" : "Enter ZIP code"}
                        disabled={sameAsLocationAddress}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          sameAsLocationAddress ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Country</label>
                      <input
                        type="text"
                        value={sameAsLocationAddress ? (editedContact.country || '') : (editedContact.shipping_country || '')}
                        onChange={(e) => handleInputChange('shipping_country', e.target.value)}
                        placeholder={sameAsLocationAddress ? "Same as Location Address" : "Enter country"}
                        disabled={sameAsLocationAddress}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          sameAsLocationAddress ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('billingAddress')}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.billingAddress ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">Billing Address</span>
                </div>
                {!expandedSections.billingAddress && (
                  isSectionValid('billingAddress') ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  )
                )}
              </button>
              {expandedSections.billingAddress && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <AddressAutocomplete
                      label="Address"
                      value={editedContact.billing_address || ''}
                      onChange={(value) => handleInputChange('billing_address', value)}
                      onAddressSelect={handleBillingAddressSelect}
                      placeholder="Type address or select from suggestions..."
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        value={editedContact.billing_city || ''}
                        onChange={(e) => handleInputChange('billing_city', e.target.value)}
                        placeholder="Enter city"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <input
                        type="text"
                        value={editedContact.billing_state || ''}
                        onChange={(e) => handleInputChange('billing_state', e.target.value)}
                        placeholder="Enter state"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={editedContact.billing_zip || ''}
                        onChange={(e) => handleInputChange('billing_zip', e.target.value)}
                        placeholder="Enter ZIP code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Country</label>
                      <input
                        type="text"
                        value={editedContact.billing_country || ''}
                        onChange={(e) => handleInputChange('billing_country', e.target.value)}
                        placeholder="Enter country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Maintenance Management Information */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('maintenanceManagement')}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.maintenanceManagement ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">Maintenance Management Information</span>
                </div>
                {!expandedSections.maintenanceManagement && (
                  isSectionValid('maintenanceManagement') ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  )
                )}
              </button>
              {expandedSections.maintenanceManagement && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Hours of Operation (Start)</label>
                      <select
                        value={editedContact.hours_of_operation_start || ''}
                        onChange={(e) => handleInputChange('hours_of_operation_start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select start time</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Hours of Operation (End)</label>
                      <select
                        value={editedContact.hours_of_operation_end || ''}
                        onChange={(e) => handleInputChange('hours_of_operation_end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select end time</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Days of Operation (Start)</label>
                      <select
                        value={editedContact.days_of_operation_start || ''}
                        onChange={(e) => handleInputChange('days_of_operation_start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select start day</option>
                        {dayOptions.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Days of Operation (End)</label>
                      <select
                        value={editedContact.days_of_operation_end || ''}
                        onChange={(e) => handleInputChange('days_of_operation_end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select end day</option>
                        {dayOptions.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Service Zone</label>
                    <input
                      type="text"
                      value={editedContact.service_zone || ''}
                      onChange={(e) => handleInputChange('service_zone', e.target.value)}
                      placeholder="Enter service zone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Route</label>
                      <input
                        type="text"
                        value={editedContact.route || ''}
                        onChange={(e) => handleInputChange('route', e.target.value)}
                        placeholder="Enter route"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Water District (PWSID)</label>
                      <input
                        type="text"
                        value={editedContact.pwsid || ''}
                        onChange={(e) => handleInputChange('pwsid', e.target.value)}
                        placeholder="Enter water district"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Employees */}
            <div className="bg-white rounded-md border border-gray-200">
              <button
                onClick={() => toggleSection('employees')}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.employees ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">Employees</span>
                </div>
                {!expandedSections.employees && (
                  isSectionValid('employees') ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  )
                )}
              </button>
              {expandedSections.employees && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={handleAddEmployee}
                      className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors flex items-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Employee
                    </button>
                    <button
                      onClick={handleImportEmployees}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Import
                    </button>
                  </div>
                  {employees.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {employees.map((employee) => (
                            <tr key={employee.id}>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={employee.name || ''}
                                  onChange={(e) => handleEmployeeChange(employee.id, 'name', e.target.value)}
                                  placeholder="Enter name"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="email"
                                  value={employee.email || ''}
                                  onChange={(e) => handleEmployeeChange(employee.id, 'email', e.target.value)}
                                  placeholder="Enter email"
                                  className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    employee.email && !isValidEmail(employee.email) 
                                      ? 'border-red-500' 
                                      : 'border-gray-300'
                                  }`}
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="tel"
                                  value={employee.phone || ''}
                                  onChange={(e) => handleEmployeeChange(employee.id, 'phone', e.target.value)}
                                  placeholder="Enter phone"
                                  className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    employee.phone && !isValidPhone(employee.phone) 
                                      ? 'border-red-500' 
                                      : 'border-gray-300'
                                  }`}
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={employee.role || ''}
                                  onChange={(e) => handleEmployeeChange(employee.id, 'role', e.target.value)}
                                  placeholder="Enter role"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={employee.note || ''}
                                  onChange={(e) => handleEmployeeChange(employee.id, 'note', e.target.value)}
                                  placeholder="Enter note"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <button
                                  onClick={() => handleRemoveEmployee(employee.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No employees added yet.</p>
                  )}
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
