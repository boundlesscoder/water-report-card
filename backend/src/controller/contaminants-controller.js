import {
    listAnalyteTypesService,
    createAnalyteTypeService,
    updateAnalyteTypeService,
    deleteAnalyteTypeService,
    listClassificationsService,
    createClassificationService,
    updateClassificationService,
    deleteClassificationService,
    listSubclassificationsService,
    createSubclassificationService,
    updateSubclassificationService,
    deleteSubclassificationService,
    listAnalytesService,
    createAnalyteService,
    updateAnalyteService,
    deleteAnalyteService
} from '../services/contaminants-service.js';

// Analyte Types
export async function listAnalyteTypes(req, res) {
    try {
        const rows = await listAnalyteTypesService();
        res.json(rows);
    } catch (error) {
        console.error('listAnalyteTypes error', error);
        res.status(500).json({ error: 'Failed to list analyte types' });
    }
}

export async function createAnalyteType(req, res) {
    try {
        const { code, name, description } = req.body;
        if (!code) return res.status(400).json({ error: 'code is required' });
        const row = await createAnalyteTypeService({ code, name, description });
        res.status(201).json(row);
    } catch (error) {
        console.error('createAnalyteType error', error);
        res.status(500).json({ error: 'Failed to create analyte type' });
    }
}

export async function updateAnalyteType(req, res) {
    try {
        const { id } = req.params;
        const row = await updateAnalyteTypeService(id, req.body || {});
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    } catch (error) {
        console.error('updateAnalyteType error', error);
        res.status(500).json({ error: 'Failed to update analyte type' });
    }
}

export async function deleteAnalyteType(req, res) {
    try {
        const { id } = req.params;
        await deleteAnalyteTypeService(id);
        res.status(204).end();
    } catch (error) {
        console.error('deleteAnalyteType error', error);
        res.status(500).json({ error: 'Failed to delete analyte type' });
    }
}

// Classifications
export async function listClassifications(req, res) {
    try {
        const rows = await listClassificationsService({ analyte_type_id: req.query.analyte_type_id });
        res.json(rows);
    } catch (error) {
        console.error('listClassifications error', error);
        res.status(500).json({ error: 'Failed to list classifications' });
    }
}

export async function createClassification(req, res) {
    try {
        const { analyte_type_id, name } = req.body;
        if (!analyte_type_id || !name) return res.status(400).json({ error: 'analyte_type_id and name are required' });
        const row = await createClassificationService({ analyte_type_id, name });
        res.status(201).json(row);
    } catch (error) {
        console.error('createClassification error', error);
        res.status(500).json({ error: 'Failed to create classification' });
    }
}

export async function updateClassification(req, res) {
    try {
        const { id } = req.params;
        const row = await updateClassificationService(id, req.body || {});
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    } catch (error) {
        console.error('updateClassification error', error);
        res.status(500).json({ error: 'Failed to update classification' });
    }
}

export async function deleteClassification(req, res) {
    try {
        const { id } = req.params;
        await deleteClassificationService(id);
        res.status(204).end();
    } catch (error) {
        console.error('deleteClassification error', error);
        res.status(500).json({ error: 'Failed to delete classification' });
    }
}

// Subclassifications
export async function listSubclassifications(req, res) {
    try {
        const rows = await listSubclassificationsService({ classification_id: req.query.classification_id });
        res.json(rows);
    } catch (error) {
        console.error('listSubclassifications error', error);
        res.status(500).json({ error: 'Failed to list subclassifications' });
    }
}

export async function createSubclassification(req, res) {
    try {
        const { classification_id, name } = req.body;
        if (!classification_id || !name) return res.status(400).json({ error: 'classification_id and name are required' });
        const row = await createSubclassificationService({ classification_id, name });
        res.status(201).json(row);
    } catch (error) {
        console.error('createSubclassification error', error);
        res.status(500).json({ error: 'Failed to create subclassification' });
    }
}

export async function updateSubclassification(req, res) {
    try {
        const { id } = req.params;
        const row = await updateSubclassificationService(id, req.body || {});
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    } catch (error) {
        console.error('updateSubclassification error', error);
        res.status(500).json({ error: 'Failed to update subclassification' });
    }
}

export async function deleteSubclassification(req, res) {
    try {
        const { id } = req.params;
        await deleteSubclassificationService(id);
        res.status(204).end();
    } catch (error) {
        console.error('deleteSubclassification error', error);
        res.status(500).json({ error: 'Failed to delete subclassification' });
    }
}

// Analytes
export async function listAnalytes(req, res) {
    try {
        const data = await listAnalytesService(req.query || {});
        res.json(data);
    } catch (error) {
        console.error('listAnalytes error', error);
        res.status(500).json({ error: 'Failed to list analytes' });
    }
}

export async function createAnalyte(req, res) {
    try {
        const row = await createAnalyteService(req.body || {});
        res.status(201).json(row);
    } catch (error) {
        console.error('createAnalyte error', error);
        res.status(500).json({ error: 'Failed to create analyte' });
    }
}

export async function updateAnalyte(req, res) {
    try {
        const { id } = req.params;
        const row = await updateAnalyteService(id, req.body || {});
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    } catch (error) {
        console.error('updateAnalyte error', error);
        res.status(500).json({ error: 'Failed to update analyte' });
    }
}

export async function deleteAnalyte(req, res) {
    try {
        const { id } = req.params;
        await deleteAnalyteService(id);
        res.status(204).end();
    } catch (error) {
        console.error('deleteAnalyte error', error);
        res.status(500).json({ error: 'Failed to delete analyte' });
    }
}

