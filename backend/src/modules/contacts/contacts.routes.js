import express from 'express';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import * as controller from './contacts.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ============= CONTACTS =============
router.get('/', controller.listContacts);
router.get('/:id', controller.getContact);
router.post('/', controller.createContact);
router.put('/:id', controller.updateContact);
router.delete('/:id', controller.deleteContact);

// ============= LOCATIONS =============
router.get('/locations', controller.listLocations);
router.get('/locations/:id', controller.getLocation);
router.post('/locations', controller.createLocation);
router.put('/locations/:id', controller.updateLocation);
router.delete('/locations/:id', controller.deleteLocation);

// ============= ADDRESSES =============
router.post('/addresses', controller.createAddress);
router.put('/addresses/:id', controller.updateAddress);
router.delete('/addresses/:id', controller.deleteAddress);

// ============= BILLING INFORMATION =============
router.get('/billing', controller.listBillingInfo);
router.get('/billing/:id', controller.getBillingInfo);
router.post('/billing', controller.createBillingInfo);
router.put('/billing/:id', controller.updateBillingInfo);
router.delete('/billing/:id', controller.deleteBillingInfo);

export default router;

