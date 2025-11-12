"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  UserIcon,
  BuildingOffice2Icon,
  HomeIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function OrganizationHierarchyGuide({ isOpen, onClose }) {
  const [expandedSection, setExpandedSection] = useState('overview');

  const hierarchyLevels = [
    {
      level: 100,
      role: 'PLATFORM_ADMIN',
      title: 'Platform Administrator',
      description: 'Controls the entire system',
      icon: ShieldCheckIcon,
      color: 'bg-red-100 text-red-800 border-red-200',
      canInvite: ['CUSTOMER_ADMIN', 'PLATFORM_SERVICE_MANAGER'],
      responsibilities: [
        'Manage all organizations and users',
        'Set system-wide policies',
        'Access all data and reports',
        'Create new customer companies'
      ]
    },
    {
      level: 90,
      role: 'PLATFORM_SERVICE_MANAGER',
      title: 'Platform Service Manager',
      description: 'Manages platform services and customer admins',
      icon: BuildingOffice2Icon,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      canInvite: ['CUSTOMER_ADMIN'],
      responsibilities: [
        'Oversee customer companies',
        'Manage platform services',
        'Support customer administrators',
        'Monitor system performance'
      ]
    },
    {
      level: 80,
      role: 'CUSTOMER_ADMIN',
      title: 'Customer Administrator',
      description: 'Runs their own company',
      icon: BuildingOfficeIcon,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      canInvite: ['CUSTOMER_SERVICE_MANAGER'],
      responsibilities: [
        'Manage their company\'s users',
        'Set company policies',
        'View company reports',
        'Manage company locations'
      ]
    },
    {
      level: 70,
      role: 'CUSTOMER_SERVICE_MANAGER',
      title: 'Customer Service Manager',
      description: 'Manages services for their company',
      icon: UserGroupIcon,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      canInvite: ['LOCATION_MANAGER'],
      responsibilities: [
        'Manage company locations',
        'Oversee service delivery',
        'Manage location managers',
        'Coordinate with subcontractors'
      ]
    },
    {
      level: 60,
      role: 'LOCATION_MANAGER',
      title: 'Location Manager',
      description: 'Manages a specific location',
      icon: MapPinIcon,
      color: 'bg-green-100 text-green-800 border-green-200',
      canInvite: ['LOCATION_SERVICE_MANAGER'],
      responsibilities: [
        'Manage their location',
        'Oversee daily operations',
        'Manage location staff',
        'Coordinate with service teams'
      ]
    },
    {
      level: 50,
      role: 'LOCATION_SERVICE_MANAGER',
      title: 'Location Service Manager',
      description: 'Manages services at a location',
      icon: WrenchScrewdriverIcon,
      color: 'bg-teal-100 text-teal-800 border-teal-200',
      canInvite: ['SUBCONTRACTOR_ADMIN'],
      responsibilities: [
        'Manage service delivery',
        'Coordinate with subcontractors',
        'Oversee service quality',
        'Manage service schedules'
      ]
    },
    {
      level: 40,
      role: 'SUBCONTRACTOR_ADMIN',
      title: 'Subcontractor Administrator',
      description: 'Manages their subcontractor company',
      icon: BuildingOfficeIcon,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      canInvite: ['SUBCONTRACTOR_SERVICE_MANAGER'],
      responsibilities: [
        'Manage subcontractor company',
        'Oversee service delivery',
        'Manage subcontractor staff',
        'Coordinate with location managers'
      ]
    },
    {
      level: 30,
      role: 'SUBCONTRACTOR_SERVICE_MANAGER',
      title: 'Subcontractor Service Manager',
      description: 'Manages services for subcontractor',
      icon: UserGroupIcon,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      canInvite: ['SUBCONTRACTOR_EMPLOYEE'],
      responsibilities: [
        'Manage service teams',
        'Oversee service delivery',
        'Coordinate with locations',
        'Manage service schedules'
      ]
    },
    {
      level: 20,
      role: 'CUSTOMER_EMPLOYEE',
      title: 'Customer Employee',
      description: 'Works for a customer company',
      icon: UserIcon,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      canInvite: ['LOCATION_EMPLOYEE'],
      responsibilities: [
        'Access company information',
        'Submit work orders',
        'View company reports',
        'Communicate with managers'
      ]
    },
    {
      level: 10,
      role: 'LOCATION_EMPLOYEE',
      title: 'Location Employee',
      description: 'Works at a specific location',
      icon: HomeIcon,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      canInvite: ['SUBCONTRACTOR_EMPLOYEE'],
      responsibilities: [
        'Access location information',
        'Submit work orders',
        'View location reports',
        'Communicate with location manager'
      ]
    },
    {
      level: 5,
      role: 'SUBCONTRACTOR_EMPLOYEE',
      title: 'Subcontractor Employee',
      description: 'Works for a subcontractor',
      icon: UsersIcon,
      color: 'bg-stone-100 text-stone-800 border-stone-200',
      canInvite: [],
      responsibilities: [
        'Access assigned work',
        'Update work status',
        'Communicate with managers',
        'Complete service tasks'
      ]
    }
  ];

  const organizationTypes = [
    {
      type: 'PLATFORM',
      name: 'Platform Organization',
      description: 'The main system that manages everything',
      icon: ShieldCheckIcon,
      color: 'bg-red-100 text-red-800 border-red-200',
      example: 'LiquosLabs (Your Company)'
    },
    {
      type: 'CUSTOMER_COMPANY',
      name: 'Customer Company',
      description: 'A business that uses your services',
      icon: BuildingOfficeIcon,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      example: 'Press Coffee, Green Valley Restaurant'
    },
    {
      type: 'CUSTOMER_LOCATION',
      name: 'Customer Location',
      description: 'A specific location of a customer company',
      icon: MapPinIcon,
      color: 'bg-green-100 text-green-800 border-green-200',
      example: 'Downtown Phoenix, Tempe Branch'
    },
    {
      type: 'SUBCONTRACTOR',
      name: 'Subcontractor Company',
      description: 'A company that provides services to your customers',
      icon: WrenchScrewdriverIcon,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      example: 'ABC Plumbing, XYZ Electrical'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">🏢 Organization & Role Hierarchy Guide</h2>
                <p className="text-blue-100 mt-1">Understanding how your system works</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'overview', name: 'Overview', icon: InformationCircleIcon },
                { id: 'hierarchy', name: 'Role Hierarchy', icon: UserGroupIcon },
                { id: 'organizations', name: 'Organization Types', icon: BuildingOfficeIcon },
                { id: 'invitations', name: 'Invitation Rules', icon: UsersIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setExpandedSection(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      expandedSection === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Overview Section */}
            {expandedSection === 'overview' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">🎯 What is this system?</h3>
                  <p className="text-blue-800 mb-4">
                    This is a <strong>hierarchical role-based access control (RBAC) system</strong> that manages 
                    who can do what in your organization. Think of it like a company org chart, but for digital access.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">🏢 Organizations</h4>
                      <p className="text-sm text-gray-600">
                        Different types of companies and locations that use your system
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">👥 Roles</h4>
                      <p className="text-sm text-gray-600">
                        Different job positions with specific permissions and responsibilities
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">🔐 How does security work?</h3>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span><strong>Hierarchical:</strong> Higher roles can manage lower roles, but not the other way around</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span><strong>Strict Invitations:</strong> You can only invite people exactly one level below you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span><strong>Scope-based:</strong> Users can only see and manage what they&apos;re authorized for</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">📋 Real-world Example</h3>
                  <div className="text-yellow-800">
                    <p className="mb-3">
                      <strong>Scenario:</strong> You run a water management company (Platform) that serves coffee shops (Customers).
                    </p>
                    <div className="space-y-2 text-sm">
                      <p>• <strong>Platform Admin</strong> manages the entire system</p>
                      <p>• <strong>Customer Admin</strong> (Press Coffee owner) manages their company</p>
                      <p>• <strong>Location Manager</strong> (Downtown Phoenix manager) manages that specific store</p>
                      <p>• <strong>Subcontractor</strong> (ABC Plumbing) provides services to the location</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Role Hierarchy Section */}
            {expandedSection === 'hierarchy' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Role Hierarchy (Top to Bottom)</h3>
                  <p className="text-blue-800 text-sm">
                    Each role can only invite users exactly one level below them. This ensures proper management structure.
                  </p>
                </div>

                <div className="space-y-4">
                  {hierarchyLevels.map((role, index) => {
                    const Icon = role.icon;
                    return (
                      <motion.div
                        key={role.role}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role.color}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{role.title}</h4>
                              <span className="text-sm text-gray-500">Level {role.level}</span>
                            </div>
                            <p className="text-gray-600 mb-3">{role.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">✅ Can Invite:</h5>
                                <div className="space-y-1">
                                  {role.canInvite.length > 0 ? (
                                    role.canInvite.map((invitableRole) => (
                                      <span key={invitableRole} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1">
                                        {invitableRole.replace(/_/g, ' ')}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-500 text-sm">No invitation permissions</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">📋 Responsibilities:</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {role.responsibilities.slice(0, 2).map((responsibility, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <span className="text-gray-400 mt-1">•</span>
                                      <span>{responsibility}</span>
                                    </li>
                                  ))}
                                  {role.responsibilities.length > 2 && (
                                    <li className="text-gray-500 text-xs">+{role.responsibilities.length - 2} more...</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Organization Types Section */}
            {expandedSection === 'organizations' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">🏢 Organization Types</h3>
                  <p className="text-blue-800 text-sm">
                    Different types of organizations in your system, each with their own purpose and scope.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {organizationTypes.map((org, index) => {
                    const Icon = org.icon;
                    return (
                      <motion.div
                        key={org.type}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${org.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{org.name}</h4>
                            <p className="text-gray-600 mb-3">{org.description}</p>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-700">
                                <strong>Example:</strong> {org.example}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invitation Rules Section */}
            {expandedSection === 'invitations' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">🚫 Strict Invitation Rules</h3>
                  <p className="text-red-800 text-sm">
                    To maintain security and proper management structure, users can only invite others exactly one level below them.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Invitation Examples</h4>
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="font-semibold text-green-900 mb-2">✅ ALLOWED</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong>Customer Admin (80)</strong> → Can invite <strong>Customer Service Manager (70)</strong></p>
                        <p><strong>Customer Service Manager (70)</strong> → Can invite <strong>Location Manager (60)</strong></p>
                        <p><strong>Location Manager (60)</strong> → Can invite <strong>Location Service Manager (50)</strong></p>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-900 mb-2">❌ NOT ALLOWED</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong>Customer Admin (80)</strong> → Cannot invite <strong>Location Manager (60)</strong> (2 levels down)</p>
                        <p><strong>Customer Service Manager (70)</strong> → Cannot invite <strong>Customer Admin (80)</strong> (higher level)</p>
                        <p><strong>Location Manager (60)</strong> → Cannot invite <strong>Customer Employee (20)</strong> (4 levels down)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Why These Rules?</h4>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Security:</strong> Prevents unauthorized access and privilege escalation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Management:</strong> Ensures proper supervision and accountability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Clarity:</strong> Makes it clear who reports to whom</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Control:</strong> Maintains organizational structure and boundaries</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                💡 <strong>Tip:</strong> This system ensures proper management structure and security
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
