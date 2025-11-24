'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '../../context/UserContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PhotoIcon,
  ArrowRightIcon,
  ChartBarIcon,
  Square3Stack3DIcon,
  UserIcon,
  MapPinIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // Check if user has admin access - unified rule
  const hasAdminAccess = user && (
    (user.consumer == null) ||
    (user.memberships && user.memberships.some(m => m.is_active && m.role_key !== 'wrc_user'))
  );

  // Check if user is Platform Admin for platform-only features
  const isPlatformAdmin = user && (
    user.is_admin || // Legacy admin flag
    (user.memberships && user.memberships.some(m => m.role_key === 'waterreportcard_super_admin'))
  );

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
      
    };
    return roleNames[roleName] || roleName || 'User';
  };

  // Define all navigation cards with permission requirements
  const allNavigationCards = [
    {
      icon: ChartBarIcon,
      title: "Website Traffic",
      description: "View analytics, charts, and performance metrics",
      href: "/dashboard/v1",
      color: "bg-blue-500",
      iconColor: "text-white",
      requiredRole: 'PLATFORM_ADMIN'
    },
    {
      icon: DocumentTextIcon,
      title: "Contaminants",
      description: "Analyte types, classifications, and data",
      href: "/dashboard/contaminants/types",
      color: "bg-purple-500",
      iconColor: "text-white",
      requiredRole: 'PLATFORM_ADMIN'
    },
    {
      icon: BuildingOfficeIcon,
      title: "Contact Management",
      description: "Manage contacts and their hierarchical relationships",
      href: "/dashboard/contacts",
      color: "bg-green-500",
      iconColor: "text-white",
      requiredRole: 'ADMIN' // All admin roles can see this
    },
    {
      icon: UserGroupIcon,
      title: "User Management",
      description: "Manage users, roles, and permissions",
      href: "/dashboard/user-management",
      color: "bg-orange-500",
      iconColor: "text-white",
      requiredRole: 'ADMIN' // All admin roles can see this
    },
    {
      icon: DocumentTextIcon,
      title: "Content Management",
      description: "Manage system content and documents",
      href: "/dashboard/content",
      color: "bg-indigo-500",
      iconColor: "text-white",
      requiredRole: 'PLATFORM_ADMIN'
    },
    {
      icon: PhotoIcon,
      title: "Map Layers",
      description: "Configure map layers and styles",
      href: "/dashboard/layer-styles",
      color: "bg-pink-500",
      iconColor: "text-white",
      requiredRole: 'PLATFORM_ADMIN'
    },
    {
      icon: Square3Stack3DIcon,
      title: "CRM & CMMS Management",
      description: "Manage CRM and CMMS data",
      href: "/dashboard/crm-cmms",
      color: "bg-green-500",
      iconColor: "text-white",
      requiredRole: 'PLATFORM_ADMIN'
    },
    // {
    //   icon: UserIcon,
    //   title: "Contact Management",
    //   description: "Manage contacts and their data",
    //   href: "/dashboard/contacts",
    //   color: "bg-teal-500",
    //   iconColor: "text-white",
    //   requiredRole: 'PLATFORM_ADMIN' // Only Platform Admins can see this
    // },
  ];

  // Filter navigation cards based on user role
  const navigationCards = allNavigationCards.filter(card => {
    // Show cards that require platform admin role to platform admins
    if (card.requiredRole === 'PLATFORM_ADMIN') {
      return isPlatformAdmin;
    }
    
    // Show cards that require admin role to all admin users
    if (card.requiredRole === 'ADMIN') {
      return hasAdminAccess;
    }
    
    return false;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const handleCardClick = (href) => {
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row overflow-hidden min-h-screen">
      {/* Left Section - Modern Dark Blue Background */}
      <motion.div 
        className="lg:w-2/5 w-full bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-4 sm:p-6 md:p-8 lg:p-10 xl:p-15 flex flex-col justify-between relative overflow-hidden min-h-[50vh] lg:min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-blue-400 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-16 h-16 bg-indigo-400 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-cyan-400 rounded-full opacity-15 blur-lg"></div>

        {/* Logo and Tagline */}
        <motion.div variants={itemVariants} className="mb-4 sm:mb-6 relative z-10 mt-8 sm:mt-12 md:mt-16 lg:mt-20">
            <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mr-2 sm:mr-3 border border-white/20">
              <Image
                src="/liquos-logo-white.png"
                alt="Liquos Logo"
                width={32}
                height={32}
                className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Water Report Card
              </h1>
              <p className="text-blue-200 text-xs sm:text-xs lg:text-sm">Powered by LiquosLabs</p>
            </div>
          </div>
          <p className="text-blue-100 text-xs sm:text-sm lg:text-base font-light">
            Transform your water treatment business with intelligent insights and comprehensive management tools.
          </p>
        </motion.div>

        {/* Main Value Propositions */}
        <motion.div variants={itemVariants} className="flex-1 flex flex-col justify-center relative z-10">
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Welcome Message */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                Welcome, {user?.first_name || 'User'}!
              </h2>
              <p className="text-blue-100">
                <span className="inline-flex items-center gap-2">
                  <span className="text-blue-200 text-xs sm:text-sm">Your role</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm">
                    {(() => {
                      const highest = user?.memberships?.filter(m => m.is_active).sort((a,b) => (b.hierarchy_lvl||0)-(a.hierarchy_lvl||0))[0];
                      const roleKey = highest?.role_key;
                      const names = {
                        waterreportcard_super_admin: 'WaterReportCard Super Admin',
                        liquoslabs_general_manager: 'LiquosLabs General Manager',
                        customer_service_manager: 'Customer Service Manager',
                        accounting_manager: 'Accounting Manager',
                        channel_sales_manager: 'Channel/Sales Manager',
                        it_manager: 'IT Manager',
                        tech_support: 'Tech Support',
                        accounting_staff: 'Accounting Dept. Staff',
                        platform_field_sales: 'Field Sales (Platform)',
                        platform_account_manager: 'Account Manager (Platform)',
                        platform_contractor: 'Contractor (Platform)',
                        platform_developer: 'Developer (Platform)',
                        national_account_admin: 'National Account Admin',
                        customer_admin: 'Customer administrator (Regional Account)',
                        customer_account_admin: 'Customer Account Admin',
                        branch_manager: 'Branch Manager',
                        sales_manager: 'Sales Manager',
                        accounting_dept_manager: 'Accounting Dept. Manager',
                        service_manager: 'Service Manager',
                        location_account_manager: 'Account Manager (Location)',
                        location_field_sales: 'Field Sales (Location)',
                        branch_key_employee: 'Branch Key Employee',
                        field_technician: 'Field Technician',
                        third_party_vendor: 'Third Party Vendor'
                      };
                      return names[roleKey] || 'Administrator';
                    })()}
                  </span>
                </span>
              </p>
            </div>
            {/* Quick Links */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/dashboard/contacts')}
                className="group text-left text-sm sm:text-base text-blue-100 hover:text-white transition"
              >
                <span className="block">Contact Management</span>
                <span className="block h-px w-0 group-hover:w-40 bg-gradient-to-r from-cyan-300 to-blue-400 transition-all duration-300"></span>
              </button>
              <button
                onClick={() => router.push('/dashboard/user-management')}
                className="group text-left text-sm sm:text-base text-blue-100 hover:text-white transition"
              >
                <span className="block">User Management</span>
                <span className="block h-px w-0 group-hover:w-40 bg-gradient-to-r from-cyan-300 to-blue-400 transition-all duration-300"></span>
              </button>
            </div>
            {/* Keep optional additional platform-only promos for super admins */}
            {isPlatformAdmin && (
              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={() => router.push('/dashboard/v1')}
                  className="group text-left text-sm sm:text-base text-blue-100 hover:text-white transition"
                >
                  <span className="block">Website Traffic</span>
                  <span className="block h-px w-0 group-hover:w-40 bg-gradient-to-r from-cyan-300 to-blue-400 transition-all duration-300"></span>
                </button>
                <button
                  onClick={() => router.push('/dashboard/contaminants/types')}
                  className="group text-left text-sm sm:text-base text-blue-100 hover:text-white transition"
                >
                  <span className="block">Contaminants</span>
                  <span className="block h-px w-0 group-hover:w-40 bg-gradient-to-r from-cyan-300 to-blue-400 transition-all duration-300"></span>
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Modern Visualization */}
        <motion.div variants={itemVariants} className="mt-4 sm:mt-6 relative z-10">
          <div className="relative">
            {/* Modern Device Frame */}
            <div className="w-32 h-20 sm:w-40 sm:h-24 md:w-44 md:h-26 lg:w-48 lg:h-28 xl:w-56 xl:h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mx-auto relative shadow-2xl border border-gray-700">
              <div className="absolute inset-1 lg:inset-2 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl"></div>
              <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Floating Data Visualization */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 sm:-translate-y-6 lg:-translate-y-8">
              <div className="w-28 h-16 sm:w-32 sm:h-20 md:w-36 md:h-22 lg:w-40 lg:h-24 xl:w-48 xl:h-28 bg-gradient-to-br from-blue-500/30 to-indigo-600/30 backdrop-blur-sm rounded-2xl border border-blue-300/50 relative shadow-lg">
                {/* Animated Data Points */}
                <div className="absolute inset-2 flex items-end justify-between">
                  <div className="w-1 bg-blue-300 h-4 animate-pulse"></div>
                  <div className="w-1 bg-blue-300 h-8 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 bg-blue-300 h-6 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <div className="w-1 bg-blue-300 h-10 animate-pulse" style={{animationDelay: '0.6s'}}></div>
                  <div className="w-1 bg-blue-300 h-5 animate-pulse" style={{animationDelay: '0.8s'}}></div>
                </div>
              </div>
            </div>

            {/* Floating Icons */}
            <div className="absolute top-2 left-4">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg border border-blue-300/50">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="absolute top-6 right-4">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg border border-cyan-300/50">
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="absolute bottom-2 left-6">
              <div className="w-8 h-3 lg:w-10 lg:h-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border border-indigo-300/50">
                <div className="w-5 h-1.5 lg:w-6 lg:h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Animated Connection Lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.6"/>
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.6"/>
                </linearGradient>
              </defs>
              <line x1="25%" y1="20%" x2="35%" y2="15%" stroke="url(#lineGradient)" strokeWidth="2" opacity="0.8">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="75%" y1="25%" x2="65%" y2="20%" stroke="url(#lineGradient)" strokeWidth="2" opacity="0.8">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" begin="1s"/>
              </line>
              <line x1="30%" y1="80%" x2="40%" y2="75%" stroke="url(#lineGradient)" strokeWidth="2" opacity="0.8">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" begin="2s"/>
              </line>
            </svg>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Section - Grid Layout */}
      <motion.div 
        className="lg:w-3/5 w-full bg-white p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-center overflow-y-auto min-h-[50vh] lg:min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-5xl mx-auto">
          
          {/* Navigation Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 lg:gap-4"
          >
            {navigationCards.map((card, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                onClick={() => handleCardClick(card.href)}
                className="group cursor-pointer bg-white border border-gray-200 rounded-lg p-2 sm:p-3 lg:p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-1 sm:mb-2 lg:mb-3">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ${card.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                    <card.icon className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${card.iconColor}`} />
                  </div>
                </div>
                
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                
                <p className="text-gray-600 text-xs sm:text-xs lg:text-sm mb-1 sm:mb-2 lg:mb-3 leading-relaxed">
                  {card.description}
                </p>
                
                <div className="flex items-center text-blue-600 font-medium text-xs sm:text-xs lg:text-sm group-hover:text-blue-700 transition-colors">
                  <span>Open</span>
                  <ArrowRightIcon className="w-3 h-3 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;