import { db } from '../config/db.js';
import { getUserHighestRole } from '../middleware/auth-middleware.js';
import { sendInvitation, acceptInvitation, assignMembershipToUser, removeMembershipFromUser } from '../services/auth-service.js';

// Get available roles for invitation (based on allowed_invites for current user's highest role)
export async function getAvailableRoles(req, res) {
  try {
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    console.log('🔍 [Backend] Current user:', currentUser.email);
    console.log('🔍 [Backend] User memberships:', currentUser.memberships);
    console.log('🔍 [Backend] Highest role:', highestRole);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    // Get all roles directly permitted by allowed_invites matrix for the user's highest role
    // NOTE: We only show DIRECT invitation permissions, not transitive ones
    const result = await db.query(`
      SELECT DISTINCT
        invitee.id,
        invitee.key,
        invitee.display_name,
        invitee.hierarchy_lvl,
        invitee.scope
      FROM core.allowed_invites ai
      JOIN core.roles inviter ON inviter.id = ai.inviter_role_id
      JOIN core.roles invitee ON invitee.id = ai.invitee_role_id
      WHERE inviter.key = $1
      ORDER BY invitee.hierarchy_lvl DESC
    `, [highestRole.role_key]);

    console.log('🔍 [Backend] Query for role:', highestRole.role_key);
    console.log('🔍 [Backend] Roles found:', result.rows.length);
    console.log('🔍 [Backend] Roles:', result.rows);

    res.json({
      success: true,
      data: {
        roles: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching available roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available roles'
    });
  }
}

// Get available customers for invitation (based on current user's access)
export async function getAvailableCustomers(req, res) {
  try {
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    let query;
    let params = [];

    if (['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      // Platform admin can invite to any customer
      query = `
        SELECT 
          c.id,
          c.name,
          c.status,
          c.hierarchy_level,
          c.path,
          core.get_customer_path_text(c.id) as full_path
        FROM core.customers c
        WHERE c.is_active = true
          AND c.name <> 'LiquosLabs Platform'
        ORDER BY c.path
      `;
    } else {
      // Other users can only invite to customers they have access to
      query = `
        SELECT 
          c.id,
          c.name,
          c.status,
          c.hierarchy_level,
          c.path,
          core.get_customer_path_text(c.id) as full_path
        FROM core.customers c
        WHERE c.is_active = true
          AND c.path <@ (SELECT path FROM core.customers WHERE id = $1)
        ORDER BY c.path
      `;
      params = [highestRole.customer_id];
    }

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available customers'
    });
  }
}

// Send invitation to multiple customers (or customer-less)
export async function sendInvite(req, res) {
  try {
    const currentUser = req.user;
    const { invitee_email, target_role_key, target_customer_ids, property_id } = req.body;

    // Validate required fields
    if (!invitee_email || !target_role_key) {
      return res.status(400).json({
        success: false,
        error: 'invitee_email and target_role_key are required'
      });
    }

    // Normalize target_customer_ids (can be null for customer-less invitations)
    let normalizedCustomerIds = [];
    if (target_customer_ids && Array.isArray(target_customer_ids) && target_customer_ids.length > 0) {
      normalizedCustomerIds = target_customer_ids.filter(id => id && id.trim() !== '');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invitee_email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Get client IP and user agent
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Send invitation using the existing service
    const result = await sendInvitation(
      currentUser.user_id,
      invitee_email,
      target_role_key,
      normalizedCustomerIds,
      property_id,
      clientIp,
      userAgent
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `Invitation sent successfully to ${invitee_email}`
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('hierarchy levels')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation'
    });
  }
}

// Assign membership to user (post-invitation)
export async function assignMembership(req, res) {
  try {
    const currentUser = req.user;
    const { user_id, customer_id, role_key, property_id } = req.body;

    // Validate required fields
    if (!user_id || !customer_id || !role_key) {
      return res.status(400).json({
        success: false,
        error: 'user_id, customer_id, and role_key are required'
      });
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await assignMembershipToUser(
      user_id,
      customer_id,
      role_key,
      property_id,
      currentUser.user_id,
      clientIp,
      userAgent
    );

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error assigning membership:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to assign membership'
    });
  }
}

// Remove membership from user
export async function removeMembership(req, res) {
  try {
    const currentUser = req.user;
    const { user_id, customer_id, role_key, property_id } = req.body;

    // Validate required fields
    if (!user_id || !customer_id || !role_key) {
      return res.status(400).json({
        success: false,
        error: 'user_id, customer_id, and role_key are required'
      });
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await removeMembershipFromUser(
      user_id,
      customer_id,
      role_key,
      property_id,
      currentUser.user_id,
      clientIp,
      userAgent
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error removing membership:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to remove membership'
    });
  }
}

// Get pending invitations (for current user's organization)
export async function getPendingInvitations(req, res) {
  try {
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query;
    let countQuery;
    let params = [];

    if (highestRole.role_key === 'waterreportcard_super_admin') {
      // Platform admin can see all pending invitations
      query = `
        SELECT 
          i.id,
          i.invitee_email,
          i.status,
          i.invited_at,
          i.expires_at,
          r.key as target_role_key,
          r.display_name as target_role_display,
          r.scope as target_role_scope,
          u.full_name as inviter_name,
          u.email as inviter_email,
          COUNT(it.id) as target_customer_count
        FROM core.customer_invitations i
        JOIN core.roles r ON r.id = i.target_role_id
        JOIN core.customer_memberships m ON m.id = i.inviter_membership_id
        JOIN core.users u ON u.id = m.user_id
        LEFT JOIN core.invitation_targets it ON it.invitation_id = i.id
        WHERE i.status = 'pending'
        GROUP BY i.id, i.invitee_email, i.status, i.invited_at, i.expires_at,
                 r.key, r.display_name, r.scope, u.full_name, u.email
        ORDER BY i.invited_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      countQuery = `
        SELECT COUNT(*) as total
        FROM core.customer_invitations i
        WHERE i.status = 'pending'
      `;
      
      params = [limitNum, offset];
    } else {
      // Other users can only see invitations for their accessible customers
      query = `
        SELECT 
          i.id,
          i.invitee_email,
          i.status,
          i.invited_at,
          i.expires_at,
          r.key as target_role_key,
          r.display_name as target_role_display,
          r.scope as target_role_scope,
          u.full_name as inviter_name,
          u.email as inviter_email,
          COUNT(it.id) as target_customer_count
        FROM core.customer_invitations i
        JOIN core.roles r ON r.id = i.target_role_id
        JOIN core.customer_memberships m ON m.id = i.inviter_membership_id
        JOIN core.users u ON u.id = m.user_id
        LEFT JOIN core.invitation_targets it ON it.invitation_id = i.id
        WHERE i.status = 'pending'
          AND EXISTS (
            SELECT 1 FROM core.invitation_targets it2
            JOIN core.customers c ON c.id = it2.target_customer_id
            WHERE it2.invitation_id = i.id
              AND c.path <@ (SELECT path FROM core.customers WHERE id = $3)
          )
        GROUP BY i.id, i.invitee_email, i.status, i.invited_at, i.expires_at,
                 r.key, r.display_name, r.scope, u.full_name, u.email
        ORDER BY i.invited_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      countQuery = `
        SELECT COUNT(*) as total
        FROM core.customer_invitations i
        WHERE i.status = 'pending'
          AND EXISTS (
            SELECT 1 FROM core.invitation_targets it2
            JOIN core.customers c ON c.id = it2.target_customer_id
            WHERE it2.invitation_id = i.id
              AND c.path <@ (SELECT path FROM core.customers WHERE id = $1)
          )
      `;
      
      params = [limitNum, offset, highestRole.customer_id];
    }

    const [dataResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2)) // Remove limit and offset params
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        invitations: dataResult.rows,
        total: total
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending invitations'
    });
  }
}

// Get invitations that need customer assignment
export async function getInvitationsNeedingCustomerAssignment(req, res) {
  try {
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    // Only super admin and general manager can see invitations needing assignment
    if (!['waterreportcard_super_admin', 'liquoslabs_general_manager'].includes(highestRole.role_key)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view invitations needing customer assignment'
      });
    }

    const result = await db.query(`
      SELECT * FROM core.get_invitations_needing_customer_assignment($1)
    `, [currentUser.user_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching invitations needing customer assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations needing customer assignment'
    });
  }
}

// Assign customer to an invitation
export async function assignCustomerToInvitation(req, res) {
  try {
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);

    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    // Only super admin and general manager can assign customers
    if (!['waterreportcard_super_admin', 'liquoslabs_general_manager'].includes(highestRole.role_key)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to assign customers to invitations'
      });
    }

    const { invitation_id, customer_id } = req.body;

    if (!invitation_id || !customer_id) {
      return res.status(400).json({
        success: false,
        error: 'invitation_id and customer_id are required'
      });
    }

    const result = await db.query(`
      SELECT core.assign_customer_to_invitation($1, $2, $3)
    `, [invitation_id, customer_id, currentUser.user_id]);

    if (result.rows[0].assign_customer_to_invitation) {
      res.json({
        success: true,
        message: 'Customer assigned to invitation successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Invitation not found or customer assignment failed'
      });
    }
  } catch (error) {
    console.error('Error assigning customer to invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign customer to invitation'
    });
  }
}

// Get invitation details
export async function getInvitationById(req, res) {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    let query;
    let params = [id];

    if (highestRole.role_key !== 'waterreportcard_super_admin') {
      // Check if user can access this invitation
      query = `
        SELECT 
          i.id,
          i.invitee_email,
          i.status,
          i.invited_at,
          i.expires_at,
          i.accepted_at,
          r.key as target_role_key,
          r.display_name as target_role_display,
          r.scope as target_role_scope,
          u.full_name as inviter_name,
          u.email as inviter_email
        FROM core.customer_invitations i
        JOIN core.roles r ON r.id = i.target_role_id
        JOIN core.customer_memberships m ON m.id = i.inviter_membership_id
        JOIN core.users u ON u.id = m.user_id
        WHERE i.id = $1
          AND EXISTS (
            SELECT 1 FROM core.invitation_targets it
            JOIN core.customers c ON c.id = it.target_customer_id
            WHERE it.invitation_id = i.id
              AND c.path <@ (SELECT path FROM core.customers WHERE id = $2)
          )
      `;
      params.push(highestRole.customer_id);
    } else {
      query = `
        SELECT 
          i.id,
          i.invitee_email,
          i.status,
          i.invited_at,
          i.expires_at,
          i.accepted_at,
          r.key as target_role_key,
          r.display_name as target_role_display,
          r.scope as target_role_scope,
          u.full_name as inviter_name,
          u.email as inviter_email
        FROM core.customer_invitations i
        JOIN core.roles r ON r.id = i.target_role_id
        JOIN core.customer_memberships m ON m.id = i.inviter_membership_id
        JOIN core.users u ON u.id = m.user_id
        WHERE i.id = $1
      `;
    }

    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or access denied'
      });
    }

    // Get invitation targets
    const targetsResult = await db.query(`
      SELECT * FROM core.get_invitation_targets($1)
    `, [id]);

    res.json({
      success: true,
      data: {
        invitation: result.rows[0],
        targets: targetsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching invitation details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitation details'
    });
  }
}

// Revoke invitation
export async function revokeInvitation(req, res) {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    // Check if user can access this invitation
    let accessQuery;
    let accessParams = [id];

    if (highestRole.role_key !== 'waterreportcard_super_admin') {
      accessQuery = `
        SELECT i.id
        FROM core.customer_invitations i
        WHERE i.id = $1
          AND EXISTS (
            SELECT 1 FROM core.invitation_targets it
            JOIN core.customers c ON c.id = it.target_customer_id
            WHERE it.invitation_id = i.id
              AND c.path <@ (SELECT path FROM core.customers WHERE id = $2)
          )
      `;
      accessParams.push(highestRole.customer_id);
    } else {
      accessQuery = `SELECT id FROM core.customer_invitations WHERE id = $1`;
    }

    const accessResult = await db.query(accessQuery, accessParams);
    
    if (accessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or access denied'
      });
    }

    // Update invitation status
    const result = await db.query(`
      UPDATE core.customer_invitations 
      SET status = 'revoked', updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invitation not found or already processed'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Invitation revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke invitation'
    });
  }
}

// Accept invitation (public endpoint - no auth required)
export async function acceptInvite(req, res) {
  try {
    const { token } = req.params;
    const userData = req.body;

    // Validate required fields
    if (!userData.first_name || !userData.last_name || !userData.password) {
      return res.status(400).json({
        success: false,
        error: 'first_name, last_name, and password are required'
      });
    }

    // Get client IP and user agent
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Accept invitation using the existing service
    const result = await acceptInvitation(token, userData, clientIp, userAgent);

    res.json({
      success: true,
      data: result,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('already been used')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
}

// Get invitation by token (for invitation acceptance page)
export async function getInvitationByToken(req, res) {
  try {
    const { token } = req.params;

    const result = await db.query(`
      SELECT 
        i.id,
        i.invitee_email,
        i.status,
        i.expires_at,
        r.key as target_role_key,
        r.display_name as target_role_display,
        r.scope as target_role_scope,
        u.full_name as inviter_name
      FROM core.customer_invitations i
      JOIN core.roles r ON r.id = i.target_role_id
      JOIN core.customer_memberships m ON m.id = i.inviter_membership_id
      JOIN core.users u ON u.id = m.user_id
      WHERE i.token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invitation token'
      });
    }

    const invitation = result.rows[0];

    // Check if invitation is expired
    if (new Date() > invitation.expires_at) {
      return res.status(400).json({
        success: false,
        error: 'Invitation has expired'
      });
    }

    // Check if invitation is already used
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Invitation has already been used'
      });
    }

    // Get invitation targets
    const targetsResult = await db.query(`
      SELECT * FROM core.get_invitation_targets($1)
    `, [invitation.id]);

    res.json({
      success: true,
      data: {
        invitation: invitation,
        targets: targetsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching invitation by token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitation'
    });
  }
}

