import express from 'express';
import {
    listAnalyteTypes,
    createAnalyteType,
    updateAnalyteType,
    deleteAnalyteType,
    listClassifications,
    createClassification,
    updateClassification,
    deleteClassification,
    listSubclassifications,
    createSubclassification,
    updateSubclassification,
    deleteSubclassification,
    listAnalytes,
    createAnalyte,
    updateAnalyte,
    deleteAnalyte
} from '../controller/contaminants-controller.js';

const router = express.Router();

// Analyte Types
router.get('/analyte-types', listAnalyteTypes);
router.post('/analyte-types', createAnalyteType);
router.put('/analyte-types/:id', updateAnalyteType);
router.delete('/analyte-types/:id', deleteAnalyteType);

// Classifications
router.get('/classifications', listClassifications);
router.post('/classifications', createClassification);
router.put('/classifications/:id', updateClassification);
router.delete('/classifications/:id', deleteClassification);

// Subclassifications
router.get('/subclassifications', listSubclassifications);
router.post('/subclassifications', createSubclassification);
router.put('/subclassifications/:id', updateSubclassification);
router.delete('/subclassifications/:id', deleteSubclassification);

// Analytes
router.get('/analytes', listAnalytes);
router.post('/analytes', createAnalyte);
router.put('/analytes/:id', updateAnalyte);
router.delete('/analytes/:id', deleteAnalyte);

export default router;

