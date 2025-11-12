'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../context/UserContext';

const Header = ({ isSidebarCollapsed }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // Function to get breadcrumb text based on current pathname
  const getBreadcrumbText = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard / Website Traffic';
      case '/dashboard/v2':
        return 'Dashboard / Website Analytics';
      case '/dashboard/user-management':
        return 'User Management';
      case '/dashboard/content':
        return 'Content Management';
      case '/dashboard/layer-styles':
        return 'Layer Styles';
      case '/dashboard/profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
    setShowUserMenu(false);
  };

  // Generate user initials from firstname and lastname
  const getUserInitials = (firstname, lastname) => {
    if (!firstname && !lastname) return 'U';
    const first = firstname ? firstname[0] : '';
    const last = lastname ? lastname[0] : '';
    return (first + last).toUpperCase();
  };

  // Get full name from firstname and lastname
  const getFullName = (firstname, lastname) => {
    if (!firstname && !lastname) return 'User';
    return `${firstname || ''} ${lastname || ''}`.trim();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Sidebar toggle removed - now controlled by hover */}
        </div>

        {/* Center Section - Dynamic Breadcrumb */}
        <div className="hidden lg:flex items-center text-sm text-gray-500">
          <span className="text-gray-900">{getBreadcrumbText()}</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {getUserInitials(user?.first_name, user?.last_name)}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{getFullName(user?.first_name, user?.last_name)}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserCircleIcon className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Cog6ToothIcon className="w-4 h-4 mr-3" />
                    Settings
                  </a>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 