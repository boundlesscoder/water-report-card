import { db } from '../../config/db.js';

export async function saveTemplate({ userId, module, name, payload, is_default = false, is_shared = false }) {
  const result = await db.query(
    `INSERT INTO public.wrc_search_templates (user_id, module, name, search_payload, is_default, is_shared) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [userId, module, name, JSON.stringify(payload), is_default, is_shared]
  );
  if (result.rows[0]) {
    const template = result.rows[0];
    // Parse JSON if it's a string
    if (typeof template.search_payload === 'string') {
      try {
        template.search_payload = JSON.parse(template.search_payload);
      } catch (e) {
        console.error('Error parsing search_payload:', e);
      }
    }
    return template;
  }
  return null;
}

export async function updateTemplate(templateId, data) {
  const { name, search_payload, is_default, is_shared } = data;
  const updates = [];
  const params = [templateId];
  let paramCount = 1;

  if (name !== undefined) {
    paramCount++;
    updates.push(`name = $${paramCount}`);
    params.push(name);
  }

  if (search_payload !== undefined) {
    paramCount++;
    updates.push(`search_payload = $${paramCount}`);
    params.push(JSON.stringify(search_payload));
  }

  if (is_default !== undefined) {
    paramCount++;
    updates.push(`is_default = $${paramCount}`);
    params.push(is_default);
  }

  if (is_shared !== undefined) {
    paramCount++;
    updates.push(`is_shared = $${paramCount}`);
    params.push(is_shared);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  paramCount++;
  updates.push(`updated_at = now()`);

  const result = await db.query(
    `UPDATE public.wrc_search_templates 
     SET ${updates.join(', ')} 
     WHERE id = $1 
     RETURNING *`,
    params
  );
  if (result.rows[0]) {
    const template = result.rows[0];
    // Parse JSON if it's a string
    if (typeof template.search_payload === 'string') {
      try {
        template.search_payload = JSON.parse(template.search_payload);
      } catch (e) {
        console.error('Error parsing search_payload:', e);
      }
    }
    return template;
  }
  return null;
}

export async function loadTemplate(templateId) {
  const result = await db.query(
    `SELECT * FROM public.wrc_search_templates WHERE id = $1`,
    [templateId]
  );
  if (result.rows[0]) {
    const template = result.rows[0];
    // Parse JSON if it's a string
    if (typeof template.search_payload === 'string') {
      try {
        template.search_payload = JSON.parse(template.search_payload);
      } catch (e) {
        console.error('Error parsing search_payload:', e);
      }
    }
    return template;
  }
  return null;
}

export async function deleteTemplate(templateId) {
  const result = await db.query(
    `DELETE FROM public.wrc_search_templates WHERE id = $1 RETURNING *`,
    [templateId]
  );
  return result.rows[0] || null;
}

export async function listTemplates({ userId, module }) {
  const result = await db.query(
    `SELECT * FROM public.wrc_search_templates 
     WHERE user_id = $1 AND module = $2 
     ORDER BY is_default DESC, created_at DESC`,
    [userId, module]
  );
  // Parse JSON for each template
  return result.rows.map(template => {
    if (typeof template.search_payload === 'string') {
      try {
        template.search_payload = JSON.parse(template.search_payload);
      } catch (e) {
        console.error('Error parsing search_payload:', e);
      }
    }
    return template;
  });
}

export async function getDefaultTemplate({ userId, module }) {
  const result = await db.query(
    `SELECT * FROM public.wrc_search_templates 
     WHERE user_id = $1 AND module = $2 AND is_default = true 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId, module]
  );
  if (result.rows[0]) {
    const template = result.rows[0];
    // Parse JSON if it's a string
    if (typeof template.search_payload === 'string') {
      try {
        template.search_payload = JSON.parse(template.search_payload);
      } catch (e) {
        console.error('Error parsing search_payload:', e);
      }
    }
    return template;
  }
  return null;
}