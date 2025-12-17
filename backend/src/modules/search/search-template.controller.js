import * as service from './search-template.service.js';

export async function listTemplates(req, res) {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { module } = req.params;
    const templates = await service.listTemplates({ userId, module });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('listTemplates error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list templates' });
  }
}

export async function getTemplate(req, res) {
  try {
    const { id } = req.params;
    const template = await service.loadTemplate(id);
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('getTemplate error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get template' });
  }
}

export async function getDefaultTemplate(req, res) {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { module } = req.params;
    const template = await service.getDefaultTemplate({ userId, module });
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'No default template found' });
    }
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('getDefaultTemplate error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get default template' });
  }
}

export async function createTemplate(req, res) {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { module, name, search_payload, is_default, is_shared } = req.body;
    
    if (!module || !name || !search_payload) {
      return res.status(400).json({ success: false, message: 'Module, name, and search_payload are required' });
    }

    const template = await service.saveTemplate({
      userId,
      module,
      name,
      payload: search_payload,
      is_default: is_default || false,
      is_shared: is_shared || false
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('createTemplate error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create template' });
  }
}

export async function updateTemplate(req, res) {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { id } = req.params;
    
    // Verify template belongs to user
    const existingTemplate = await service.loadTemplate(id);
    if (!existingTemplate) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    if (existingTemplate.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this template' });
    }

    const template = await service.updateTemplate(id, req.body);
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('updateTemplate error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update template' });
  }
}

export async function deleteTemplate(req, res) {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { id } = req.params;
    
    // Verify template belongs to user
    const existingTemplate = await service.loadTemplate(id);
    if (!existingTemplate) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    if (existingTemplate.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this template' });
    }

    const template = await service.deleteTemplate(id);
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('deleteTemplate error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete template' });
  }
}

