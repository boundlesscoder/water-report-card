// Role definitions matching database schema (005-roles-and-invitations-logic.sql)

// Role Keys
export const ROLE_KEYS = {
  // Platform Roles
  SUPER_ADMIN: 'waterreportcard_super_admin',
  GENERAL_MANAGER: 'liquoslabs_general_manager',
  CUSTOMER_SERVICE_MANAGER: 'customer_service_manager',
  ACCOUNTING_MANAGER: 'accounting_manager',
  CHANNEL_SALES_MANAGER: 'channel_sales_manager',
  IT_MANAGER: 'it_manager',
  TECH_SUPPORT: 'tech_support',
  ACCOUNTING_STAFF: 'accounting_staff',
  PLATFORM_ACCOUNT_MANAGER: 'platform_account_manager',
  PLATFORM_FIELD_SALES: 'platform_field_sales',
  PLATFORM_CONTRACTOR: 'platform_contractor',
  PLATFORM_DEVELOPER: 'platform_developer',

  // Customer Chain Roles (Regional)
  CUSTOMER_ADMIN: 'customer_admin',
  BRANCH_MANAGER: 'branch_manager',
  SALES_MANAGER: 'sales_manager',
  ACCOUNTING_DEPT_MANAGER: 'accounting_dept_manager',
  SERVICE_MANAGER: 'service_manager',
  LOCATION_ACCOUNT_MANAGER: 'location_account_manager',
  LOCATION_FIELD_SALES: 'location_field_sales',
  CUSTOMER_ACCOUNT_ADMIN: 'customer_account_admin',
  VENDOR: 'vendor',
  BRANCH_KEY_EMPLOYEE: 'branch_key_employee',
  FIELD_TECHNICIAN: 'field_technician',
  THIRD_PARTY_VENDOR: 'third_party_vendor',

  // National Account Chain Roles
  NATIONAL_ACCOUNT_ADMIN: 'national_account_admin',
  NATIONAL_BRANCH_MANAGER: 'national_branch_manager',
  NATIONAL_SALES_MANAGER: 'national_sales_manager',
  NATIONAL_ACCOUNTING_DEPT_MANAGER: 'national_accounting_dept_manager',
  NATIONAL_LOCATION_SERVICE_MANAGER: 'national_location_service_manager',
  NATIONAL_LOCATION_ACCOUNT_MANAGER: 'national_location_account_manager',
  NATIONAL_LOCATION_FIELD_SALES: 'national_location_field_sales',
  NATIONAL_ACCOUNT_CUSTOMER_ADMIN: 'national_account_customer_admin',
  NATIONAL_VENDOR: 'national_vendor',
  NATIONAL_BRANCH_KEY_EMPLOYEE: 'national_branch_key_employee',
  NATIONAL_FIELD_TECHNICIAN: 'national_field_technician',
  NATIONAL_THIRD_PARTY_VENDOR: 'national_third_party_vendor',
};

// Hierarchy Levels
export const HIERARCHY_LEVELS = {
  SUPER_ADMIN: 100,
  GENERAL_MANAGER: 90,
  DEPARTMENT_HEAD: 80, // Customer Service, Accounting, Channel/Sales, IT
  NATIONAL_ACCOUNT: 70,
  CUSTOMER_ADMIN: 50,
  CUSTOMER_ACCOUNT_ADMIN: 40,
  BRANCH_MANAGER: 35,
  DEPARTMENT_MANAGER: 30, // Sales, Accounting, Service
  ACCOUNT_MANAGER: 25,
  EMPLOYEE: 20, // Key Employee, Field Tech
  VENDOR: 10,
};

// Role Display Names
export const ROLE_DISPLAY_NAMES = {
  // Platform Roles
  [ROLE_KEYS.SUPER_ADMIN]: 'WaterReportCard Super Admin',
  [ROLE_KEYS.GENERAL_MANAGER]: 'LiquosLabs General Manager',
  [ROLE_KEYS.CUSTOMER_SERVICE_MANAGER]: 'Customer Service Manager',
  [ROLE_KEYS.ACCOUNTING_MANAGER]: 'Accounting Manager',
  [ROLE_KEYS.CHANNEL_SALES_MANAGER]: 'Channel/Sales Manager',
  [ROLE_KEYS.IT_MANAGER]: 'IT Manager',
  [ROLE_KEYS.TECH_SUPPORT]: 'Tech Support',
  [ROLE_KEYS.ACCOUNTING_STAFF]: 'Accounting Dept. Staff',
  [ROLE_KEYS.PLATFORM_ACCOUNT_MANAGER]: 'Account Manager (Platform)',
  [ROLE_KEYS.PLATFORM_FIELD_SALES]: 'Field Sales (Platform)',
  [ROLE_KEYS.PLATFORM_CONTRACTOR]: 'Contractor (Platform)',
  [ROLE_KEYS.PLATFORM_DEVELOPER]: 'Developer (Platform)',

  // Customer Chain Roles
  [ROLE_KEYS.CUSTOMER_ADMIN]: 'Customer Admin (Regional Account)',
  [ROLE_KEYS.BRANCH_MANAGER]: 'Branch Manager',
  [ROLE_KEYS.SALES_MANAGER]: 'Sales Manager',
  [ROLE_KEYS.ACCOUNTING_DEPT_MANAGER]: 'Accounting Dept. Manager',
  [ROLE_KEYS.SERVICE_MANAGER]: 'Service Manager',
  [ROLE_KEYS.LOCATION_ACCOUNT_MANAGER]: 'Account Manager (Location)',
  [ROLE_KEYS.LOCATION_FIELD_SALES]: 'Field Sales (Location)',
  [ROLE_KEYS.CUSTOMER_ACCOUNT_ADMIN]: 'Customer Account Admin',
  [ROLE_KEYS.VENDOR]: 'Vendor',
  [ROLE_KEYS.BRANCH_KEY_EMPLOYEE]: 'Branch Key Employee',
  [ROLE_KEYS.FIELD_TECHNICIAN]: 'Field Technician',
  [ROLE_KEYS.THIRD_PARTY_VENDOR]: 'Third Party Vendor',

  // National Account Chain Roles
  [ROLE_KEYS.NATIONAL_ACCOUNT_ADMIN]: 'National Account Admin',
  [ROLE_KEYS.NATIONAL_BRANCH_MANAGER]: 'Branch Manager (National Account)',
  [ROLE_KEYS.NATIONAL_SALES_MANAGER]: 'Sales Manager (National Account)',
  [ROLE_KEYS.NATIONAL_ACCOUNTING_DEPT_MANAGER]: 'Accounting Dept. Manager (National Account)',
  [ROLE_KEYS.NATIONAL_LOCATION_SERVICE_MANAGER]: 'Service Manager (National Account)',
  [ROLE_KEYS.NATIONAL_LOCATION_ACCOUNT_MANAGER]: 'Account Manager (National Location)',
  [ROLE_KEYS.NATIONAL_LOCATION_FIELD_SALES]: 'Field Sales (National Location)',
  [ROLE_KEYS.NATIONAL_ACCOUNT_CUSTOMER_ADMIN]: 'National Account: Customer Admin',
  [ROLE_KEYS.NATIONAL_VENDOR]: 'Vendor (National Account)',
  [ROLE_KEYS.NATIONAL_BRANCH_KEY_EMPLOYEE]: 'Branch Key Employee (National Account)',
  [ROLE_KEYS.NATIONAL_FIELD_TECHNICIAN]: 'Field Technician (National Account)',
  [ROLE_KEYS.NATIONAL_THIRD_PARTY_VENDOR]: 'Third Party Vendor (National Account)',
};

// Role Descriptions
export const ROLE_DESCRIPTIONS = {
  // Platform Roles
  [ROLE_KEYS.SUPER_ADMIN]: '🏢 Controls the entire system - manages LiquosLabs, content management, shopping cart',
  [ROLE_KEYS.GENERAL_MANAGER]: '👑 Manages LiquosLabs platform - can invite department heads and manage platform operations',
  [ROLE_KEYS.CUSTOMER_SERVICE_MANAGER]: '🎧 Manages customer support - can invite tech support',
  [ROLE_KEYS.ACCOUNTING_MANAGER]: '💰 Manages accounting operations - can invite accounting staff',
  [ROLE_KEYS.CHANNEL_SALES_MANAGER]: '📈 Manages sales channels - can invite field sales, account managers, national account admins',
  [ROLE_KEYS.IT_MANAGER]: '💻 Manages IT operations - can invite contractors and developers',
  [ROLE_KEYS.TECH_SUPPORT]: '🔧 Provides technical support to customers',
  [ROLE_KEYS.ACCOUNTING_STAFF]: '📊 Handles accounting tasks and financial operations',
  [ROLE_KEYS.PLATFORM_ACCOUNT_MANAGER]: '👥 Manages platform accounts - can invite customer admins',
  [ROLE_KEYS.PLATFORM_FIELD_SALES]: '🚀 Platform-level field sales representative',
  [ROLE_KEYS.PLATFORM_CONTRACTOR]: '🔨 Platform-level contractor',
  [ROLE_KEYS.PLATFORM_DEVELOPER]: '💻 Platform-level developer',

  // Customer Chain Roles
  [ROLE_KEYS.CUSTOMER_ADMIN]: '🌍 Manages regional accounts (e.g., LiquosIO) - can invite branch managers and downstream roles',
  [ROLE_KEYS.BRANCH_MANAGER]: '🏢 Manages branch operations - can invite sales, accounting, service managers',
  [ROLE_KEYS.SALES_MANAGER]: '📈 Manages sales operations - can invite account managers',
  [ROLE_KEYS.ACCOUNTING_DEPT_MANAGER]: '💰 Manages branch accounting - handles payables, receivables, payroll',
  [ROLE_KEYS.SERVICE_MANAGER]: '🔧 Manages service operations - can invite field technicians and third party vendors',
  [ROLE_KEYS.LOCATION_ACCOUNT_MANAGER]: '👥 Manages location accounts - can invite field sales and customer account admins',
  [ROLE_KEYS.LOCATION_FIELD_SALES]: '🚀 Location-level field sales representative',
  [ROLE_KEYS.CUSTOMER_ACCOUNT_ADMIN]: '👤 Manages customer accounts (e.g., Press Coffee) - can invite branch key employees and vendors',
  [ROLE_KEYS.VENDOR]: '🏪 Vendor providing services (customer-scoped)',
  [ROLE_KEYS.BRANCH_KEY_EMPLOYEE]: '⭐ Key employee at branch location',
  [ROLE_KEYS.FIELD_TECHNICIAN]: '🔧 Field service technician',
  [ROLE_KEYS.THIRD_PARTY_VENDOR]: '🏪 External vendor providing services (location-scoped)',

  // National Account Chain Roles
  [ROLE_KEYS.NATIONAL_ACCOUNT_ADMIN]: '🏢 Manages large national accounts (e.g., ARAMARK) - can invite branch managers',
  [ROLE_KEYS.NATIONAL_BRANCH_MANAGER]: '🏢 Manages national account branch operations',
  [ROLE_KEYS.NATIONAL_SALES_MANAGER]: '📈 Manages national account sales operations',
  [ROLE_KEYS.NATIONAL_ACCOUNTING_DEPT_MANAGER]: '💰 Manages national account branch accounting',
  [ROLE_KEYS.NATIONAL_LOCATION_SERVICE_MANAGER]: '🔧 Manages national account service operations',
  [ROLE_KEYS.NATIONAL_LOCATION_ACCOUNT_MANAGER]: '👥 Manages national account location accounts',
  [ROLE_KEYS.NATIONAL_LOCATION_FIELD_SALES]: '🚀 National account location-level field sales',
  [ROLE_KEYS.NATIONAL_ACCOUNT_CUSTOMER_ADMIN]: '👤 Manages national account customer (e.g., Home Depot under ARAMARK)',
  [ROLE_KEYS.NATIONAL_VENDOR]: '🏪 Vendor for national account (customer-scoped)',
  [ROLE_KEYS.NATIONAL_BRANCH_KEY_EMPLOYEE]: '⭐ Key employee at national account branch',
  [ROLE_KEYS.NATIONAL_FIELD_TECHNICIAN]: '🔧 Field technician for national account',
  [ROLE_KEYS.NATIONAL_THIRD_PARTY_VENDOR]: '🏪 External vendor for national account (location-scoped)',
};

// Role Colors (for UI)
export const ROLE_COLORS = {
  // Platform Roles
  [ROLE_KEYS.SUPER_ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ROLE_KEYS.GENERAL_MANAGER]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [ROLE_KEYS.CUSTOMER_SERVICE_MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLE_KEYS.ACCOUNTING_MANAGER]: 'bg-green-100 text-green-800 border-green-200',
  [ROLE_KEYS.CHANNEL_SALES_MANAGER]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ROLE_KEYS.IT_MANAGER]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  [ROLE_KEYS.TECH_SUPPORT]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ROLE_KEYS.ACCOUNTING_STAFF]: 'bg-green-100 text-green-800 border-green-200',
  [ROLE_KEYS.PLATFORM_ACCOUNT_MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLE_KEYS.PLATFORM_FIELD_SALES]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ROLE_KEYS.PLATFORM_CONTRACTOR]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ROLE_KEYS.PLATFORM_DEVELOPER]: 'bg-cyan-100 text-cyan-800 border-cyan-200',

  // Customer Chain Roles
  [ROLE_KEYS.CUSTOMER_ADMIN]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ROLE_KEYS.BRANCH_MANAGER]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ROLE_KEYS.SALES_MANAGER]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ROLE_KEYS.ACCOUNTING_DEPT_MANAGER]: 'bg-green-100 text-green-800 border-green-200',
  [ROLE_KEYS.SERVICE_MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLE_KEYS.LOCATION_ACCOUNT_MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLE_KEYS.LOCATION_FIELD_SALES]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ROLE_KEYS.CUSTOMER_ACCOUNT_ADMIN]: 'bg-pink-100 text-pink-800 border-pink-200',
  [ROLE_KEYS.VENDOR]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ROLE_KEYS.BRANCH_KEY_EMPLOYEE]: 'bg-teal-100 text-teal-800 border-teal-200',
  [ROLE_KEYS.FIELD_TECHNICIAN]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ROLE_KEYS.THIRD_PARTY_VENDOR]: 'bg-gray-100 text-gray-800 border-gray-200',

  // National Account Chain Roles
  [ROLE_KEYS.NATIONAL_ACCOUNT_ADMIN]: 'bg-red-100 text-red-800 border-red-200',
  [ROLE_KEYS.NATIONAL_BRANCH_MANAGER]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ROLE_KEYS.NATIONAL_SALES_MANAGER]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ROLE_KEYS.NATIONAL_ACCOUNTING_DEPT_MANAGER]: 'bg-green-100 text-green-800 border-green-200',
  [ROLE_KEYS.NATIONAL_LOCATION_SERVICE_MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLE_KEYS.NATIONAL_LOCATION_ACCOUNT_MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLE_KEYS.NATIONAL_LOCATION_FIELD_SALES]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ROLE_KEYS.NATIONAL_ACCOUNT_CUSTOMER_ADMIN]: 'bg-pink-100 text-pink-800 border-pink-200',
  [ROLE_KEYS.NATIONAL_VENDOR]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ROLE_KEYS.NATIONAL_BRANCH_KEY_EMPLOYEE]: 'bg-teal-100 text-teal-800 border-teal-200',
  [ROLE_KEYS.NATIONAL_FIELD_TECHNICIAN]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ROLE_KEYS.NATIONAL_THIRD_PARTY_VENDOR]: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Role Scopes
export const ROLE_SCOPES = {
  PLATFORM: 'platform',
  CUSTOMER: 'customer',
  LOCATION: 'location',
  CONSUMER: 'consumer',
};

// Helper Functions
export function getRoleDisplayName(roleKey) {
  return ROLE_DISPLAY_NAMES[roleKey] || roleKey;
}

export function getRoleDescription(roleKey) {
  return ROLE_DESCRIPTIONS[roleKey] || 'Custom role';
}

export function getRoleColor(roleKey) {
  return ROLE_COLORS[roleKey] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getRoleInfo(roleKey) {
  return {
    key: roleKey,
    name: getRoleDisplayName(roleKey),
    description: getRoleDescription(roleKey),
    color: getRoleColor(roleKey),
  };
}

// Check if role requires customer assignment
export function isCustomerSelectionRequired(roleKey) {
  // Only General Manager and Super Admin do NOT require customer
  return ![ROLE_KEYS.GENERAL_MANAGER, ROLE_KEYS.SUPER_ADMIN].includes(roleKey);
}

// Check if role is platform-level
export function isPlatformRole(roleKey) {
  const platformRoles = [
    ROLE_KEYS.SUPER_ADMIN,
    ROLE_KEYS.GENERAL_MANAGER,
    ROLE_KEYS.CUSTOMER_SERVICE_MANAGER,
    ROLE_KEYS.ACCOUNTING_MANAGER,
    ROLE_KEYS.CHANNEL_SALES_MANAGER,
    ROLE_KEYS.IT_MANAGER,
    ROLE_KEYS.TECH_SUPPORT,
    ROLE_KEYS.ACCOUNTING_STAFF,
    ROLE_KEYS.PLATFORM_ACCOUNT_MANAGER,
    ROLE_KEYS.PLATFORM_FIELD_SALES,
    ROLE_KEYS.PLATFORM_CONTRACTOR,
    ROLE_KEYS.PLATFORM_DEVELOPER,
  ];
  return platformRoles.includes(roleKey);
}

// Check if user can remove memberships
export function canRemoveMembership(actorRoleKey, targetRoleKey) {
  // Super admin can remove any membership
  if (actorRoleKey === ROLE_KEYS.SUPER_ADMIN) {
    return true;
  }

  // General Manager can ONLY remove platform memberships
  if (actorRoleKey === ROLE_KEYS.GENERAL_MANAGER) {
    return isPlatformRole(targetRoleKey);
  }

  // For other roles, removal is governed by the allowed_invites matrix
  // This should be checked via API
  return false;
}

export default {
  ROLE_KEYS,
  HIERARCHY_LEVELS,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  ROLE_SCOPES,
  getRoleDisplayName,
  getRoleDescription,
  getRoleColor,
  getRoleInfo,
  isCustomerSelectionRequired,
  isPlatformRole,
  canRemoveMembership,
};

