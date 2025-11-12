import express from 'express';
import { 
    getAllContent, 
    getContentById, 
    createContent, 
    updateContent, 
    deleteContent, 
    updateContentOrder,
    getPublicContent 
} from '../controller/content-controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth-middleware.js';

const router = express.Router();

// Public route (no auth required)
router.get('/public', getPublicContent);

// Admin routes (require auth and admin privileges)
router.get('/', authMiddleware, adminMiddleware, getAllContent);
router.get('/:id', authMiddleware, adminMiddleware, getContentById);
router.post('/', authMiddleware, adminMiddleware, createContent);
router.put('/:id', authMiddleware, adminMiddleware, updateContent);
router.delete('/:id', authMiddleware, adminMiddleware, deleteContent);
router.put('/order/update', authMiddleware, adminMiddleware, updateContentOrder);

export default router; 