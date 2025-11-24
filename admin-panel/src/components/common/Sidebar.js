'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  PhotoIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserIcon,
  MapPinIcon,
  CubeIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';
import { useUser } from '../../context/UserContext';

const Sidebar = ({ isCollapsed = false, onHover, onCategoryClick }) => {
  const [expandedItems, setExpandedItems] = useState(new Set([]));
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Keep sections expanded if navigating within them
  useEffect(() => {
    if (pathname.startsWith('/dashboard/contaminants')) {
      setExpandedItems(prev => { const next = new Set(prev); next.add('contaminants'); return next; });
    }
    if (pathname.startsWith('/dashboard/v1') || pathname.startsWith('/dashboard/v2')) {
      setExpandedItems(prev => { const next = new Set(prev); next.add('dashboard'); return next; });
    }
    if (pathname.startsWith('/dashboard/customers')) {
      setExpandedItems(prev => { const next = new Set(prev); next.add('customers'); return next; });
    }
  }, [pathname]);

  // Check if user has admin access - allow various admin roles
  const hasAdminAccess = user && (
    user.is_admin ||
    (user.consumer == null) ||
    (user.memberships && user.memberships.some(m => m.is_active && m.role_key !== 'wrc_user'))
  );

  // Check if user is Platform Admin for platform-only features
  const isPlatformAdmin = user && (
    user.is_admin || // Legacy admin flag
    (user.memberships && user.memberships.some(m => m.role_key === 'waterreportcard_super_admin'))
  );

  // All features are restricted to admin users
  const canManageInvitations = hasAdminAccess;

  // Define all navigation items with permission requirements
  const allNavigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      badge: null,
      requiredRole: 'WATERREPORTCARD_SUPER_ADMIN', // Only WaterReportCard Super Admins can see this
      children: [
        { id: 'dashboard-v1', label: 'Website Traffic', href: '/dashboard/v1' },
        { id: 'dashboard-v2', label: 'Website Analytics', href: '/dashboard/v2' }
      ]
    },
    {
      id: 'contaminants',
      label: 'Contaminants',
      icon: DocumentTextIcon,
      badge: null,
      requiredRole: 'WATERREPORTCARD_SUPER_ADMIN', // Only WaterReportCard Super Admins can see this
      children: [
        { id: 'contaminants-types', label: 'Analyte Types', href: '/dashboard/contaminants/types', badge: { variant: 'info', text: '1' } },
        { id: 'contaminants-classifications', label: 'Classifications', href: '/dashboard/contaminants/classifications', badge: { variant: 'info', text: '2' } },
        { id: 'contaminants-subclassifications', label: 'Sub-Classifications', href: '/dashboard/contaminants/subclassifications', badge: { variant: 'info', text: '3' } },
        { id: 'contaminants-analytes', label: 'Analytes', href: '/dashboard/contaminants/analytes', badge: { variant: 'info', text: '4' } }
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: BuildingOfficeIcon,
      badge: null,
      requiredRole: null, // All admin users can see this (checked via hasAdminAccess)
      href: '/dashboard/customers',
      children: []
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: UserGroupIcon,
      badge: null,
      requiredRole: null, // All admin users can see this (checked via hasAdminAccess)
      href: '/dashboard/user-management',
      children: []
    },
    {
      id: 'content-management',
      label: 'Content Management',
      icon: DocumentTextIcon,
      badge: null,
      requiredRole: 'WATERREPORTCARD_SUPER_ADMIN', // Only WaterReportCard Super Admins can see this
      href: '/dashboard/content',
      children: []
    },
    {
      id: 'layer-styles',
      label: 'Map Layers',
      icon: PhotoIcon,
      badge: null,
      requiredRole: 'WATERREPORTCARD_SUPER_ADMIN', // Only WaterReportCard Super Admins can see this
      href: '/dashboard/layer-styles',
      children: []
    },
    {
      id: 'crm-cmms',
      label: 'CRM & CMMS Management',
      icon: BuildingOfficeIcon,
      badge: null,
      requiredRole: 'WATERREPORTCARD_SUPER_ADMIN', // Only WaterReportCard Super Admins can see this
      href: '/dashboard/crm-cmms',
      children: []
    }
  ];

  // Filter navigation items based on user role
  const navigationItems = allNavigationItems.filter(item => {
    // If no required role, show to all users with admin access
    if (!item.requiredRole) {
      return hasAdminAccess;
    }
    
    // If required role is specified, only show to users with that role or higher
    if (item.requiredRole === 'WATERREPORTCARD_SUPER_ADMIN') {
      return isPlatformAdmin;
    }
    
    // Show to all admin roles (customer_admin, service_manager, etc.)
    if (item.requiredRole === 'ADMIN') {
      return hasAdminAccess;
    }
    
    // For future role-based filtering, you can add more conditions here
    return false;
  });

  const toggleExpanded = (itemId) => {
    // Debounce rapid expand/collapse to avoid flicker
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const handleItemClick = (_itemId, href = null) => {
    if (href) router.push(href);
  };

  const handleLogout = () => {
    logout();
  };

  // Generate user initials from firstname and lastname
  const getUserInitials = (firstname, lastname) => {
    if (!firstname && !lastname) return 'U';
    const first = firstname ? firstname[0] : '';
    const last = lastname ? lastname[0] : '';
    return (first + last).toUpperCase();
  };

  const getFullName = (firstname, lastname) => {
    if (!firstname && !lastname) return 'User';
    return `${firstname || ''} ${lastname || ''}`.trim();
  };

  // Get user's primary role display name
  const getUserRoleDisplay = (user) => {
    if (!user) return 'User';
    
    // Check if user has memberships
    if (user.memberships && user.memberships.length > 0) {
      // Find the highest priority role (platform admin first, then others)
      const sortedMemberships = user.memberships.sort((a, b) => {
        const rolePriority = {
          'waterreportcard_super_admin': 1,
          'liquoslabs_general_manager': 2,
          'customer_admin': 3,
          'service_manager': 4,
          'field_technician': 5
        };
        return (rolePriority[a.role_key] || 999) - (rolePriority[b.role_key] || 999);
      });
      
      return getRoleDisplayName(sortedMemberships[0].role_key);
    }
    
    // Fallback to legacy role or default
    return getRoleDisplayName(user.primaryRole) || 'User';
  };

  // Get role display name
  const getRoleDisplayName = (roleName) => {
    const roleNames = {
      // New role hierarchy
      'waterreportcard_super_admin': 'WaterReportCard Super Admin',
      'liquoslabs_general_manager': 'LiquosLabs General Manager',
      'customer_service_manager': 'Customer Service Manager',
      'accounting_manager': 'Accounting Manager',
      'channel_sales_manager': 'Channel/Sales Manager',
      'it_manager': 'IT Manager',
      'tech_support': 'Tech Support',
      'accounting_staff': 'Accounting Dept. Staff',
      'platform_field_sales': 'Field Sales (Platform)',
      'platform_account_manager': 'Account Manager (Platform)',
      'platform_contractor': 'Contractor (Platform)',
      'platform_developer': 'Developer (Platform)',
      'national_account_admin': 'National Account Admin',
      'customer_admin': 'Customer administrator (Regional Account)',
      'regional_account_admin': 'Regional Account Admin',
      'customer_account_admin': 'Customer Account Admin',
      'branch_manager': 'Branch Manager',
      'sales_manager': 'Sales Manager',
      'accounting_dept_manager': 'Accounting Dept. Manager',
      'service_manager': 'Service Manager',
      'location_account_manager': 'Account Manager (Location)',
      'location_field_sales': 'Field Sales (Location)',
      'branch_key_employee': 'Branch Key Employee',
      'field_technician': 'Field Technician',
      'third_party_vendor': 'Third Party Vendor',
      'wrc_user': 'Water Report Card (B2C) User',
      
      'PLATFORM_ADMIN': 'Platform Administrator',
      'PLATFORM_SERVICE_MANAGER': 'Platform Service Manager',
      'CUSTOMER_ADMIN': 'Customer Administrator',
      'CUSTOMER_SERVICE_MANAGER': 'Customer Service Manager',
      'LOCATION_MANAGER': 'Location Manager',
      'LOCATION_SERVICE_MANAGER': 'Location Service Manager',
      'SUBCONTRACTOR_ADMIN': 'Subcontractor Administrator',
      'SUBCONTRACTOR_SERVICE_MANAGER': 'Subcontractor Service Manager',
      'CUSTOMER_EMPLOYEE': 'Customer Employee',
      'LOCATION_EMPLOYEE': 'Location Employee',
      'SUBCONTRACTOR_EMPLOYEE': 'Subcontractor Employee',
      'ADMIN': 'Administrator',
      'SERVICE_MANAGER': 'Service Manager',
      'CUSTOMER_USER': 'Customer User'
    };
    return roleNames[roleName] || roleName || 'User';
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900 text-white flex flex-col h-screen"
      onMouseEnter={() => onHover && onHover(true)}
      onMouseLeave={() => onHover && onHover(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          {!isCollapsed && (
            <motion.span
              initial={false}
              animate={{ opacity: 1 }}
              className="text-xl font-bold"
            >
              Water Report Card
            </motion.span>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {getUserInitials(user?.first_name, user?.last_name)}
            </span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className="flex-1"
            >
              <p className="text-sm font-medium">{getFullName(user?.first_name, user?.last_name)}</p>
              <p className="text-xs text-slate-400">{getUserRoleDisplay(user)}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className="p-4 border-b border-slate-700"
        >
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedItems.has(item.id);
          const hasChildren = item.children && item.children.length > 0;
          const isParentActive = hasChildren && item.children.some(child => pathname === child.href);
          
          // For items with children (like Dashboard), only show as active if it's the activeItem
          // For items without children, show as active if it's the activeItem or if pathname matches href
          const isActive = hasChildren 
            ? isParentActive
            : (item.href ? pathname === item.href : false);

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleExpanded(item.id);
                  } else {
                    handleItemClick(item.id, item.href);
                  }
                  // Trigger sidebar collapse when clicking on any item
                  if (onCategoryClick) {
                    onCategoryClick();
                  }
                }}
                className={clsx(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <motion.span initial={false} animate={{ opacity: 1 }} className="font-medium">
                      {item.label}
                    </motion.span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && !isCollapsed && (
                    <Badge variant={item.badge.variant} size="sm">
                      {item.badge.text}
                    </Badge>
                  )}
                  {hasChildren && !isCollapsed && (
                    <ChevronDownIcon className="w-4 h-4 transition-transform" style={{ transform: `rotate(${isExpanded ? 90 : 0}deg)` }} />
                  )}
                </div>
              </button>

              {/* Children */}
              {hasChildren && isExpanded && !isCollapsed && (
                <div
                  className="ml-8 mt-2 space-y-1"
                >
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        handleItemClick(child.id, child.href);
                        // Trigger sidebar collapse when clicking on child items
                        if (onCategoryClick) {
                          onCategoryClick();
                        }
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 text-left text-sm',
                        (pathname === child.href)
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <span>{child.label}</span>
                      {child.badge && (
                        <Badge variant={child.badge.variant} size="sm">
                          {child.badge.text}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout Button */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;