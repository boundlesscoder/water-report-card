import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { verifyToken } from '../services/auth-service.js';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';

// =========
// JWT Token Verification Middleware
// =========

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token using the service
    const result = await verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }
    
    // Attach user info to request
    req.user = {
      user_id: result.user.id,
      email: result.user.email,
      first_name: result.user.first_name,
      last_name: result.user.last_name,
      full_name: result.user.full_name,
      email_verified: result.user.email_verified,
      is_active: result.user.is_active,
      memberships: result.memberships,
      consumer: result.consumer
    };
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

// =========
// Role-Based Access Control Middleware
// =========

export function requireRole(requiredRoleKey) {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has the required role
    const hasRole = req.user.memberships.some(membership => 
      membership.role_key === requiredRoleKey && membership.is_active
    );
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRoleKey}`
      });
    }
    
    next();
  };
}

export function requireAnyRole(requiredRoleKeys) {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has any of the required roles
    const hasAnyRole = req.user.memberships.some(membership => 
      requiredRoleKeys.includes(membership.role_key) && membership.is_active
    );
    
    if (!hasAnyRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required one of: ${requiredRoleKeys.join(', ')}`
      });
    }
    
    next();
  };
}

export function requireMinimumHierarchyLevel(minLevel) {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has any role with minimum hierarchy level
    const hasMinimumLevel = req.user.memberships.some(membership => 
      membership.hierarchy_lvl >= minLevel && membership.is_active
    );
    
    if (!hasMinimumLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required minimum hierarchy level: ${minLevel}`
      });
    }
    
    next();
  };
}

// =========
// New Role-Based Access Control for Updated Hierarchy
// =========

export function requireSuperAdmin() {
  return requireRole('waterreportcard_super_admin');
}

export function requireGeneralManager() {
  return requireAnyRole(['waterreportcard_super_admin', 'liquoslabs_general_manager']);
}

export function requirePlatformRole() {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has any platform role
    const hasPlatformRole = req.user.memberships.some(membership => 
      membership.role_scope === 'platform' && membership.is_active
    );
    
    if (!hasPlatformRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Platform role required'
      });
    }
    
    next();
  };
}

export function requireCustomerRole() {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has any customer role
    const hasCustomerRole = req.user.memberships.some(membership => 
      membership.role_scope === 'customer' && membership.is_active
    );
    
    if (!hasCustomerRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer role required'
      });
    }
    
    next();
  };
}

export function requireLocationRole() {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has any location role
    const hasLocationRole = req.user.memberships.some(membership => 
      membership.role_scope === 'location' && membership.is_active
    );
    
    if (!hasLocationRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Location role required'
      });
    }
    
    next();
  };
}

// =========
// Organization-Based Access Control
// =========

export function requireOrgAccess(orgIdParam = 'orgId') {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const targetOrgId = req.params[orgIdParam] || req.body.org_id;
    
    if (!targetOrgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }
    
    // Check if user has access to the target customer
    const hasOrgAccess = req.user.memberships.some(membership => 
      membership.customer_id === targetOrgId && membership.is_active
    );
    
    if (!hasOrgAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this customer'
      });
    }
    
    next();
  };
}

export function requirePropertyAccess(propertyIdParam = 'propertyId') {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const targetPropertyId = req.params[propertyIdParam] || req.body.property_id;
    
    if (!targetPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }
    
    // Check if user has access to the target property
    const hasPropertyAccess = req.user.memberships.some(membership => 
      (membership.property_id === targetPropertyId || 
       membership.role_scope === 'org' || 
       membership.role_scope === 'platform') && 
      membership.is_active
    );
    
    if (!hasPropertyAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this property'
      });
    }
    
    next();
  };
}

// =========
// Scope-Based Access Control
// =========

export function requireScope(requiredScope) {
  return (req, res, next) => {
    if (!req.user || !req.user.memberships) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has any role with the required scope
    const hasScope = req.user.memberships.some(membership => 
      membership.role_scope === requiredScope && membership.is_active
    );
    
    if (!hasScope) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required scope: ${requiredScope}`
      });
    }
    
    next();
  };
}

// =========
// Consumer Access Control
// =========

export function requireConsumerAccess() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has a consumer profile
    if (!req.user.consumer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Consumer profile required'
      });
    }
    
    next();
  };
}

// =========
// Admin Access Control (Legacy Support)
// =========

export function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.memberships) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Check if user has any admin-level role
  const adminRoles = [
    'waterreportcard_super_admin',
    'liquoslabs_general_manager',
    'customer_service_manager',
    'accounting_manager',
    'channel_sales_manager',
    'it_manager',
    'national_account_admin',
    'customer_admin'
  ];
  
  const hasAdminRole = req.user.memberships.some(membership => 
    adminRoles.includes(membership.role_key) && membership.is_active
  );
  
  if (!hasAdminRole) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required'
    });
  }
  
  next();
}

// =========
// Utility Functions
// =========

export function getUserHighestRole(user) {
  if (!user || !user.memberships) {
    return null;
  }
  
  // Sort by hierarchy level (highest first)
  const sortedMemberships = user.memberships
    .filter(m => m.is_active)
    .sort((a, b) => b.hierarchy_lvl - a.hierarchy_lvl);
  
  return sortedMemberships[0] || null;
}

export function getUserPrimaryMembership(user) {
  if (!user || !user.memberships) {
    return null;
  }
  
  return user.memberships.find(m => m.is_primary && m.is_active) || null;
}

export function hasRole(user, roleKey) {
  if (!user || !user.memberships) {
    return false;
  }
  
  return user.memberships.some(membership => 
    membership.role_key === roleKey && membership.is_active
  );
}

export function hasAnyRole(user, roleKeys) {
  if (!user || !user.memberships) {
    return false;
  }
  
  return user.memberships.some(membership => 
    roleKeys.includes(membership.role_key) && membership.is_active
  );
}

export function hasMinimumHierarchyLevel(user, minLevel) {
  if (!user || !user.memberships) {
    return false;
  }
  
  return user.memberships.some(membership => 
    membership.hierarchy_lvl >= minLevel && membership.is_active
  );
}

export function hasOrgAccess(user, orgId) {
  if (!user || !user.memberships) {
    return false;
  }
  
  return user.memberships.some(membership => 
    membership.customer_id === orgId && membership.is_active
  );
}

export function hasPropertyAccess(user, propertyId) {
  if (!user || !user.memberships) {
    return false;
  }
  
  return user.memberships.some(membership => 
    (membership.property_id === propertyId || 
     membership.role_scope === 'org' || 
     membership.role_scope === 'platform') && 
    membership.is_active
  );
}

export function isConsumer(user) {
  return user && user.consumer !== null;
}

// =========
// Request Context Helpers
// =========

export function setRequestContext(req, res, next) {
  if (req.user) {
    // Set database context for audit logging
    req.dbContext = {
      user_id: req.user.user_id,
      customer_id: getUserPrimaryMembership(req.user)?.customer_id || null,
      actor_role: getUserHighestRole(req.user)?.role_key || null,
      request_id: req.headers['x-request-id'] || crypto.randomUUID(),
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    };
  }
  
  next();
}

// Helper to set PostgreSQL session variables for audit logging
export async function setDatabaseContext(client, context) {
  if (!context) return;
  
  const queries = [];
  
  if (context.user_id) {
    queries.push(client.query(`SET LOCAL app.user_id = '${context.user_id}'`));
  }
  
  if (context.customer_id) {
    queries.push(client.query(`SET LOCAL app.customer_id = '${context.customer_id}'`));
  }
  
  if (context.actor_role) {
    queries.push(client.query(`SET LOCAL app.actor_role = '${context.actor_role}'`));
  }
  
  if (context.request_id) {
    queries.push(client.query(`SET LOCAL app.request_id = '${context.request_id}'`));
  }
  
  if (context.ip) {
    queries.push(client.query(`SET LOCAL app.ip = '${context.ip}'`));
  }
  
  if (context.user_agent) {
    // Escape single quotes in user agent
    const escapedUA = context.user_agent.replace(/'/g, "''");
    queries.push(client.query(`SET LOCAL app.ua = '${escapedUA}'`));
  }
  
  await Promise.all(queries);
}
