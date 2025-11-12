import express from 'express';
import { getLayerStyles, updateLayerStyle, createLayerStyle, deleteLayerStyle, getLabelStyles, saveLabelStyles, resetLabelStyles } from '../controller/layer-styles-controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth-middleware.js';

const router = express.Router();

// Water Layer Styles - Public endpoint - no authentication required
router.get('/styles', getLayerStyles);

// Water Layer Styles - Admin endpoints - authentication and admin privileges required
router.post('/styles', authMiddleware, adminMiddleware, createLayerStyle);
router.put('/styles/:id', authMiddleware, adminMiddleware, updateLayerStyle);
router.delete('/styles/:id', authMiddleware, adminMiddleware, deleteLayerStyle);

// Label Styles - Public endpoint for frontend to load styles
router.get('/label-styles', getLabelStyles);

// Label Styles - Admin endpoints - authentication and admin privileges required
router.post('/label-styles', authMiddleware, adminMiddleware, saveLabelStyles);
router.delete('/label-styles', authMiddleware, adminMiddleware, resetLabelStyles);

export default router; 