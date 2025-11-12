import {
  ENTITIES,
  listEntitiesService,
  getEntityMetaService,
  listRowsService,
  getRowService,
  createRowService,
  updateRowService,
  deleteRowService
} from '../services/crm-cmms-crud-service.js';

export function listEntities(_req, res) {
  res.json({ success: true, data: listEntitiesService() });
}

export async function getEntityMeta(req, res) {
  const { entity } = req.params;
  if (!ENTITIES[entity]) return res.status(404).json({ success: false, message: 'Unknown entity' });
  try {
    const meta = await getEntityMetaService(entity);
    res.json({ success: true, data: meta });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load metadata' });
  }
}

export async function listRows(req, res) {
  const { entity } = req.params;
  if (!ENTITIES[entity]) return res.status(404).json({ success: false, message: 'Unknown entity' });
  try {
    const data = await listRowsService(entity, req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listRows error', error);
    res.status(500).json({ success: false, message: 'Failed to list rows' });
  }
}

export async function getRow(req, res) {
  const { entity, id } = req.params;
  if (!ENTITIES[entity]) return res.status(404).json({ success: false, message: 'Unknown entity' });
  try {
    const row = await getRowService(entity, id);
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('getRow error', error);
    res.status(500).json({ success: false, message: 'Failed to load row' });
  }
}

export async function createRow(req, res) {
  const { entity } = req.params;
  if (!ENTITIES[entity]) return res.status(404).json({ success: false, message: 'Unknown entity' });
  try {
    const row = await createRowService(entity, req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createRow error', error);
    
    if (error?.code === '23505') {
      return res.status(409).json({ success: false, message: 'Duplicate key. A record with these unique fields already exists.' });
    }
    if (error?.code === '23503') {
      return res.status(400).json({ success: false, message: 'Foreign key violation. Please select valid related records.' });
    }
    if (error?.code === '23502') {
      return res.status(400).json({ success: false, message: 'Missing required field. Please fill all required fields.' });
    }
    if (error?.code === '22P02') {
      return res.status(400).json({ success: false, message: 'Invalid value type for one or more fields.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create row' });
  }
}

export async function updateRow(req, res) {
  const { entity, id } = req.params;
  if (!ENTITIES[entity]) return res.status(404).json({ success: false, message: 'Unknown entity' });
  try {
    const row = await updateRowService(entity, id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateRow error', error);
    
    if (error?.code === '23505') {
      return res.status(409).json({ success: false, message: 'Duplicate key. A record with these unique fields already exists.' });
    }
    if (error?.code === '23503') {
      return res.status(400).json({ success: false, message: 'Foreign key violation. Please select valid related records.' });
    }
    if (error?.code === '23502') {
      return res.status(400).json({ success: false, message: 'Missing required field. Please fill all required fields.' });
    }
    if (error?.code === '22P02') {
      return res.status(400).json({ success: false, message: 'Invalid value type for one or more fields.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update row' });
  }
}

export async function deleteRow(req, res) {
  const { entity, id } = req.params;
  if (!ENTITIES[entity]) return res.status(404).json({ success: false, message: 'Unknown entity' });
  try {
    const result = await deleteRowService(entity, id);
    if (result?.softDeleted) {
      return res.json({ success: true, softDeleted: true, field: result.field, value: result.value });
    }
    res.status(204).end();
  } catch (err) {
    if (err?.code === '23503') {
      return res.status(409).json({ success: false, message: 'Cannot delete due to related records. The record may be referenced elsewhere.' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete row' });
  }
}


