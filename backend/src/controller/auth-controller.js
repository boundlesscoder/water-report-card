import {
  registerWrcConsumer,
  authenticateUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  sendInvitation,
  acceptInvitation,
  verifyToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserStats,
  deleteUser,
  setUserInactive,
  setUserActive,
} from '../services/auth-service.js';
import { validateEmail, validatePassword, validateName } from '../validation/auth-validator.js';

// =========
// Registration (WRC Consumer Only)
// =========

export async function register(req, res) {
  try {
    const { email, first_name, last_name, password, phone, default_country, marketing_opt_in } = req.body;
    
    // Validation
    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, last name, and password are required'
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    if (!validateName(first_name) || !validateName(last_name)) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name must be at least 2 characters long'
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await registerWrcConsumer({
      email,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      password,
      phone: phone?.trim(),
      default_country: default_country?.trim(),
      marketing_opt_in: Boolean(marketing_opt_in),
      client_ip: clientIp,
      client_user_agent: userAgent
    });
    
    res.status(201).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
}

// =========
// Authentication
// =========

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await authenticateUser(email, password, clientIp, userAgent);
    
    if (!result.success) {
      if (result.is_locked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
        memberships: result.memberships,
        consumer: result.consumer,
        must_change_password: result.must_change_password,
        is_new_oauth_connection: result.is_new_oauth_connection
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
}

// =========
// Email Verification
// =========

export async function verifyEmailToken(req, res) {
  try {
    // Handle both GET (query param) and POST (body param) requests
    const token = req.query.token || req.body.token;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await verifyEmail(token, clientIp, userAgent);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed. Please try again.'
    });
  }
}

// =========
// Password Reset
// =========

export async function requestReset(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await requestPasswordReset(email, clientIp, userAgent);
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed. Please try again.'
    });
  }
}

export async function resetPasswordToken(req, res) {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await resetPassword(token, password, clientIp, userAgent);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.'
    });
  }
}

// =========
// Invitation System
// =========

export async function sendUserInvitation(req, res) {
  try {
    const { invitee_email, target_role_key, target_org_id, target_org_ids, property_id } = req.body;
    const inviterUserId = req.user.user_id;
    
    // Handle both single org_id and array of org_ids for backward compatibility
    let targetOrgIds;
    if (target_org_ids && Array.isArray(target_org_ids)) {
      // New format: array of org IDs
      targetOrgIds = target_org_ids.filter(id => id && id.trim() !== '');
    } else if (target_org_id && target_org_id.trim() !== '') {
      // Legacy format: single org ID
      targetOrgIds = [target_org_id];
    } else {
      // No organizations (for consumer roles)
      targetOrgIds = [];
    }
    
    const propertyId = property_id && property_id.trim() !== '' ? property_id : undefined;
    
    if (!invitee_email || !target_role_key) {
      return res.status(400).json({
        success: false,
        message: 'Invitee email and target role are required'
      });
    }
    
    if (!validateEmail(invitee_email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await sendInvitation(
      inviterUserId,
      invitee_email,
      target_role_key,
      targetOrgIds,
      propertyId,
      clientIp,
      userAgent
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Send invitation error:', error);
    
    if (error.message.includes('can only invite users with lower hierarchy levels')) {
      return res.status(403).json({
        success: false,
        message: 'You can only invite users with lower hierarchy levels'
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('duplicate key value violates unique constraint "b2b_invitations_email_org_role_unique"')) {
      return res.status(409).json({
        success: false,
        message: 'An invitation has already been sent to this email address for the selected role.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation. Please try again.',
      error: error.message
    });
  }
}

export async function acceptUserInvitation(req, res) {
  try {
    const { token, first_name, last_name, password } = req.body;
    
    if (!token || !first_name || !last_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token, first name, last name, and password are required'
      });
    }
    
    if (!validateName(first_name) || !validateName(last_name)) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name must be at least 2 characters long'
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await acceptInvitation(
      token,
      {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        password
      },
      clientIp,
      userAgent
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Accept invitation error:', error);
    
    if (error.message.includes('Invalid invitation token') || 
        error.message.includes('already been used') ||
        error.message.includes('expired') ||
        error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation. Please try again.'
    });
  }
}

// =========
// Token Verification
// =========

export async function verifyAuthToken(req, res) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    const result = await verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      data: {
        user: result.user,
        memberships: result.memberships,
        consumer: result.consumer
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed. Please try again.'
    });
  }
}

// =========
// User Profile Management
// =========

export async function getProfile(req, res) {
  try {
    const userId = req.user.user_id;
    
    const result = await getUserProfile(userId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile. Please try again.'
    });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name } = req.body;
    
    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }
    
    if (first_name && !validateName(first_name)) {
      return res.status(400).json({
        success: false,
        message: 'First name must be at least 2 characters long'
      });
    }
    
    if (last_name && !validateName(last_name)) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be at least 2 characters long'
      });
    }
    
    const updateData = {
      first_name: first_name.trim(),
      last_name: last_name.trim()
    };
    
    const result = await updateUserProfile(userId, updateData);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again.'
    });
  }
}

export async function changeUserPassword(req, res) {
  try {
    const userId = req.user.user_id;
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (!validatePassword(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await changePassword(userId, current_password, new_password, clientIp, userAgent);
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to change password. Please try again.'
    });
  }
}

// =========
// Logout (Client-side token removal)
// =========

export async function logout(req, res) {
  try {
    // Since we're using stateless JWT tokens, logout is handled client-side
    // by removing the token from storage. This endpoint is for consistency.
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.'
    });
  }
}

// =========
// User Management (Hierarchy-based)
// =========

export async function getUsers(req, res) {
  try {
    const currentUserId = req.user.user_id;
    const includeInactive = req.query.includeInactive === 'true';
    console.log('Users controller: getUsers called by user:', currentUserId, 'includeInactive:', includeInactive);
    
    const result = await getAllUsers(currentUserId, { includeInactive });
    
    res.json({
      success: true,
      users: result.users,
      total: result.total,
      statistics: result.statistics
    });

  } catch (error) {
    console.error('Error in getUsers controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
}

export async function getUserStatistics(req, res) {
  try {
    const currentUserId = req.user.user_id;
    console.log('Users controller: getUserStatistics called by user:', currentUserId);
    
    const stats = await getUserStats(currentUserId);
    
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Error in getUserStatistics controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error.message
    });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.user_id;
    console.log('Users controller: getUserById called for ID:', id, 'by user:', currentUserId);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const user = await getUserById(id, currentUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found or access denied'
      });
    }
    
    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error in getUserById controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
}

export async function setUserInactiveController(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.user_id;
    console.log('Users controller: setUserInactive called for ID:', id, 'by user:', currentUserId);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const result = await setUserInactive(id, currentUserId);
    
    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in setUserInactive controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user',
      message: error.message
    });
  }
}

export async function setUserActiveController(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.user_id;
    console.log('Users controller: setUserActive called for ID:', id, 'by user:', currentUserId);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const result = await setUserActive(id, currentUserId);
    
    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in setUserActive controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate user',
      message: error.message
    });
  }
}

export async function deleteUserController(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.user_id;
    console.log('Users controller: deleteUser called for ID:', id, 'by user:', currentUserId);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const result = await deleteUser(id, currentUserId);
    
    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message,
      details: error.stack
    });
  }
}


