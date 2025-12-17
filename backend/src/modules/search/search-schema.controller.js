import * as service from './search-schema.service.js';

export async function getSearchSchema(req, res) {
  try {
    const { module } = req.params;
    const schema = await service.getSearchSchema(module);
    
    if (!schema) {
      return res.status(404).json({ success: false, message: 'Search schema not found for this module' });
    }
    
    res.json({ success: true, data: schema });
  } catch (error) {
    console.error('getSearchSchema error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get search schema' });
  }
}

export async function listSearchSchemas(req, res) {
  try {
    const { module } = req.params;
    const schemas = await service.listSearchSchemas(module);
    res.json({ success: true, data: schemas });
  } catch (error) {
    console.error('listSearchSchemas error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list search schemas' });
  }
}

export async function createSearchSchema(req, res) {
  try {
    const schema = await service.createSearchSchema(req.body);
    res.status(201).json({ success: true, data: schema });
  } catch (error) {
    console.error('createSearchSchema error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A schema with this module and version already exists.' });
    }
    
    res.status(400).json({ success: false, message: error.message || 'Failed to create search schema' });
  }
}

export async function updateSearchSchema(req, res) {
  try {
    const { id } = req.params;
    const schema = await service.updateSearchSchema(id, req.body);
    
    if (!schema) {
      return res.status(404).json({ success: false, message: 'Search schema not found' });
    }
    
    res.json({ success: true, data: schema });
  } catch (error) {
    console.error('updateSearchSchema error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update search schema' });
  }
}

export async function deleteSearchSchema(req, res) {
  try {
    const { id } = req.params;
    const schema = await service.deleteSearchSchema(id);
    
    if (!schema) {
      return res.status(404).json({ success: false, message: 'Search schema not found' });
    }
    
    res.json({ success: true, data: schema });
  } catch (error) {
    console.error('deleteSearchSchema error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete search schema' });
  }
}

