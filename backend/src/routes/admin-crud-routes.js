import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth-middleware.js';
import { listEntities, getEntityMeta, listRows, getRow, createRow, updateRow, deleteRow } from '../controller/crm-cmms-crud-controller.js';

const router = express.Router();

// Entities & metadata
router.get('/entities', authMiddleware, adminMiddleware, listEntities);
router.get('/entities/:entity/meta', authMiddleware, adminMiddleware, getEntityMeta);

// Generic CRUD
router.get('/entities/:entity/rows', authMiddleware, adminMiddleware, listRows);
router.get('/entities/:entity/rows/:id', authMiddleware, adminMiddleware, getRow);
router.post('/entities/:entity/rows', authMiddleware, adminMiddleware, createRow);
router.put('/entities/:entity/rows/:id', authMiddleware, adminMiddleware, updateRow);
router.delete('/entities/:entity/rows/:id', authMiddleware, adminMiddleware, deleteRow);

export default router;


