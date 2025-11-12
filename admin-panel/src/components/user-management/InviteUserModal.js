"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  UserPlusIcon,
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getRoleInfo } from '../../utils/roles';
import invitationService from '../../services/invitationService';

export default function InviteUserModal({ isOpen, onClose, onSuccess, user, token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [showHierarchy, setShowHierarchy] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    roleName: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchAvailableRoles();
      // Reset form
      setFormData({
        email: '',
        roleName: ''
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const fetchAvailableRoles = async () => {
    console.log('🔍 [Frontend] fetchAvailableRoles called');
    try {
      console.log('🔍 [Frontend] Calling invitationService.getAvailableRoles()...');
      const response = await invitationService.getAvailableRoles();
      console.log('🔍 [Frontend] API Response:', response);
      console.log('🔍 [Frontend] Response data:', response.data);
      console.log('🔍 [Frontend] Roles array:', response.data?.roles);
      
      const roles = response.data?.roles || [];
      console.log('🔍 [Frontend] Total roles fetched:', roles.length);
      console.log('🔍 [Frontend] Roles:', roles);
      
      // Sort roles by hierarchy level (descending) for beautiful display
      const sortedRoles = roles.sort((a, b) => (b.hierarchy_lvl || 0) - (a.hierarchy_lvl || 0));
      setAvailableRoles(sortedRoles);
      
      // Don't set a default role - let user select
      setFormData(prev => ({ ...prev, roleName: '' }));
    } catch (err) {
      console.error('🔍 [Frontend] Error fetching available roles:', err);
      console.error('🔍 [Frontend] Error details:', err.response?.data);
      setAvailableRoles([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Send invitation - customer assignment happens later by admin
      const response = await invitationService.sendInvitation({
        email: formData.email,
        roleKey: formData.roleName,
        customerIds: [], // No customer assignment at invite time
      });

      setSuccess('Invitation sent successfully!');
      onSuccess && onSuccess();
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create hierarchical role structure with proper indentation
  const createHierarchicalRoleStructure = (roles) => {
    // Define the business hierarchy structure
    const hierarchyStructure = [
      {
        key: 'waterreportcard_super_admin',
        level: 0,
        children: [
          {
            key: 'liquoslabs_general_manager',
            level: 1,
            children: [
              {
                key: 'customer_service_manager',
                level: 2,
                children: [
                  { key: 'tech_support', level: 3, children: [] }
                ]
              },
              {
                key: 'accounting_manager',
                level: 2,
                children: [
                  { key: 'accounting_staff', level: 3, children: [] }
                ]
              },
              {
                key: 'channel_sales_manager',
                level: 2,
                children: [
                  { key: 'platform_field_sales', level: 3, children: [] },
                  {
                    key: 'platform_account_manager',
                    level: 3,
                    children: [
                      {
                        key: 'customer_admin',
                        level: 4,
                        children: [
                          {
                            key: 'branch_manager',
                            level: 5,
                            children: [
                              {
                                key: 'sales_manager',
                                level: 6,
                                children: [
                                  {
                                    key: 'location_account_manager',
                                    level: 7,
                                    children: [
                                      { key: 'location_field_sales', level: 8, children: [] },
                                      {
                                        key: 'customer_account_admin',
                                        level: 8,
                                        children: [
                                          { key: 'branch_key_employee', level: 9, children: [] },
                                          { key: 'vendor', level: 9, children: [] }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                key: 'accounting_dept_manager',
                                level: 6,
                                children: []
                              },
                              {
                                key: 'service_manager',
                                level: 6,
                                children: [
                                  { key: 'third_party_vendor', level: 7, children: [] },
                                  { key: 'field_technician', level: 7, children: [] }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    key: 'national_account_admin',
                    level: 3,
                    children: [
                      {
                        key: 'national_branch_manager',
                        level: 4,
                        children: [
                          {
                            key: 'national_sales_manager',
                            level: 5,
                            children: [
                              {
                                key: 'national_location_account_manager',
                                level: 6,
                                children: [
                                  { key: 'national_location_field_sales', level: 7, children: [] },
                                  {
                                    key: 'national_account_customer_admin',
                                    level: 7,
                                    children: [
                                      { key: 'national_branch_key_employee', level: 8, children: [] },
                                      { key: 'national_vendor', level: 8, children: [] }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            key: 'national_accounting_dept_manager',
                            level: 5,
                            children: []
                          },
                          {
                            key: 'national_location_service_manager',
                            level: 5,
                            children: [
                              { key: 'national_third_party_vendor', level: 6, children: [] },
                              { key: 'national_field_technician', level: 6, children: [] }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                key: 'it_manager',
                level: 2,
                children: [
                  { key: 'platform_contractor', level: 3, children: [] },
                  { key: 'platform_developer', level: 3, children: [] }
                ]
              }
            ]
          }
        ]
      }
    ];

    // Create a flat list with hierarchy information
    const hierarchicalRoles = [];
    
    const processNode = (node, availableRoles) => {
      const role = availableRoles.find(r => r.key === node.key);
      if (role) {
        hierarchicalRoles.push({
          ...role,
          hierarchyLevel: node.level,
          indentLevel: node.level
        });
      }
      
      node.children.forEach(child => {
        processNode(child, availableRoles);
      });
    };

    hierarchyStructure.forEach(root => {
      processNode(root, roles);
    });

    return hierarchicalRoles;
  };

  // Get detailed role description based on business context
  const getRoleBusinessContext = (role) => {
    const contextMap = {
      'waterreportcard_super_admin': {
        description: 'Full platform access and management',
        examples: 'Manages LiquosLabs, content, shopping cart'
      },
      'liquoslabs_general_manager': {
        description: 'LiquosLabs company management',
        examples: 'Oversees all departments and operations'
      },
      'customer_service_manager': {
        description: 'Customer support and service management',
        examples: 'Manages customer inquiries and support team'
      },
      'accounting_manager': {
        description: 'Financial and accounting oversight',
        examples: 'Manages budgets, payroll, financial reporting'
      },
      'channel_sales_manager': {
        description: 'Sales channel and partnership management',
        examples: 'Oversees field sales, account managers, national accounts'
      },
      'it_manager': {
        description: 'Technology and development management',
        examples: 'Manages IT infrastructure, contractors, developers'
      },
      'tech_support': {
        description: 'Technical support and troubleshooting',
        examples: 'Provides technical assistance to customers and staff'
      },
      'accounting_staff': {
        description: 'Accounting department operations',
        examples: 'Handles payables, receivables, payroll processing'
      },
      'platform_field_sales': {
        description: 'Platform field sales operations',
        examples: 'Direct sales and customer relationship management'
      },
      'platform_account_manager': {
        description: 'Platform account management',
        examples: 'Manages key platform accounts and relationships'
      },
      'customer_admin': {
        description: 'Regional customer administration',
        examples: 'Manages regional customers like LiquosIO'
      },
      'national_account_admin': {
        description: 'National account administration',
        examples: 'Manages large national accounts like ARAMARK'
      },
      'branch_manager': {
        description: 'Branch location management',
        examples: 'Oversees specific branch operations and staff'
      },
      'sales_manager': {
        description: 'Sales team management',
        examples: 'Manages sales team and account relationships'
      },
      'accounting_dept_manager': {
        description: 'Branch accounting management',
        examples: 'Manages branch financial operations'
      },
      'service_manager': {
        description: 'Service operations management',
        examples: 'Oversees service delivery and field operations'
      },
      'location_account_manager': {
        description: 'Location-specific account management',
        examples: 'Manages accounts for specific locations'
      },
      'location_field_sales': {
        description: 'Location field sales operations',
        examples: 'Direct sales for specific locations'
      },
      'customer_account_admin': {
        description: 'Customer account administration',
        examples: 'Manages customer-specific accounts like Press Coffee'
      },
      'branch_key_employee': {
        description: 'Key branch personnel',
        examples: 'Essential staff at branch locations'
      },
      'vendor': {
        description: 'External vendor management',
        examples: 'Manages vendor relationships and contracts'
      },
      'field_technician': {
        description: 'Field service technicians',
        examples: 'Provides on-site technical services'
      },
      'third_party_vendor': {
        description: 'Third-party vendor services',
        examples: 'External service providers'
      }
    };
    
    return contextMap[role.key] || {
      description: 'Specialized role in the organization',
      examples: 'Custom role with specific responsibilities'
    };
  };

  // Get selected role info for display
  const selectedRoleInfo = formData.roleName 
    ? getRoleInfo(formData.roleName)
    : { name: 'No role selected', description: 'Please select a role to see its description', color: 'bg-gray-100 text-gray-800 border-gray-200' };

  // Render business hierarchy visualization
  const renderBusinessHierarchy = () => {
    const hierarchy = {
      'waterreportcard_super_admin': {
        title: 'WaterReportCard Super Admin',
        level: 100,
        children: ['liquoslabs_general_manager']
      },
      'liquoslabs_general_manager': {
        title: 'LiquosLabs General Manager',
        level: 90,
        children: ['customer_service_manager', 'accounting_manager', 'channel_sales_manager', 'it_manager']
      },
      'customer_service_manager': {
        title: 'Customer Service Manager',
        level: 80,
        children: ['tech_support']
      },
      'accounting_manager': {
        title: 'Accounting Manager',
        level: 80,
        children: ['accounting_staff']
      },
      'channel_sales_manager': {
        title: 'Channel/Sales Manager',
        level: 80,
        children: ['platform_field_sales', 'platform_account_manager', 'national_account_admin']
      },
      'it_manager': {
        title: 'IT Manager',
        level: 80,
        children: ['platform_contractor', 'platform_developer']
      },
      'platform_account_manager': {
        title: 'Account Manager (Platform)',
        level: 70,
        children: ['customer_admin']
      },
      'customer_admin': {
        title: 'Customer Admin (Regional)',
        level: 50,
        children: ['branch_manager', 'sales_manager', 'accounting_dept_manager', 'service_manager', 'location_account_manager', 'location_field_sales', 'customer_account_admin']
      },
      'national_account_admin': {
        title: 'National Account Admin',
        level: 70,
        children: ['national_branch_manager', 'national_sales_manager', 'national_accounting_dept_manager', 'national_location_service_manager', 'national_location_account_manager', 'national_location_field_sales', 'national_account_customer_admin']
      },
      'branch_manager': {
        title: 'Branch Manager',
        level: 35,
        children: ['sales_manager', 'accounting_dept_manager', 'service_manager', 'location_account_manager', 'location_field_sales', 'customer_account_admin']
      },
      'sales_manager': {
        title: 'Sales Manager',
        level: 30,
        children: ['location_account_manager', 'location_field_sales', 'customer_account_admin']
      },
      'location_account_manager': {
        title: 'Account Manager (Location)',
        level: 25,
        children: ['location_field_sales', 'customer_account_admin']
      },
      'customer_account_admin': {
        title: 'Customer Account Admin',
        level: 40,
        children: ['branch_key_employee', 'vendor']
      },
      'service_manager': {
        title: 'Service Manager',
        level: 30,
        children: ['third_party_vendor', 'field_technician']
      }
    };

    return (
      <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🏢</span>
            Business Hierarchy Overview
          </h4>
          <button
            type="button"
            onClick={() => setShowHierarchy(!showHierarchy)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {showHierarchy ? 'Hide' : 'Show'} Hierarchy
          </button>
        </div>
        
        {showHierarchy && (
          <div className="max-h-48 sm:max-h-64 md:max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-white relative">
            <div className="p-3">
              <div className="font-semibold text-blue-800 mb-2 text-sm flex items-center justify-between">
                <span>🏢 Complete Business Hierarchy</span>
                <span className="text-xs text-gray-500">Scroll to view all roles</span>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="text-gray-700 font-semibold" style={{ paddingLeft: '8px' }}>• WaterReportCard Super Admin</div>
                <div className="text-gray-600" style={{ paddingLeft: '24px' }}>└─ LiquosLabs General Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '40px' }}>├─ Customer Service Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '56px' }}>└─ Tech Support</div>
                <div className="text-gray-600" style={{ paddingLeft: '40px' }}>├─ Accounting Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '56px' }}>└─ Accounting Dept. Staff</div>
                <div className="text-gray-600" style={{ paddingLeft: '40px' }}>├─ Channel/Sales Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '56px' }}>├─ Field Sales</div>
                <div className="text-gray-600" style={{ paddingLeft: '56px' }}>├─ Account Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '72px' }}>└─ Customer Admin (Regional)</div>
                <div className="text-gray-600" style={{ paddingLeft: '88px' }}>├─ Branch Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '104px' }}>├─ Sales Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '120px' }}>├─ Account Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '136px' }}>├─ Field Sales</div>
                <div className="text-gray-600" style={{ paddingLeft: '136px' }}>└─ Customer Account Admin</div>
                <div className="text-gray-600" style={{ paddingLeft: '152px' }}>├─ Branch Key Employee</div>
                <div className="text-gray-600" style={{ paddingLeft: '152px' }}>└─ Vendor</div>
                <div className="text-gray-600" style={{ paddingLeft: '104px' }}>├─ Accounting Dept. Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '104px' }}>└─ Service Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '120px' }}>├─ Third Party Vendor</div>
                <div className="text-gray-600" style={{ paddingLeft: '120px' }}>└─ Field Technician</div>
                <div className="text-gray-600" style={{ paddingLeft: '56px' }}>└─ National Account Admin</div>
                <div className="text-gray-600" style={{ paddingLeft: '72px' }}>└─ Branch Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '88px' }}>├─ Sales Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '104px' }}>├─ Account Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '120px' }}>├─ Field Sales</div>
                <div className="text-gray-600" style={{ paddingLeft: '120px' }}>└─ National Account: Customer Admin</div>
                <div className="text-gray-600" style={{ paddingLeft: '136px' }}>├─ Branch Key Employee</div>
                <div className="text-gray-600" style={{ paddingLeft: '136px' }}>└─ Vendor</div>
                <div className="text-gray-600" style={{ paddingLeft: '88px' }}>├─ Accounting Dept. Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '88px' }}>└─ Service Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '104px' }}>├─ Third Party Vendor</div>
                <div className="text-gray-600" style={{ paddingLeft: '104px' }}>└─ Field Technician</div>
                <div className="text-gray-600" style={{ paddingLeft: '40px' }}>└─ IT Manager</div>
                <div className="text-gray-600" style={{ paddingLeft: '56px' }}>├─ Contractor</div>
                <div className="text-gray-600" style={{ paddingLeft: '56px' }}>└─ Developer</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] min-h-[400px] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlusIcon className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Invite New User</h2>
                  <p className="text-blue-100 text-sm">Send an invitation via email</p>
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
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <KeyIcon className="w-4 h-4 inline mr-1" />
                    Role *
                  </label>

                <select
                  required
                  value={formData.roleName}
                  onChange={(e) => handleInputChange('roleName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm max-h-32 sm:max-h-40 md:max-h-48 overflow-y-auto"
                  size="6"
                >
                  <option value="" disabled>Select a role</option>
                  {availableRoles.length > 0 ? (
                    (() => {
                      const hierarchicalRoles = createHierarchicalRoleStructure(availableRoles);
                      
                      return hierarchicalRoles.map(role => {
                            const roleInfo = getRoleInfo(role.key);
                        const indentLevel = role.indentLevel || 0;
                        const connector = role.indentLevel > 0 ? (role.indentLevel === 1 ? '└─ ' : '├─ ') : '';
                        
                            return (
                          <option 
                            key={role.id} 
                            value={role.key}
                            style={{
                              paddingLeft: `${(indentLevel * 16) + 8}px`,
                              fontFamily: 'monospace',
                              fontSize: '12px'
                            }}
                          >
                            {connector}{roleInfo.name}
                      </option>
                            );
                      });
                    })()
                  ) : (
                    <option value="" disabled>
                      No roles available for invitation
                    </option>
                  )}
                </select>
                
                {availableRoles.length === 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      <strong>No roles available:</strong> You cannot invite users with any roles based on your current permissions.
                    </p>
                  </div>
                )}
                
                {/* Role Description */}
                {formData.roleName && (
                  <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${selectedRoleInfo.color}`}>
                        {selectedRoleInfo.name}
                      </span>
                    </div>
                    
                    {(() => {
                      const selectedRole = availableRoles.find(r => r.key === formData.roleName);
                      const businessContext = selectedRole ? getRoleBusinessContext(selectedRole) : null;
                      
                      return (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700 font-medium">{businessContext?.description || selectedRoleInfo.description}</p>
                          {businessContext?.examples && (
                            <div className="bg-white/50 rounded-md p-2 border border-blue-100">
                              <p className="text-xs text-blue-700 font-medium mb-1">Examples:</p>
                              <p className="text-xs text-blue-600">{businessContext.examples}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              {/* Business Hierarchy Visualization */}
              {renderBusinessHierarchy()}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div>
                {error && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    {success}
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
                  disabled={loading || !formData.email || !formData.roleName}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlusIcon className="w-4 h-4" />
                    )}
                    Send Invitation
                  </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
