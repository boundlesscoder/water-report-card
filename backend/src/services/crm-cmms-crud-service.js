import { db } from '../config/db.js';

// Whitelisted entities for generic admin CRUD
// Define table name, primary key column, and optional display label
export const ENTITIES = {
  accounts: { table: 'accounts', id: 'id', label: 'Accounts' },
  addresses: { table: 'addresses', id: 'id', label: 'Addresses' },
  locations: { table: 'locations', id: 'id', label: 'Locations' },
  manufacturers: { table: 'manufacturers', id: 'id', label: 'Manufacturers' },
  contacts: { table: 'contacts', id: 'id', label: 'Contacts' },
  contacts_enhanced: { table: 'contacts_enhanced', id: 'id', label: 'Enhanced Contacts' },
  customer_tier1: { table: 'customer_tier1', id: 'id', label: 'Customer Tier 1' },
  customer_tier2: { table: 'customer_tier2', id: 'id', label: 'Customer Tier 2' },
  customer_tier3: { table: 'customer_tier3', id: 'id', label: 'Customer Tier 3' },
  asset_categories: { table: 'asset_categories', id: 'id', label: 'Asset Categories' },
  equipment_specifications: { table: 'equipment_specifications', id: 'id', label: 'Equipment Specs' },
  parts_listing: { table: 'parts_listing', id: 'id', label: 'Parts Listing' },
  cartridge_components: { table: 'cartridge_components', id: 'id', label: 'Cartridge Components' },
  buildings: { table: 'buildings', id: 'id', label: 'Buildings' },
  floors: { table: 'floors', id: 'id', label: 'Floors' },
  water_filter_projects: { table: 'water_filter_projects', id: 'id', label: 'Water Filter Projects' },
  filter_installations: { table: 'filter_installations', id: 'id', label: 'Filter Installations' },
  installed_cartridges: { table: 'installed_cartridges', id: 'id', label: 'Installed Cartridges' },
  water_quality_metrics: { table: 'water_quality_metrics', id: 'id', label: 'Water Quality Metrics' },
  filter_lifespan_tracking: { table: 'filter_lifespan_tracking', id: 'id', label: 'Filter Lifespan Tracking' },
  leak_monitoring: { table: 'leak_monitoring', id: 'id', label: 'Leak Monitoring' },
  work_orders: { table: 'work_orders', id: 'id', label: 'Work Orders' },
  work_order_tasks: { table: 'work_order_tasks', id: 'id', label: 'Work Order Tasks' },
  nsf_certifications: { table: 'nsf_certifications', id: 'id', label: 'NSF Certifications' },
  vendors: { table: 'vendors', id: 'id', label: 'Vendors' },
  vendor_types: { table: 'vendor_types', id: 'id', label: 'Vendor Types' },
  customer_campuses: { table: 'customer_campuses', id: 'id', label: 'Customer Campuses' },
  building_rooms: { table: 'building_rooms', id: 'id', label: 'Building Rooms' },
  assets: { table: 'assets', id: 'id', label: 'Assets' },
  asset_specifications: { table: 'asset_specifications', id: 'id', label: 'Asset Specifications' },
  connected_equipment: { table: 'connected_equipment', id: 'id', label: 'Connected Equipment' },
  work_order_types: { table: 'work_order_types', id: 'id', label: 'Work Order Types' },
  work_order_assets: { table: 'work_order_assets', id: 'id', label: 'Work Order Assets' },
  work_order_parts: { table: 'work_order_parts', id: 'id', label: 'Work Order Parts' },
  work_order_scopes: { table: 'work_order_scopes', id: 'id', label: 'Work Order Scopes' },
  maintenance_profiles: { table: 'maintenance_profiles', id: 'id', label: 'Maintenance Profiles' },
  asset_maintenance_profiles: { table: 'asset_maintenance_profiles', id: 'id', label: 'Asset Maintenance Profiles' },
  service_alerts: { table: 'service_alerts', id: 'id', label: 'Service Alerts' },
  pou_points: { table: 'pou_points', id: 'id', label: 'POU Points' },
  public_access_points: { table: 'public_access_points', id: 'id', label: 'Public Access Points' },
  telemetry_readings: { table: 'telemetry_readings', id: 'id', label: 'Telemetry Readings' },
  part_compatibility: { table: 'part_compatibility', id: 'id', label: 'Part Compatibility' }
};

export function listEntitiesService() {
  return Object.entries(ENTITIES).map(([key, def]) => ({ key, label: def.label, table: def.table }));
}

export async function getEntityMetaService(entityKey) {
  const def = ENTITIES[entityKey];
  if (!def) return null;
  const { table } = def;
  const { rows } = await db.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  return { key: entityKey, table, id: def.id, columns: rows };
}

function buildSearchWhereClause(search, searchColumns, params) {
  if (!search || !searchColumns || searchColumns.length === 0) return '';
  const like = `%${search}%`;
  const ors = [];
  for (const col of searchColumns) {
    params.push(like);
    ors.push(`${col} ILIKE $${params.length}`);
  }
  return ors.length ? `(${ors.join(' OR ')})` : '';
}

export async function listRowsService(entityKey, { page = 1, pageSize = 25, search } = {}) {
  const def = ENTITIES[entityKey];
  if (!def) return null;
  const params = [];
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;

  // Heuristic search columns
  const probeCols = ['name','title','description','status','code','account_number','layer_id','manufacturer_part_number','part_name','serial_number','asset_tag','email','city','state'];
  const meta = await getEntityMetaService(entityKey);
  const actualCols = meta.columns.map(c => c.column_name);
  const searchColumns = probeCols.filter(c => actualCols.includes(c));

  const whereParts = [];
  const searchSql = buildSearchWhereClause(search, searchColumns, params);
  if (searchSql) whereParts.push(searchSql);
  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const listSql = `
    SELECT *
    FROM ${def.table}
    ${whereSql}
    ORDER BY ${def.id} DESC
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM ${def.table} ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);

  return {
    items: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
    page: pageNumber,
    pageSize: pageSizeNumber
  };
}

export async function getRowService(entityKey, id) {
  const def = ENTITIES[entityKey];
  if (!def) return null;
  const { rows } = await db.query(`SELECT * FROM ${def.table} WHERE ${def.id} = $1`, [id]);
  return rows[0] || null;
}

export async function createRowService(entityKey, payload = {}) {
  const def = ENTITIES[entityKey];
  if (!def) return null;
  const sanitize = (v) => (v === '' ? null : v);
  
  // Build columns/values excluding id and audit columns
  const meta = await getEntityMetaService(entityKey);
  const allCols = meta.columns.map(c => c.column_name);
  const banned = new Set([def.id, 'created_at', 'updated_at']);
  const cols = allCols.filter(c => payload[c] !== undefined && !banned.has(c));
  if (!cols.length) return null;
  
  const params = cols.map((c) => sanitize(payload[c]));
  const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(',');
  const sql = `INSERT INTO ${def.table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`;
  const { rows } = await db.query(sql, params);
  return rows[0];
}

export async function updateRowService(entityKey, id, payload = {}) {
  const def = ENTITIES[entityKey];
  if (!def) return null;
  const meta = await getEntityMetaService(entityKey);
  const allCols = meta.columns.map(c => c.column_name);
  const banned = new Set([def.id, 'created_at']);
  const updatable = allCols.filter(c => payload[c] !== undefined && !banned.has(c));
  if (!updatable.length) return null;
  
  // Use COALESCE pattern like existing services
  const sets = updatable.map((c, idx) => `${c} = COALESCE($${idx + 1}, ${c})`);
  const sanitize = (v) => (v === '' ? null : v);
  const params = updatable.map(c => sanitize(payload[c]));
  params.push(id);
  
  // Append updated_at only if column exists on this table
  const hasUpdatedAt = allCols.includes('updated_at');
  const setSql = hasUpdatedAt ? `${sets.join(', ')}, updated_at = NOW()` : sets.join(', ');
  const sql = `UPDATE ${def.table} SET ${setSql} WHERE ${def.id} = $${updatable.length + 1} RETURNING *`;
  const { rows } = await db.query(sql, params);
  return rows[0] || null;
}

export async function deleteRowService(entityKey, id) {
  const def = ENTITIES[entityKey];
  if (!def) return null;
  try {
    await db.query(`DELETE FROM ${def.table} WHERE ${def.id} = $1`, [id]);
    return { deleted: true };
  } catch (err) {
    // FK violation -> attempt soft delete if possible
    if (err?.code === '23503') {
      try {
        // Check if table has status or is_active
        const { rows } = await db.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
          [def.table]
        );
        const colSet = new Set(rows.map(r => r.column_name));
        const hasUpdatedAt = colSet.has('updated_at');
        if (colSet.has('status')) {
          const sql = hasUpdatedAt
            ? `UPDATE ${def.table} SET status = 'inactive', updated_at = NOW() WHERE ${def.id} = $1`
            : `UPDATE ${def.table} SET status = 'inactive' WHERE ${def.id} = $1`;
          await db.query(sql, [id]);
          return { deleted: false, softDeleted: true, field: 'status', value: 'inactive' };
        }
        if (colSet.has('is_active')) {
          const sql = hasUpdatedAt
            ? `UPDATE ${def.table} SET is_active = false, updated_at = NOW() WHERE ${def.id} = $1`
            : `UPDATE ${def.table} SET is_active = false WHERE ${def.id} = $1`;
          await db.query(sql, [id]);
          return { deleted: false, softDeleted: true, field: 'is_active', value: false };
        }
      } catch (_) {
        // fall through to throw original
      }
    }
    throw err;
  }
}


