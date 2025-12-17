import { db } from '../../config/db.js';

export async function getSearchSchema(module) {
  const result = await db.query(
    `SELECT schema FROM public.wrc_search_schemas WHERE module = $1 AND is_active = true ORDER BY version DESC LIMIT 1`,
    [module]
  );
  if (result.rows[0]?.schema) {
    const schema = result.rows[0].schema;
    // Parse JSON if it's a string
    if (typeof schema === 'string') {
      try {
        return JSON.parse(schema);
      } catch (e) {
        console.error('Error parsing schema:', e);
        return null;
      }
    }
    return schema;
  }
  return null;
}

export async function getSearchSchemaWithVersion(module, version) {
  const result = await db.query(
    `SELECT * FROM public.wrc_search_schemas WHERE module = $1 AND version = $2`,
    [module, version]
  );
  return result.rows[0] || null;
}

export async function listSearchSchemas(module) {
  const result = await db.query(
    `SELECT * FROM public.wrc_search_schemas WHERE module = $1 ORDER BY version DESC`,
    [module]
  );
  // Parse JSON for each schema
  return result.rows.map(row => {
    if (row.schema && typeof row.schema === 'string') {
      try {
        row.schema = JSON.parse(row.schema);
      } catch (e) {
        console.error('Error parsing schema:', e);
      }
    }
    return row;
  });
}

export async function createSearchSchema(data) {
  const { module, version, schema, is_active = true } = data;
  const result = await db.query(
    `INSERT INTO public.wrc_search_schemas (module, version, schema, is_active) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [module, version, JSON.stringify(schema), is_active]
  );
  return result.rows[0];
}

export async function updateSearchSchema(id, data) {
  const { schema, is_active } = data;
  const updates = [];
  const params = [id];
  let paramCount = 1;

  if (schema !== undefined) {
    paramCount++;
    updates.push(`schema = $${paramCount}`);
    params.push(JSON.stringify(schema));
  }

  if (is_active !== undefined) {
    paramCount++;
    updates.push(`is_active = $${paramCount}`);
    params.push(is_active);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  paramCount++;
  updates.push(`updated_at = now()`);

  const result = await db.query(
    `UPDATE public.wrc_search_schemas 
     SET ${updates.join(', ')} 
     WHERE id = $1 
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

export async function deleteSearchSchema(id) {
  const result = await db.query(
    `DELETE FROM public.wrc_search_schemas WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}