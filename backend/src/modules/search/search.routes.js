import express from 'express';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import * as schemaController from './search-schema.controller.js';
import * as templateController from './search-template.controller.js';

const router = express.Router();

// ============= SEARCH SCHEMAS =============
// Public routes for getting schemas (no auth required for reading)
router.get('/schemas/:module', schemaController.getSearchSchema);
router.get('/schemas/:module/all', schemaController.listSearchSchemas);

// Admin routes for managing schemas (auth required)
router.post('/schemas', authMiddleware, schemaController.createSearchSchema);
router.put('/schemas/:id', authMiddleware, schemaController.updateSearchSchema);
router.delete('/schemas/:id', authMiddleware, schemaController.deleteSearchSchema);

// ============= SEARCH TEMPLATES =============
// All template routes require authentication
router.get('/templates/:module', authMiddleware, templateController.listTemplates);
router.get('/templates/:module/default', authMiddleware, templateController.getDefaultTemplate);
router.get('/template/:id', authMiddleware, templateController.getTemplate);
router.post('/templates', authMiddleware, templateController.createTemplate);
router.put('/templates/:id', authMiddleware, templateController.updateTemplate);
router.delete('/templates/:id', authMiddleware, templateController.deleteTemplate);

export default router;

