import express from 'express';
import { authMiddleware, requireMinimumHierarchyLevel } from '../middleware/auth-middleware.js';
import {
  getCustomerHierarchy,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerDescendants,
  getCustomerAncestors
} from '../controller/customerController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// =========
// Customer Management API Routes
// =========

// Get customer hierarchy tree
router.get('/hierarchy', getCustomerHierarchy);

// Get customers accessible by current user
router.get('/', getCustomers);

// Get single customer details
router.get('/:id', getCustomerById);

// Create new customer
router.post('/', requireMinimumHierarchyLevel(80), createCustomer);

// Update customer
router.put('/:id', requireMinimumHierarchyLevel(80), updateCustomer);

// Delete customer
router.delete('/:id', requireMinimumHierarchyLevel(90), deleteCustomer);

// Get customer descendants
router.get('/:id/descendants', getCustomerDescendants);

// Get customer ancestors
router.get('/:id/ancestors', getCustomerAncestors);

export default router;