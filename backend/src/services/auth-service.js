import { db } from '../config/db.js';
import { sendEmailVerification, sendPasswordReset, sendUserInvitation, sendInviteEmail, sendWelcomeEmail } from './email-service.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// =========
// Helper Functions
// =========

function generateSecureToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// =========
// User Registration (WRC Consumer Only)
// =========

export async function registerWrcConsumer(userData) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { email, first_name, last_name, password, phone, default_country, marketing_opt_in = false } = userData;
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM core.users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Create user
    const userResult = await client.query(`
      INSERT INTO core.users (email, first_name, last_name, auth_provider)
      VALUES ($1, $2, $3, 'password')
      RETURNING id, email, first_name, last_name, full_name, created_at
    `, [email, first_name, last_name]);
    
    const user = userResult.rows[0];
    
    // Set password
    await client.query(`
      SELECT core.set_user_password($1, $2, $1, $3, $4)
    `, [user.id, password, null, null]);
    
    // Create consumer profile
    const consumerResult = await client.query(`
      INSERT INTO core.wrc_consumer_profiles (user_id, phone, default_country, marketing_opt_in)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [user.id, phone, default_country, marketing_opt_in]);
    
    const consumerId = consumerResult.rows[0].id;
    
    // Record registration
    await client.query(`
      INSERT INTO audit.consumer_registrations (user_id, consumer_id, method, utm, client_ip, client_user_agent)
      VALUES ($1, $2, 'organic', '{}', $3, $4)
    `, [user.id, consumerId, userData.client_ip, userData.client_user_agent]);
    
    // Create email verification token
    const verificationToken = await client.query(`
      SELECT core.create_email_verification_token($1, 24, $2, $3)
    `, [user.id, userData.client_ip, userData.client_user_agent]);
    
    await client.query('COMMIT');
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken.rows[0].create_email_verification_token}`;
    await sendEmailVerification(email, user.full_name, verificationUrl);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email_verified: false
      },
      consumer_id: consumerId,
      message: 'Registration successful. Please check your email to verify your account.'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// =========
// User Authentication
// =========

export async function authenticateUser(email, password, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    const result = await client.query(`
      SELECT * FROM core.authenticate_user_unified($1, $2, NULL, NULL, $3, $4)
    `, [email, password, clientIp, userAgent]);
    
    const authResult = result.rows[0];
    
    if (!authResult.is_authenticated) {
      return {
        success: false,
        message: 'Invalid credentials',
        must_change_password: authResult.must_change_password,
        is_locked: authResult.is_locked
      };
    }
    
    // Get user details
    const userResult = await client.query(`
      SELECT id, email, first_name, last_name, full_name, email_verified, auth_provider, is_active
      FROM core.users WHERE id = $1
    `, [authResult.user_id]);
    
    const user = userResult.rows[0];
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Check if email is verified
    if (!user.email_verified) {
      return {
        success: false,
        message: 'Please verify your email address before logging in. Check your email for a verification link.',
        email_verified: false
      };
    }
    
    // Get user's memberships and roles
    const membershipsResult = await client.query(`
      SELECT 
        m.id as membership_id,
        m.customer_id,
        m.role_id,
        m.property_id,
        m.is_primary,
        m.is_active,
        c.name as customer_name,
        c.status as customer_status,
        r.key as role_key,
        r.display_name as role_display,
        r.scope as role_scope,
        r.hierarchy_lvl
      FROM core.customer_memberships m
      JOIN core.customers c ON c.id = m.customer_id
      JOIN core.roles r ON r.id = m.role_id
      WHERE m.user_id = $1 AND m.is_active = true
      ORDER BY r.hierarchy_lvl DESC, m.is_primary DESC
    `, [user.id]);
    
    // Get consumer profile if exists
    const consumerResult = await client.query(`
      SELECT id, phone, default_country, marketing_opt_in
      FROM core.wrc_consumer_profiles
      WHERE user_id = $1
    `, [user.id]);
    
    const memberships = membershipsResult.rows;
    const consumer = consumerResult.rows[0] || null;
    
    // Generate JWT token
    const tokenPayload = {
      user_id: user.id,
      email: user.email,
      auth_method: authResult.auth_method,
      memberships: memberships.map(m => ({
        membership_id: m.membership_id,
        org_id: m.customer_id,
        customer_name: m.customer_name,
        customer_status: m.customer_status,
        role_key: m.role_key,
        role_display: m.role_display,
        role_scope: m.role_scope,
        hierarchy_lvl: m.hierarchy_lvl,
        property_id: m.property_id,
        is_primary: m.is_primary
      })),
      consumer_id: consumer?.id || null
    };
    
    const token = generateJWT(tokenPayload);
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email_verified: user.email_verified,
        auth_provider: user.auth_provider,
        is_active: user.is_active
      },
      memberships,
      consumer,
      must_change_password: authResult.must_change_password,
      is_new_oauth_connection: authResult.is_new_oauth_connection
    };
    
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// =========
// Email Verification
// =========

export async function verifyEmail(token, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    const result = await client.query(`
      SELECT core.consume_email_verification_token($1, $2, $3)
    `, [token, clientIp, userAgent]);
    
    const userId = result.rows[0].consume_email_verification_token;
    
    if (!userId) {
      return {
        success: false,
        message: 'Invalid or expired verification token'
      };
    }
    
    // Get updated user info
    const userResult = await client.query(`
      SELECT id, email, first_name, last_name, full_name, email_verified
      FROM core.users WHERE id = $1
    `, [userId]);
    
    return {
      success: true,
      message: 'Email verified successfully',
      user: userResult.rows[0]
    };
    
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// =========
// Password Reset
// =========

export async function requestPasswordReset(email, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    // Check if user exists
    const userResult = await client.query(`
      SELECT id, email, first_name, last_name, full_name, auth_provider
      FROM core.users WHERE email = $1 AND is_active = true
    `, [email]);
    
    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }
    
    const user = userResult.rows[0];
    
    // Check if user has password authentication
    if (user.auth_provider === 'oauth') {
      return {
        success: false,
        message: 'This account uses social login. Please use the social login option.'
      };
    }
    
    // Create password reset token
    const resetTokenResult = await client.query(`
      SELECT core.create_password_reset_token($1, 1, $2, $3)
    `, [user.id, clientIp, userAgent]);
    
    const resetToken = resetTokenResult.rows[0].create_password_reset_token;
    
    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordReset(email, user.full_name, resetUrl);
    
    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };
    
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

export async function resetPassword(token, newPassword, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    // Consume the reset token
    const tokenResult = await client.query(`
      SELECT core.consume_password_reset_token($1, $2, $3)
    `, [token, clientIp, userAgent]);
    
    const userId = tokenResult.rows[0].consume_password_reset_token;
    
    if (!userId) {
      return {
        success: false,
        message: 'Invalid or expired reset token'
      };
    }
    
    // Set new password
    await client.query(`
      SELECT core.set_user_password($1, $2, $1, $3, $4)
    `, [userId, newPassword, clientIp, userAgent]);
    
    return {
      success: true,
      message: 'Password reset successfully'
    };
    
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// =========
// Invitation System
// =========

export async function sendInvitation(inviterUserId, inviteeEmail, targetRoleKey, targetOrgIds, propertyId, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Normalize targetOrgIds to array (support both single ID and array)
    const orgIdsArray = Array.isArray(targetOrgIds) ? targetOrgIds : (targetOrgIds ? [targetOrgIds] : []);
    
    // Get inviter's highest membership AND collect all active customer_ids
    const inviterResult = await client.query(`
      WITH highest AS (
        SELECT m.id as membership_id, m.customer_id, r.key as role_key, r.hierarchy_lvl, r.scope
        FROM core.customer_memberships m
        JOIN core.roles r ON r.id = m.role_id
        WHERE m.user_id = $1 AND m.is_active = true
        ORDER BY r.hierarchy_lvl DESC
        LIMIT 1
      )
      SELECT h.membership_id, h.customer_id, h.role_key, h.hierarchy_lvl, h.scope,
             ARRAY(SELECT m2.customer_id FROM core.customer_memberships m2 WHERE m2.user_id = $1 AND m2.is_active = true) as all_customer_ids
      FROM highest h
    `, [inviterUserId]);
    
    if (inviterResult.rows.length === 0) {
      throw new Error('Inviter not found or has no active memberships');
    }
    
    const inviterMembership = inviterResult.rows[0];
    
    // Get target role
    const roleResult = await client.query(`
      SELECT id, key, display_name, scope, hierarchy_lvl
      FROM core.roles WHERE key = $1
    `, [targetRoleKey]);
    
    if (roleResult.rows.length === 0) {
      throw new Error('Target role not found');
    }
    
    const targetRole = roleResult.rows[0];
    
    // Check if inviter can invite this role using allowed_invites matrix (transitive)
    const allowedInviteResult = await client.query(`
      WITH RECURSIVE reachable AS (
        SELECT ai.invitee_role_id
        FROM core.allowed_invites ai
        JOIN core.roles inviter_role ON inviter_role.id = ai.inviter_role_id
        WHERE inviter_role.key = $1
        UNION
        SELECT ai2.invitee_role_id
        FROM core.allowed_invites ai2
        JOIN reachable r ON ai2.inviter_role_id = r.invitee_role_id
      )
      SELECT 1
      FROM reachable r
      JOIN core.roles target_role ON target_role.id = r.invitee_role_id
      WHERE target_role.key = $2
      LIMIT 1
    `, [inviterMembership.role_key, targetRoleKey]);
    
    if (allowedInviteResult.rows.length === 0) {
      throw new Error(`You are not permitted to invite users with role: ${targetRoleKey}`);
    }
    
    // Check if user already exists
    const existingUserResult = await client.query(`
      SELECT id FROM core.users WHERE email = $1
    `, [inviteeEmail]);
    
    if (existingUserResult.rows.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Check for existing pending invitation
    const existingInviteResult = await client.query(`
      SELECT id FROM core.customer_invitations 
      WHERE invitee_email = $1 AND target_role_id = $2 AND status = 'pending'
    `, [inviteeEmail, targetRole.id]);
    
    if (existingInviteResult.rows.length > 0) {
      throw new Error('A pending invitation already exists for this email and role');
    }
    
    // Generate invitation token
    const invitationToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create invitation WITHOUT customer assignment (per new business rules)
    // Customer assignment happens post-invite via assign_customer_to_invitation
    const invitationIdResult = await client.query(`
      SELECT core.create_role_invitation($1, $2, $3, $4, $5)
    `, [
      inviterMembership.membership_id,
      inviteeEmail,
      targetRole.id,
      invitationToken,
      expiresAt
    ]);
    
    const invitationId = invitationIdResult.rows[0].create_role_invitation;
    
    // If customer IDs were provided, create invitation targets for reference
    // (but invitation itself has no assigned customer yet)
    if (orgIdsArray && orgIdsArray.length > 0) {
      // If inviter is customer-scoped, enforce target customers within their access
      if (inviterMembership.scope === 'customer' || inviterMembership.scope === 'location') {
        const allowedIds = new Set((inviterMembership.all_customer_ids || []).map(id => String(id)));
        const filtered = orgIdsArray.filter(id => allowedIds.has(String(id)));
        if (orgIdsArray.length > 0 && filtered.length === 0) {
          throw new Error('You may only invite within your customer access');
        }
        orgIdsArray = filtered;
      }
      
      // Create invitation targets for each customer (for reference/tracking)
      for (const customerId of orgIdsArray) {
        await client.query(`
          INSERT INTO core.invitation_targets (invitation_id, target_customer_id, target_role_id)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [invitationId, customerId, targetRole.id]);
      }
    }
    
    await client.query('COMMIT');
    
    // Send invitation email
    const invitationUrl = `${process.env.ADMIN_PANEL_URL}/accept-invite?token=${invitationToken}`;
    
    // Get organization names for email
    let orgName = 'LiquosLabs Platform';
    if (orgIdsArray && orgIdsArray.length > 0) {
      const orgNamesResult = await client.query(`
        SELECT name FROM core.customers WHERE id = ANY($1)
      `, [orgIdsArray]);
      
      if (orgNamesResult.rows.length > 0) {
        if (orgNamesResult.rows.length === 1) {
          orgName = orgNamesResult.rows[0].name;
        } else {
          orgName = `${orgNamesResult.rows.length} organizations`;
        }
      }
    }
    
    await sendUserInvitation(inviteeEmail, targetRole.display_name, orgName, invitationUrl, expiresAt.toLocaleDateString());
    
    return {
      success: true,
      invitation_id: invitationId,
      token: invitationToken,
      expires_at: expiresAt,
      message: `Invitation sent successfully to ${inviteeEmail} for role ${targetRole.display_name}`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function acceptInvitation(token, userData, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get invitation details
    const invitationResult = await client.query(`
      SELECT 
        i.id, i.invitee_email, i.target_role_id, i.target_customer_id, i.assigned_customer_id, i.status, i.expires_at,
        r.key as role_key, r.display_name as role_display, r.scope as role_scope
      FROM core.customer_invitations i
      JOIN core.roles r ON r.id = i.target_role_id
      WHERE i.token = $1
    `, [token]);
    
    if (invitationResult.rows.length === 0) {
      throw new Error('Invalid invitation token');
    }
    
    const invitation = invitationResult.rows[0];
    
    // Get all target customers for this invitation
    const targetsResult = await client.query(`
      SELECT 
        target_customer_id,
        target_customer_name,
        target_customer_type,
        target_role_id,
        target_role_key,
        target_role_display,
        target_role_scope
      FROM core.get_invitation_targets($1)
    `, [invitation.id]);
    
    // Check invitation status
    if (invitation.status !== 'pending') {
      throw new Error('Invitation has already been used or expired');
    }
    
    if (new Date() > invitation.expires_at) {
      throw new Error('Invitation has expired');
    }
    
    // Check if user already exists
    const existingUserResult = await client.query(`
      SELECT id, first_name, last_name FROM core.users WHERE email = $1
    `, [invitation.invitee_email]);
    
    let user;
    
    if (existingUserResult.rows.length > 0) {
      // User already exists, use existing user
      user = existingUserResult.rows[0];
      console.log('User already exists, using existing user:', user.email);
    } else {
      // Create new user
      const { first_name, last_name, password } = userData;
      
      const userResult = await client.query(`
        INSERT INTO core.users (email, first_name, last_name, auth_provider, email_verified)
        VALUES ($1, $2, $3, 'password', true)
        RETURNING id, email, first_name, last_name, full_name
      `, [invitation.invitee_email, first_name, last_name]);
      
      user = userResult.rows[0];
      
      // Set password for new user
      await client.query(`
        SELECT core.set_user_password($1, $2, $1, $3, $4)
      `, [user.id, password, clientIp, userAgent]);
    }
    
    let memberships = [];
    let consumerId = null;
    
    // Handle different role scopes
    if (invitation.role_scope === 'consumer') {
      // For consumer roles, create a consumer profile instead of membership
      const consumerResult = await client.query(`
        INSERT INTO core.wrc_consumer_profiles (user_id, phone, default_country, marketing_opt_in)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [user.id, userData.phone || null, userData.default_country || null, userData.marketing_opt_in || false]);
      
      consumerId = consumerResult.rows[0].id;
      
      // Record consumer registration
      await client.query(`
        INSERT INTO audit.consumer_registrations (user_id, consumer_id, method, invitation_id, client_ip, client_user_agent)
        VALUES ($1, $2, 'invite', $3, $4, $5)
      `, [user.id, consumerId, invitation.id, clientIp, userAgent]);
      
    } else {
      // For non-consumer roles, create memberships for all target organizations
      if (invitation.role_scope === 'platform') {
        // For platform roles, assign to LiquosLabs Platform customer
        const platformCustomerResult = await client.query(`
          SELECT id FROM core.customers WHERE name = 'LiquosLabs Platform' AND is_active = true LIMIT 1
        `);
        
        if (platformCustomerResult.rows.length === 0) {
          throw new Error('LiquosLabs Platform customer not found');
        }
        
        const platformCustomerId = platformCustomerResult.rows[0].id;
        
        // Create membership for platform role
        const membershipResult = await client.query(`
          INSERT INTO core.customer_memberships (user_id, customer_id, role_id, is_active, is_primary)
          VALUES ($1, $2, $3, true, true)
          RETURNING id
        `, [user.id, platformCustomerId, invitation.target_role_id]);
        
        const membershipId = membershipResult.rows[0].id;
        
        // Record membership provenance
        await client.query(`
          SELECT core.record_membership_from_invite($1, $2, $3)
        `, [membershipId, invitation.id, user.id]);
        
        memberships = [{
          membership_id: membershipId,
          customer_id: platformCustomerId,
          customer_name: 'LiquosLabs Platform',
          role_key: invitation.role_key
        }];
      } else {
        // For customer/location roles, use the multi-customer invitation function
        const membershipsResult = await client.query(`
          SELECT * FROM core.accept_multi_customer_invitation($1, $2)
        `, [invitation.id, user.id]);
        
        memberships = membershipsResult.rows;
      }
    }
    
    // Update invitation status
    await client.query(`
      UPDATE core.customer_invitations 
      SET status = 'accepted', accepted_user_id = $1, accepted_at = NOW()
      WHERE id = $2
    `, [user.id, invitation.id]);
    
    await client.query('COMMIT');
    
    // Generate JWT token for the user (match login token shape)
    const tokenPayload = {
      user_id: user.id,
      email: user.email
    };
    const accessToken = generateJWT(tokenPayload);
    
    const result = {
      success: true,
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email_verified: true
      },
      message: 'Invitation accepted successfully'
    };
    
    if (invitation.role_scope === 'consumer') {
      result.consumer = {
        role_key: invitation.role_key,
        role_display: invitation.role_display,
        role_scope: invitation.role_scope
      };
    } else {
      result.memberships = memberships.map(m => ({
        membership_id: m.membership_id,
        org_id: m.customer_id,
        customer_name: m.customer_name,
        role_key: m.role_key
      }));
      result.target_customers = targetsResult.rows;
    }
    
    return result;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// =========
// Token Verification
// =========

export async function verifyToken(token) {
  try {
    const decoded = verifyJWT(token);
    if (!decoded) {
      return { valid: false, message: 'Invalid token' };
    }
    
    // Check if user still exists and is active
    const client = await db.connect();
    
    try {
      const userResult = await client.query(`
        SELECT id, email, first_name, last_name, full_name, email_verified, is_active
        FROM core.users WHERE id = $1
      `, [decoded.user_id]);
      
      if (userResult.rows.length === 0) {
        return { valid: false, message: 'User not found' };
      }
      
      const user = userResult.rows[0];
      
      if (!user.is_active) {
        return { valid: false, message: 'User account is inactive' };
      }
      
      // Get updated memberships
      const membershipsResult = await client.query(`
        SELECT 
          m.id as membership_id,
          m.customer_id,
          m.role_id,
          m.property_id,
          m.is_primary,
          m.is_active,
          c.name as customer_name,
          c.status as customer_status,
          r.key as role_key,
          r.display_name as role_display,
          r.scope as role_scope,
          r.hierarchy_lvl
        FROM core.customer_memberships m
        JOIN core.customers c ON c.id = m.customer_id
        JOIN core.roles r ON r.id = m.role_id
        WHERE m.user_id = $1 AND m.is_active = true
        ORDER BY r.hierarchy_lvl DESC, m.is_primary DESC
      `, [user.id]);
      
      // Get consumer profile if exists
      const consumerResult = await client.query(`
        SELECT id, phone, default_country, marketing_opt_in
        FROM core.wrc_consumer_profiles
        WHERE user_id = $1
      `, [user.id]);
      
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.full_name,
          email_verified: user.email_verified,
          is_active: user.is_active
        },
        memberships: membershipsResult.rows,
        consumer: consumerResult.rows[0] || null
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    return { valid: false, message: 'Token verification failed' };
  }
}

// =========
// User Management
// =========

export async function getUserProfile(userId) {
  const client = await db.connect();
  
  try {
    // Get user details
    const userResult = await client.query(`
      SELECT id, email, first_name, last_name, full_name, email_verified, auth_provider, is_active, created_at, updated_at
      FROM core.users WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // Get memberships
    const membershipsResult = await client.query(`
      SELECT 
        m.id as membership_id,
        m.customer_id,
        m.role_id,
        m.property_id,
        m.is_primary,
        m.is_active,
        m.created_at,
        c.name as customer_name,
        c.status as customer_status,
        r.key as role_key,
        r.display_name as role_display,
        r.scope as role_scope,
        r.hierarchy_lvl
      FROM core.customer_memberships m
      JOIN core.customers c ON c.id = m.customer_id
      JOIN core.roles r ON r.id = m.role_id
      WHERE m.user_id = $1
      ORDER BY r.hierarchy_lvl DESC, m.is_primary DESC
    `, [userId]);
    
    // Get consumer profile if exists
    const consumerResult = await client.query(`
      SELECT id, phone, default_country, marketing_opt_in, created_at
      FROM core.wrc_consumer_profiles
      WHERE user_id = $1
    `, [userId]);
    
    return {
      user,
      memberships: membershipsResult.rows,
      consumer: consumerResult.rows[0] || null
    };
    
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserProfile(userId, updateData) {
  const client = await db.connect();
  
  try {
    const { first_name, last_name } = updateData;
    
    await client.query('BEGIN');
    
    // Update user basic info
    await client.query(`
      UPDATE core.users 
      SET first_name = $1, 
          last_name = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [first_name, last_name, userId]);
    
    await client.query('COMMIT');
    
    return await getUserProfile(userId);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function changePassword(userId, currentPassword, newPassword, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    // Verify current password
    const authResult = await client.query(`
      SELECT * FROM core.authenticate_user_password(
        (SELECT email FROM core.users WHERE id = $1), 
        $2, $3, $4
      )
    `, [userId, currentPassword, clientIp, userAgent]);
    
    const auth = authResult.rows[0];
    
    if (!auth.is_authenticated) {
      throw new Error('Current password is incorrect');
    }
    
    // Set new password
    await client.query(`
      SELECT core.set_user_password($1, $2, $1, $3, $4)
    `, [userId, newPassword, clientIp, userAgent]);
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
    
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// =========
// User Management Services (Hierarchy-based)
// =========

export async function getAllUsers(currentUserId, options = {}) {
  const client = await db.connect();
  const includeInactive = options.includeInactive || false;
  
  try {
    // Get current user's role information to determine hierarchy level
    const currentUserQuery = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.email_verified,
        u.created_at,
        r.key as role_key,
        r.display_name as role_display_name,
        r.hierarchy_lvl,
        r.scope,
        c.id as org_id,
        c.name as customer_name,
        c.status as customer_status
      FROM core.users u
      JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
      JOIN core.roles r ON r.id = m.role_id
      JOIN core.customers c ON c.id = m.customer_id
      WHERE u.id = $1
      ORDER BY r.hierarchy_lvl DESC
      LIMIT 1
    `;
    
    const currentUserResult = await client.query(currentUserQuery, [currentUserId]);
    
    if (currentUserResult.rows.length === 0) {
      // No active memberships: return empty dataset rather than error
      return {
        users: [],
        total: 0,
        statistics: {
          totalUsers: 0,
          verifiedUsers: 0,
          platformAdmins: 0,
          wrcUsers: 0,
          unverifiedUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0
        }
      };
    }
    
    const currentUser = currentUserResult.rows[0];
    console.log('Current user role:', currentUser.role_key, 'hierarchy level:', currentUser.hierarchy_lvl);
    console.log('Include inactive users:', includeInactive);
    
    // Build query based on role hierarchy
    let usersQuery;
    let queryParams = [];
    
    if (currentUser.role_key === 'waterreportcard_super_admin') {
      // Platform admin can see ALL users including those without memberships
      const whereClause = includeInactive 
        ? `WHERE 1=1` // Show all users
        : `WHERE u.is_active = true`; // Show only active users
      
      usersQuery = `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.email_verified,
          u.created_at,
          u.is_active,
          COALESCE(
            json_agg(
              json_build_object(
                'id', m.id,
                'role_key', r.key,
                'role_display_name', r.display_name,
                'hierarchy_lvl', r.hierarchy_lvl,
                'scope', r.scope,
                'org_id', c.id,
                'customer_name', c.name,
                'customer_status', c.status,
                'is_primary', m.is_primary,
                'is_active', m.is_active
              ) ORDER BY r.hierarchy_lvl DESC
            ) FILTER (WHERE m.id IS NOT NULL),
            CASE 
              WHEN cp.id IS NOT NULL THEN 
                json_build_array(
                  json_build_object(
                    'id', 'wrc-user-' || cp.id,
                    'role_key', 'wrc_user',
                    'role_display_name', 'Water Report Card (B2C) User',
                    'hierarchy_lvl', 5,
                    'scope', 'consumer',
                    'org_id', NULL,
                    'customer_name', NULL,
                    'customer_status', NULL,
                    'is_primary', true,
                    'is_active', true
                  )
                )
              ELSE '[]'::json
            END
          ) as memberships,
          CASE 
            WHEN cp.id IS NOT NULL THEN 
              json_build_object(
                'id', cp.id,
                'phone', cp.phone,
                'default_country', cp.default_country,
                'marketing_opt_in', cp.marketing_opt_in
              )
            ELSE NULL 
          END as consumer
        FROM core.users u
        LEFT JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
        LEFT JOIN core.roles r ON r.id = m.role_id
        LEFT JOIN core.customers c ON c.id = m.customer_id
        LEFT JOIN core.wrc_consumer_profiles cp ON cp.user_id = u.id
        ${whereClause}
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.email_verified, u.created_at, u.is_active, cp.id, cp.phone, cp.default_country, cp.marketing_opt_in
        ORDER BY u.is_active DESC, u.created_at DESC
      `;
      queryParams = []; // Super admin sees all users, no filtering needed
    } else {
      // Other roles can only see users with lower hierarchy levels
      // and within their organization scope (including WRC users if platform scope)
      const whereClause = includeInactive 
        ? `WHERE (
            EXISTS (
              SELECT 1 FROM core.customer_memberships m2
              JOIN core.roles r2 ON r2.id = m2.role_id
              WHERE m2.user_id = u.id 
                AND m2.is_active = true
                AND r2.hierarchy_lvl < $1
                AND (
                  $2 = 'platform' OR 
                  (m2.customer_id = $3) OR
                  (r2.scope = 'consumer')
                )
            )
          )`
        : `WHERE u.is_active = true
          AND (
            EXISTS (
              SELECT 1 FROM core.customer_memberships m2
              JOIN core.roles r2 ON r2.id = m2.role_id
              WHERE m2.user_id = u.id 
                AND m2.is_active = true
                AND r2.hierarchy_lvl < $1
                AND (
                  $2 = 'platform' OR 
                  (m2.customer_id = $3) OR
                  (r2.scope = 'consumer')
                )
            )
          )`;
      
      usersQuery = `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.email_verified,
          u.created_at,
          u.is_active,
          COALESCE(
            json_agg(
              json_build_object(
                'id', m.id,
                'role_key', r.key,
                'role_display_name', r.display_name,
                'hierarchy_lvl', r.hierarchy_lvl,
                'scope', r.scope,
                'org_id', c.id,
                'customer_name', c.name,
                'customer_status', c.status,
                'is_primary', m.is_primary,
                'is_active', m.is_active
              ) ORDER BY r.hierarchy_lvl DESC
            ) FILTER (WHERE m.id IS NOT NULL),
            CASE 
              WHEN cp.id IS NOT NULL AND $2 = 'platform' THEN 
                json_build_array(
                  json_build_object(
                    'id', 'wrc-user-' || cp.id,
                    'role_key', 'wrc_user',
                    'role_display_name', 'Water Report Card (B2C) User',
                    'hierarchy_lvl', 5,
                    'scope', 'consumer',
                    'org_id', NULL,
                    'customer_name', NULL,
                    'customer_status', NULL,
                    'is_primary', true,
                    'is_active', true
                  )
                )
              ELSE '[]'::json
            END
          ) as memberships,
          CASE 
            WHEN cp.id IS NOT NULL THEN 
              json_build_object(
                'id', cp.id,
                'phone', cp.phone,
                'default_country', cp.default_country,
                'marketing_opt_in', cp.marketing_opt_in
              )
            ELSE NULL 
          END as consumer
        FROM core.users u
        LEFT JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
        LEFT JOIN core.roles r ON r.id = m.role_id
        LEFT JOIN core.customers c ON c.id = m.customer_id
        LEFT JOIN core.wrc_consumer_profiles cp ON cp.user_id = u.id
        ${whereClause}
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.email_verified, u.created_at, u.is_active, cp.id, cp.phone, cp.default_country, cp.marketing_opt_in
        ORDER BY u.is_active DESC, u.created_at DESC
      `;
      queryParams = [currentUser.hierarchy_lvl, currentUser.scope, currentUser.org_id];
    }
    
    console.log('Executing query with params:', queryParams);
    const usersResult = await client.query(usersQuery, queryParams);
    const users = usersResult.rows;
    
    // Calculate statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = users.filter(u => !u.is_active).length;
    
    console.log('getAllUsers: Found', totalUsers, 'total users -', activeUsers, 'active,', inactiveUsers, 'inactive');
    const verifiedUsers = users.filter(u => u.email_verified).length;
    const platformAdmins = users.filter(u => 
      u.memberships && u.memberships.some(m => m.role_key === 'waterreportcard_super_admin')
    ).length;
    const wrcUsers = users.filter(u => 
      u.memberships && u.memberships.some(m => m.role_key === 'wrc_user')
    ).length;
    const unverifiedUsers = totalUsers - verifiedUsers;
    
    return {
      users: users,
      total: totalUsers,
      statistics: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        verifiedUsers,
        platformAdmins,
        wrcUsers,
        unverifiedUsers
      }
    };

  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserStats(currentUserId) {
  const client = await db.connect();
  
  try {
    // Get current user's role to determine what stats they can see
    const currentUserQuery = `
      SELECT r.hierarchy_lvl, r.scope, m.customer_id
      FROM core.users u
      JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
      JOIN core.roles r ON r.id = m.role_id
      WHERE u.id = $1
      ORDER BY r.hierarchy_lvl DESC
      LIMIT 1
    `;
    
    const currentUserResult = await client.query(currentUserQuery, [currentUserId]);
    
    if (currentUserResult.rows.length === 0) {
      throw new Error('User not found or no active memberships');
    }
    
    const currentUser = currentUserResult.rows[0];
    
    // Build stats query based on hierarchy
    let statsQuery;
    let queryParams = [];
    
    if (currentUser.hierarchy_lvl === 100) { // waterreportcard_super_admin
      statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM core.customer_memberships m
            JOIN core.roles r ON r.id = m.role_id
            WHERE m.user_id = core.users.id AND m.is_active = true AND r.key = 'waterreportcard_super_admin'
          )) as platform_admins,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM core.wrc_consumer_profiles c
            WHERE c.user_id = core.users.id
          )) as wrc_users,
          COUNT(*) FILTER (WHERE email_verified = false) as unverified_users
        FROM core.users
        WHERE is_active = true
      `;
    } else {
      statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM core.customer_memberships m
            JOIN core.roles r ON r.id = m.role_id
            WHERE m.user_id = core.users.id AND m.is_active = true AND r.key = 'waterreportcard_super_admin'
          )) as platform_admins,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM core.wrc_consumer_profiles c
            WHERE c.user_id = core.users.id
          ) AND $2 = 'platform') as wrc_users,
          COUNT(*) FILTER (WHERE email_verified = false) as unverified_users
        FROM core.users
        WHERE is_active = true
          AND (
            EXISTS (
              SELECT 1 FROM core.customer_memberships m2
              JOIN core.roles r2 ON r2.id = m2.role_id
              WHERE m2.user_id = core.users.id 
                AND m2.is_active = true
                AND r2.hierarchy_lvl < $1
                AND (
                  $2 = 'platform' OR 
                  (m2.customer_id = $3) OR
                  (r2.scope = 'consumer')
                )
            ) OR 
            (EXISTS (SELECT 1 FROM core.wrc_consumer_profiles c WHERE c.user_id = core.users.id) AND $2 = 'platform')
          )
      `;
      queryParams = [currentUser.hierarchy_lvl, currentUser.scope, currentUser.org_id];
    }
    
    const statsResult = await client.query(statsQuery, queryParams);
    const stats = statsResult.rows[0];
    
    return {
      totalUsers: parseInt(stats.total_users),
      verifiedUsers: parseInt(stats.verified_users),
      platformAdmins: parseInt(stats.platform_admins),
      unverifiedUsers: parseInt(stats.unverified_users)
    };

  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserById(userId, currentUserId) {
  const client = await db.connect();
  
  try {
    // Check if current user can view this user (same hierarchy logic)
    const currentUserQuery = `
      SELECT r.hierarchy_lvl, r.scope, m.customer_id
      FROM core.users u
      JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
      JOIN core.roles r ON r.id = m.role_id
      WHERE u.id = $1
      ORDER BY r.hierarchy_lvl DESC
      LIMIT 1
    `;
    
    const currentUserResult = await client.query(currentUserQuery, [currentUserId]);
    
    if (currentUserResult.rows.length === 0) {
      throw new Error('User not found or no active memberships');
    }
    
    const currentUser = currentUserResult.rows[0];
    
    // Get target user with hierarchy check
    let userQuery;
    let queryParams;
    
    if (currentUser.hierarchy_lvl === 100) { // waterreportcard_super_admin
      userQuery = `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.email_verified,
          u.created_at,
          u.is_active,
          COALESCE(
            json_agg(
              json_build_object(
                'id', m.id,
                'role_key', r.key,
                'role_display_name', r.display_name,
                'hierarchy_lvl', r.hierarchy_lvl,
                'scope', r.scope,
                'org_id', c.id,
                'customer_name', c.name,
                'customer_status', c.status,
                'is_primary', m.is_primary,
                'is_active', m.is_active
              ) ORDER BY r.hierarchy_lvl DESC
            ) FILTER (WHERE m.id IS NOT NULL),
            CASE 
              WHEN cp.id IS NOT NULL THEN 
                json_build_array(
                  json_build_object(
                    'id', 'wrc-user-' || cp.id,
                    'role_key', 'wrc_user',
                    'role_display_name', 'Water Report Card (B2C) User',
                    'hierarchy_lvl', 5,
                    'scope', 'consumer',
                    'org_id', NULL,
                    'customer_name', NULL,
                    'customer_status', NULL,
                    'is_primary', true,
                    'is_active', true
                  )
                )
              ELSE '[]'::json
            END
          ) as memberships,
          CASE 
            WHEN cp.id IS NOT NULL THEN 
              json_build_object(
                'id', cp.id,
                'phone', cp.phone,
                'default_country', cp.default_country,
                'marketing_opt_in', cp.marketing_opt_in
              )
            ELSE NULL 
          END as consumer
        FROM core.users u
        LEFT JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
        LEFT JOIN core.roles r ON r.id = m.role_id
        LEFT JOIN core.customers c ON c.id = m.customer_id
        LEFT JOIN core.wrc_consumer_profiles cp ON cp.user_id = u.id
        WHERE u.id = $1 AND u.is_active = true
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.email_verified, u.created_at, cp.id, cp.phone, cp.default_country, cp.marketing_opt_in
      `;
      queryParams = [userId];
    } else {
      userQuery = `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.email_verified,
          u.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', m.id,
                'role_key', r.key,
                'role_display_name', r.display_name,
                'hierarchy_lvl', r.hierarchy_lvl,
                'scope', r.scope,
                'org_id', c.id,
                'customer_name', c.name,
                'customer_status', c.status,
                'is_primary', m.is_primary,
                'is_active', m.is_active
              ) ORDER BY r.hierarchy_lvl DESC
            ) FILTER (WHERE m.id IS NOT NULL),
            CASE 
              WHEN c.id IS NOT NULL AND $3 = 'platform' THEN 
                json_build_array(
                  json_build_object(
                    'id', 'wrc-user-' || cp.id,
                    'role_key', 'wrc_user',
                    'role_display_name', 'Water Report Card (B2C) User',
                    'hierarchy_lvl', 5,
                    'scope', 'consumer',
                    'org_id', NULL,
                    'customer_name', NULL,
                    'customer_status', NULL,
                    'is_primary', true,
                    'is_active', true
                  )
                )
              ELSE '[]'::json
            END
          ) as memberships,
          CASE 
            WHEN cp.id IS NOT NULL THEN 
              json_build_object(
                'id', cp.id,
                'phone', cp.phone,
                'default_country', cp.default_country,
                'marketing_opt_in', cp.marketing_opt_in
              )
            ELSE NULL 
          END as consumer
        FROM core.users u
        LEFT JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
        LEFT JOIN core.roles r ON r.id = m.role_id
        LEFT JOIN core.customers c ON c.id = m.customer_id
        LEFT JOIN core.wrc_consumer_profiles cp ON cp.user_id = u.id
        WHERE u.id = $1 AND u.is_active = true
          AND (
            EXISTS (
              SELECT 1 FROM core.customer_memberships m2
              JOIN core.roles r2 ON r2.id = m2.role_id
              WHERE m2.user_id = u.id 
                AND m2.is_active = true
                AND r2.hierarchy_lvl < $2
                AND (
                  $3 = 'platform' OR 
                  (m2.customer_id = $4) OR
                  (r2.scope = 'consumer')
                )
            ) OR 
            (c.id IS NOT NULL AND $3 = 'platform')
          )
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.email_verified, u.created_at, cp.id, cp.phone, cp.default_country, cp.marketing_opt_in
      `;
      queryParams = [userId, currentUser.hierarchy_lvl, currentUser.scope, currentUser.org_id];
    }
    
    const userResult = await client.query(userQuery, queryParams);
    
    if (userResult.rows.length === 0) {
      return null; // User not found or access denied
    }
    
    return userResult.rows[0];

  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// =========
// Membership Assignment Service
// =========

export async function assignMembershipToUser(userId, customerId, roleKey, propertyId = null, assignedByUserId, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get role information
    const roleResult = await client.query(`
      SELECT id, key, display_name, scope, hierarchy_lvl
      FROM core.roles WHERE key = $1
    `, [roleKey]);
    
    if (roleResult.rows.length === 0) {
      throw new Error('Target role not found');
    }
    
    const role = roleResult.rows[0];
    
    // Check if user exists
    const userResult = await client.query(`
      SELECT id, email, first_name, last_name FROM core.users WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Check if customer exists
    const customerResult = await client.query(`
      SELECT id, name FROM core.customers WHERE id = $1
    `, [customerId]);
    
    if (customerResult.rows.length === 0) {
      throw new Error('Customer not found');
    }
    
    // Check if property exists (if provided)
    if (propertyId) {
      const propertyResult = await client.query(`
        SELECT id FROM core.properties WHERE id = $1 AND owner_customer_id = $2
      `, [propertyId, customerId]);
      
      if (propertyResult.rows.length === 0) {
        throw new Error('Property not found or does not belong to the specified customer');
      }
    }
    
    // Check if membership already exists
    const existingMembershipResult = await client.query(`
      SELECT id FROM core.customer_memberships 
      WHERE user_id = $1 AND customer_id = $2 AND role_id = $3 AND COALESCE(property_id, '00000000-0000-0000-0000-000000000000') = COALESCE($4, '00000000-0000-0000-0000-000000000000')
    `, [userId, customerId, role.id, propertyId]);
    
    if (existingMembershipResult.rows.length > 0) {
      // Update existing membership to active
      await client.query(`
        UPDATE core.customer_memberships 
        SET is_active = true, updated_at = NOW()
        WHERE id = $1
      `, [existingMembershipResult.rows[0].id]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        membership_id: existingMembershipResult.rows[0].id,
        message: `Membership reactivated for ${userResult.rows[0].email} in ${customerResult.rows[0].name}`
      };
    }
    
    // Create new membership
    const membershipResult = await client.query(`
      INSERT INTO core.customer_memberships (user_id, customer_id, role_id, property_id, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id
    `, [userId, customerId, role.id, propertyId]);
    
    const membershipId = membershipResult.rows[0].id;
    
    // Record membership provenance
    await client.query(`
      INSERT INTO core.membership_provenance (membership_id, source, created_by_user)
      VALUES ($1, 'manual', $2)
    `, [membershipId, assignedByUserId]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      membership_id: membershipId,
      message: `Membership created for ${userResult.rows[0].email} in ${customerResult.rows[0].name} with role ${role.display_name}`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function removeMembershipFromUser(userId, customerId, roleKey, propertyId = null, removedByUserId, clientIp, userAgent) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    // Set actor context for guard function via session GUCs
    await client.query("SELECT set_config('app.user_id', $1, true)", [String(removedByUserId)]);
    // Best-effort: derive actor's current highest membership to set customer and role for guard
    const actorCtx = await client.query(`
      SELECT m.customer_id, r.key AS role_key
      FROM core.customer_memberships m
      JOIN core.roles r ON r.id = m.role_id
      WHERE m.user_id = $1 AND m.is_active = true
      ORDER BY r.hierarchy_lvl DESC
      LIMIT 1
    `, [removedByUserId]);
    const actorCustomerId = actorCtx.rows[0]?.customer_id || null;
    const actorRoleKey = actorCtx.rows[0]?.role_key || null;
    await client.query("SELECT set_config('app.customer_id', $1, true)", [actorCustomerId ? String(actorCustomerId) : '']);
    await client.query("SELECT set_config('app.actor_role', $1, true)", [actorRoleKey ? String(actorRoleKey) : '']);
    
    // Get role information
    const roleResult = await client.query(`
      SELECT id, key FROM core.roles WHERE key = $1
    `, [roleKey]);
    
    if (roleResult.rows.length === 0) {
      throw new Error('Target role not found');
    }
    
    const role = roleResult.rows[0];
    
    // Find the membership
    const membershipResult = await client.query(`
      SELECT id FROM core.customer_memberships 
      WHERE user_id = $1 AND customer_id = $2 AND role_id = $3 AND COALESCE(property_id, '00000000-0000-0000-0000-000000000000') = COALESCE($4, '00000000-0000-0000-0000-000000000000')
    `, [userId, customerId, role.id, propertyId]);
    
    if (membershipResult.rows.length === 0) {
      throw new Error('Membership not found');
    }
    
    // Deactivate membership (soft delete)
    await client.query(`
      UPDATE core.customer_memberships 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `, [membershipResult.rows[0].id]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: `Membership removed successfully`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Clear actor context
    try {
      await client.query("SELECT set_config('app.user_id', '', true)");
      await client.query("SELECT set_config('app.customer_id', '', true)");
      await client.query("SELECT set_config('app.actor_role', '', true)");
    } catch (_) {}
    client.release();
  }
}

export async function setUserInactive(userId, currentUserId) {
  console.log('setUserInactive function called with userId:', userId, 'currentUserId:', currentUserId);
  
  const client = await db.connect();
  console.log('Database connection established');
  
  try {
    // Get current user's role to verify they can deactivate users
    const currentUserQuery = `
      SELECT r.hierarchy_lvl, r.scope, r.key as role_key, m.customer_id
      FROM core.users u
      JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
      JOIN core.roles r ON r.id = m.role_id
      WHERE u.id = $1
      ORDER BY r.hierarchy_lvl DESC
      LIMIT 1
    `;
    
    const currentUserResult = await client.query(currentUserQuery, [currentUserId]);
    
    if (currentUserResult.rows.length === 0) {
      throw new Error('Current user not found or no active memberships');
    }
    
    const currentUser = currentUserResult.rows[0];
    
    // Only platform admins can deactivate users
    if (currentUser.role_key !== 'waterreportcard_super_admin') {
      throw new Error('Only platform administrators can deactivate users');
    }
    
    // Get target user to verify they exist
    const targetUserQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM core.users u
      WHERE u.id = $1 AND u.is_active = true
    `;
    
    const targetUserResult = await client.query(targetUserQuery, [userId]);
    
    if (targetUserResult.rows.length === 0) {
      throw new Error('User not found or already inactive');
    }
    
    const targetUser = targetUserResult.rows[0];
    
    // Prevent deactivating the current user
    if (userId === currentUserId) {
      throw new Error('Cannot deactivate your own account');
    }
    
    // Set user as inactive
    const result = await client.query('UPDATE core.users SET is_active = false WHERE id = $1', [userId]);
    console.log('User deactivated result:', result.rowCount);
    
    return {
      success: true,
      message: `User ${targetUser.first_name} ${targetUser.last_name} (${targetUser.email}) has been deactivated successfully`
    };
    
  } catch (error) {
    console.error('Error in setUserInactive function:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function setUserActive(userId, currentUserId) {
  console.log('setUserActive function called with userId:', userId, 'currentUserId:', currentUserId);
  
  const client = await db.connect();
  console.log('Database connection established');
  
  try {
    // Get current user's role to verify they can reactivate users
    const currentUserQuery = `
      SELECT r.hierarchy_lvl, r.scope, r.key as role_key, m.customer_id
      FROM core.users u
      JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
      JOIN core.roles r ON r.id = m.role_id
      WHERE u.id = $1
      ORDER BY r.hierarchy_lvl DESC
      LIMIT 1
    `;
    
    const currentUserResult = await client.query(currentUserQuery, [currentUserId]);
    
    if (currentUserResult.rows.length === 0) {
      throw new Error('Current user not found or no active memberships');
    }
    
    const currentUser = currentUserResult.rows[0];
    console.log('Current user hierarchy level:', currentUser.hierarchy_lvl);
    
    // Get target user to verify they exist and check their hierarchy
    const targetUserQuery = `
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name,
        u.is_active,
        COALESCE(MAX(r.hierarchy_lvl), 0) as max_hierarchy_lvl
      FROM core.users u
      LEFT JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
      LEFT JOIN core.roles r ON r.id = m.role_id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.is_active
    `;
    
    const targetUserResult = await client.query(targetUserQuery, [userId]);
    
    if (targetUserResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const targetUser = targetUserResult.rows[0];
    
    // Check if user is already active
    if (targetUser.is_active) {
      throw new Error('User is already active');
    }
    
    // Verify current user has higher hierarchy level than target user
    if (targetUser.max_hierarchy_lvl >= currentUser.hierarchy_lvl) {
      throw new Error('You can only reactivate users with lower hierarchy levels than your own');
    }
    
    // Prevent reactivating yourself (though unlikely since you'd be inactive)
    if (userId === currentUserId) {
      throw new Error('Cannot reactivate your own account');
    }
    
    // Set user as active
    const result = await client.query('UPDATE core.users SET is_active = true WHERE id = $1', [userId]);
    console.log('User reactivated result:', result.rowCount);
    
    return {
      success: true,
      message: `User ${targetUser.first_name} ${targetUser.last_name} (${targetUser.email}) has been reactivated successfully`
    };
    
  } catch (error) {
    console.error('Error in setUserActive function:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteUser(userId, currentUserId) {
  console.log('deleteUser function called with userId:', userId, 'currentUserId:', currentUserId);
  
  let client;
  try {
    client = await db.connect();
    console.log('Database connection established');
  } catch (dbError) {
    console.error('Database connection failed:', dbError);
    throw new Error('Database connection failed: ' + dbError.message);
  }
  
  try {
    // Get current user's role to verify they can delete users
    console.log('Getting current user role for:', currentUserId);
    const currentUserQuery = `
      SELECT r.hierarchy_lvl, r.scope, r.key as role_key, m.customer_id
      FROM core.users u
      JOIN core.customer_memberships m ON m.user_id = u.id AND m.is_active = true
      JOIN core.roles r ON r.id = m.role_id
      WHERE u.id = $1
      ORDER BY r.hierarchy_lvl DESC
      LIMIT 1
    `;
    
    const currentUserResult = await client.query(currentUserQuery, [currentUserId]);
    console.log('Current user query result:', currentUserResult.rows.length, 'rows');
    
    if (currentUserResult.rows.length === 0) {
      throw new Error('Current user not found or no active memberships');
    }
    
    const currentUser = currentUserResult.rows[0];
    
    // Only Super Admin or LiquosLabs General Manager can delete users
    const isSuperAdmin = currentUser.role_key === 'waterreportcard_super_admin';
    const isGeneralManager = currentUser.role_key === 'liquoslabs_general_manager';
    if (!isSuperAdmin && !isGeneralManager) {
      throw new Error('Only platform administrators or general managers can delete users');
    }
    
    // Get target user to verify they exist and can be deleted
    console.log('Getting target user info for:', userId);
    const targetUserQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name,
             EXISTS(SELECT 1 FROM core.customer_memberships m WHERE m.user_id = u.id AND m.is_active = true) as has_memberships,
             EXISTS(SELECT 1 FROM core.wrc_consumer_profiles c WHERE c.user_id = u.id) as has_consumer_profile,
             EXISTS(SELECT 1 FROM audit.consumer_registrations cr WHERE cr.user_id = u.id) as has_consumer_registration
      FROM core.users u
      WHERE u.id = $1
    `;
    
    const targetUserResult = await client.query(targetUserQuery, [userId]);
    console.log('Target user query result:', targetUserResult.rows.length, 'rows');
    
    if (targetUserResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const targetUser = targetUserResult.rows[0];

    // Additional constraints for General Manager deletes
    if (isGeneralManager) {
      // GM cannot delete Super Admins or other GMs
      const targetMembershipsResult = await client.query(`
        SELECT r.key as role_key, r.scope as role_scope
        FROM core.customer_memberships m
        JOIN core.roles r ON r.id = m.role_id
        WHERE m.user_id = $1 AND m.is_active = true
      `, [userId]);

      const targetMemberships = targetMembershipsResult.rows || [];

      // If target has consumer profile, GM cannot delete (not a platform key person)
      if (targetUser.has_consumer_profile) {
        throw new Error('General Manager may only delete platform team members');
      }

      // Disallow deleting SA or GM roles
      const targetHasProtectedRole = targetMemberships.some(m => 
        m.role_key === 'waterreportcard_super_admin' || m.role_key === 'liquoslabs_general_manager'
      );
      if (targetHasProtectedRole) {
        throw new Error('General Manager cannot delete Super Admins or General Managers');
      }

      // Ensure all memberships are platform-scoped (no customer/vendor/location roles)
      const hasNonPlatform = targetMemberships.some(m => m.role_scope && m.role_scope !== 'platform');
      if (hasNonPlatform) {
        throw new Error('General Manager may only delete platform-scoped users');
      }
    }
    
    // Prevent deleting the current user
    if (userId === currentUserId) {
      throw new Error('Cannot delete your own account');
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Delete in correct order to avoid foreign key constraint violations
      
      // 1. Delete consumer registrations first (references both users and consumer_profiles)
      if (targetUser.has_consumer_registration) {
        console.log('Deleting consumer registrations for user:', userId);
        const regResult = await client.query('DELETE FROM audit.consumer_registrations WHERE user_id = $1', [userId]);
        console.log('Consumer registrations deletion result:', regResult.rowCount);
      }
      
      // 2. Delete consumer profile (references users)
      if (targetUser.has_consumer_profile) {
        console.log('Deleting consumer profile for user:', userId);
        const consumerResult = await client.query('DELETE FROM core.wrc_consumer_profiles WHERE user_id = $1', [userId]);
        console.log('Consumer profile deletion result:', consumerResult.rowCount);
      }
      
      // 3. Revoke invitations issued by this user's memberships (FK: inviter_membership_id)
      console.log('Revoking invitations issued by user\'s memberships:', userId);
      const inviteRevokeResult = await client.query(`
        UPDATE core.customer_invitations i
        SET status = CASE WHEN status = 'pending' THEN 'revoked' ELSE status END,
            inviter_membership_id = NULL,
            updated_at = NOW()
        WHERE inviter_membership_id IN (
          SELECT id FROM core.customer_memberships WHERE user_id = $1
        )
      `, [userId]);
      console.log('Invitations updated (inviter nullified):', inviteRevokeResult.rowCount);

      // 4. Delete memberships (references users)
      if (targetUser.has_memberships) {
        console.log('Deleting memberships for user:', userId);
        // Set actor context for guard function via session GUCs
        await client.query("SELECT set_config('app.user_id', $1, true)", [String(currentUserId)]);
        await client.query("SELECT set_config('app.customer_id', $1, true)", [String(currentUser.customer_id || '')]);
        await client.query("SELECT set_config('app.actor_role', $1, true)", [String(currentUser.role_key)]);
        const membershipResult = await client.query('DELETE FROM core.customer_memberships WHERE user_id = $1', [userId]);
        console.log('Membership deletion result:', membershipResult.rowCount);
        // Clear actor context
        await client.query("SELECT set_config('app.user_id', '', true)");
        await client.query("SELECT set_config('app.customer_id', '', true)");
        await client.query("SELECT set_config('app.actor_role', '', true)");
      }
      
      // 5. Handle invitations where this user was the accepted user
      console.log('Handling invitations for user:', userId);
      
      // First, change status of accepted invitations to revoked
      const statusResult = await client.query('UPDATE core.customer_invitations SET status = \'revoked\' WHERE accepted_user_id = $1 AND status = \'accepted\'', [userId]);
      console.log('Changed invitation status result:', statusResult.rowCount);
      
      // Then clear the accepted_user_id
      const invitationResult = await client.query('UPDATE core.customer_invitations SET accepted_user_id = NULL WHERE accepted_user_id = $1', [userId]);
      console.log('Invitation clearing result:', invitationResult.rowCount);
      
      // 6. Finally delete the user
      console.log('Hard deleting user:', userId);
      const userResult = await client.query('DELETE FROM core.users WHERE id = $1', [userId]);
      console.log('User hard delete result:', userResult.rowCount);
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
      return {
        success: true,
        message: `User ${targetUser.first_name} ${targetUser.last_name} (${targetUser.email}) has been deleted successfully`
      };
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error during user deletion, transaction rolled back:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in deleteUser function:', error);
    throw error;
  } finally {
    client.release();
  }
}


