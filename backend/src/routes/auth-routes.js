import express from 'express';
import {
  // Registration and Authentication
  register,
  login,
  logout,
  
  // Email Verification
  verifyEmailToken,
  
  // Password Reset
  requestReset,
  resetPasswordToken,
  
  // Invitation System
  sendUserInvitation,
  acceptUserInvitation,
  
  // Token Verification
  verifyAuthToken,
  
  // User Profile Management
  getProfile,
  updateProfile,
  changeUserPassword,
  
  // User Management
  getUsers,
  getUserStatistics,
  getUserById,
  deleteUserController,
  setUserInactiveController,
  setUserActiveController,
} from '../controller/auth-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const router = express.Router();

// =========
// Public Routes (No Authentication Required)
// =========

// Registration (WRC Consumer Only)
router.post('/register', register);

// Authentication
router.post('/login', login);
router.post('/logout', logout);

// Email Verification
router.post('/verify-email', verifyEmailToken);
router.get('/verify-email', verifyEmailToken);

// Password Reset
router.post('/request-reset', requestReset);
router.post('/reset-password', resetPasswordToken);

// Accept Invitation (Public - uses invitation token)
router.post('/accept-invitation', acceptUserInvitation);

// Token Verification
router.post('/verify-token', verifyAuthToken);

// =========
// Protected Routes (Authentication Required)
// =========

// User Profile Management
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changeUserPassword);

// Invitation System (Protected - requires authentication)
router.post('/send-invitation', authMiddleware, sendUserInvitation);

// =========
// User Management (Protected - requires authentication)
// =========

// Get all users based on role hierarchy
router.get('/users', authMiddleware, getUsers);

// Get user statistics
router.get('/users/stats', authMiddleware, getUserStatistics);

// Get specific user by ID
router.get('/users/:id', authMiddleware, getUserById);

// Set user inactive (Platform Admin only)
router.patch('/users/:id/inactive', authMiddleware, setUserInactiveController);

// Set user active (Platform Admin only)
router.patch('/users/:id/active', authMiddleware, setUserActiveController);

// Delete user (Platform Admin only)
router.delete('/users/:id', authMiddleware, deleteUserController);

export default router;
