import express from 'express';
import * as controller from '../controller/water-quality-reports-controller.js';

const router = express.Router();

// Get water quality reports (optionally filtered by bounds)
router.get('/', controller.getWaterQualityReports);

// Get water quality reports for a specific PWSID
router.get('/:pwsid', controller.getWaterQualityReportsByPwsid);

export default router;

