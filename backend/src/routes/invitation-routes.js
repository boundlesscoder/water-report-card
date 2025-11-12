import express from 'express';
import { authMiddleware, requireMinimumHierarchyLevel } from '../middleware/auth-middleware.js';
import {
  getAvailableRoles,
  getAvailableCustomers,
  sendInvite,
  assignMembership,
  removeMembership,
  getPendingInvitations,
  getInvitationsNeedingCustomerAssignment,
  assignCustomerToInvitation,
  getInvitationById,
  revokeInvitation,
  acceptInvite,
  getInvitationByToken
} from '../controller/invitation-controller.js';

const router = express.Router();

// =========
// Public Routes (no authentication required)
// =========

// Accept invitation (public endpoint - no auth required)
router.post('/accept/:token', acceptInvite);

// Get invitation by token (for invitation acceptance page)
router.get('/token/:token', getInvitationByToken);

// =========
// Protected Routes (authentication required)
// =========

// Apply authentication middleware to all routes below
router.use(authMiddleware);

// Invitation Management Routes
router.get('/available-roles', getAvailableRoles);
router.get('/available-customers', getAvailableCustomers);
router.post('/send', sendInvite);
router.get('/pending', getPendingInvitations);

// Post-Invitation Customer Assignment Routes (place BEFORE dynamic '/:id')
router.get('/needing-customer-assignment', getInvitationsNeedingCustomerAssignment);
router.post('/assign-customer', assignCustomerToInvitation);

// Membership Assignment Routes
router.post('/assign-membership', requireMinimumHierarchyLevel(80), assignMembership);
router.delete('/remove-membership', requireMinimumHierarchyLevel(80), removeMembership);

// Invitation Details and Actions (must come AFTER fixed subpaths)
router.get('/:id', getInvitationById);
router.put('/:id/revoke', requireMinimumHierarchyLevel(80), revokeInvitation);

export default router;
