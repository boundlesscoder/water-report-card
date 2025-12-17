import { db } from '../../config/db.js';
import { CONTACT_QUERIES } from './contacts.query.js';

// ============= CONTACTS =============

export async function listContactsRepository(filters = {}) {
  const {
    search,
    status,
    parent_id,
    page = 1,
    pageSize = 25
  } = filters;

  const params = [];
  const whereClauses = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    params.push(`%${search}%`);
    whereClauses.push(`(c.contact_name ILIKE $${paramCount} OR c.contact_id ILIKE $${paramCount})`);
  }

  if (status) {
    paramCount++;
    params.push(status);
    whereClauses.push(`c.status = $${paramCount}`);
  }

  if (parent_id !== undefined) {
    if (parent_id === null) {
      whereClauses.push(`c.parent_id IS NULL`);
    } else {
      paramCount++;
      params.push(parent_id);
      whereClauses.push(`c.parent_id = $${paramCount}`);
    }
  }

  const whereSql = whereClauses.length ? `AND ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;

  paramCount++;
  params.push(pageSizeNumber);
  paramCount++;
  params.push(offset);

  const listSql = `${CONTACT_QUERIES.LIST_CONTACTS} ${whereSql} ORDER BY c.created_at DESC LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
  const countSql = `SELECT COUNT(*) as total FROM public.wrc_contacts c WHERE 1=1 ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params.slice(0, -2)) // Remove limit and offset params for count
  ]);

  return {
    items: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
    page: pageNumber,
    pageSize: pageSizeNumber
  };
}

export async function getContactByIdRepository(id) {
  const result = await db.query(CONTACT_QUERIES.GET_CONTACT_BY_ID, [id]);
  return result.rows[0] || null;
}

export async function createContactRepository(data) {
  const {
    contact_id,
    contact_name,
    parent_id,
    location_id,
    billing_id,
    status = 'active',
    referral,
    lead_source,
    external_url,
    security_access_instructions,
    parking_requirements,
    main_phone_number,
    point_contact_primary,
    point_contact_secondary,
    is_cert_of_insurance_on_file = false
  } = data;

  const result = await db.query(CONTACT_QUERIES.CREATE_CONTACT, [
    contact_id || null,
    contact_name,
    parent_id || null,
    location_id || null,
    billing_id || null,
    status,
    referral || null,
    lead_source || null,
    external_url || null,
    security_access_instructions || null,
    parking_requirements || null,
    main_phone_number || null,
    point_contact_primary || null,
    point_contact_secondary || null,
    is_cert_of_insurance_on_file
  ]);

  return result.rows[0];
}

export async function updateContactRepository(id, data) {
  const {
    contact_id,
    contact_name,
    parent_id,
    location_id,
    billing_id,
    status,
    referral,
    lead_source,
    external_url,
    security_access_instructions,
    parking_requirements,
    main_phone_number,
    point_contact_primary,
    point_contact_secondary,
    is_cert_of_insurance_on_file
  } = data;

  const result = await db.query(CONTACT_QUERIES.UPDATE_CONTACT, [
    id,
    contact_id,
    contact_name,
    parent_id,
    location_id,
    billing_id,
    status,
    referral,
    lead_source,
    external_url,
    security_access_instructions,
    parking_requirements,
    main_phone_number,
    point_contact_primary,
    point_contact_secondary,
    is_cert_of_insurance_on_file
  ]);

  return result.rows[0] || null;
}

export async function deleteContactRepository(id) {
  const result = await db.query(CONTACT_QUERIES.DELETE_CONTACT, [id]);
  return result.rows[0] || null;
}

// ============= LOCATIONS =============

export async function listLocationsRepository(filters = {}) {
  const {
    search,
    contact_id,
    status,
    region,
    service_zone,
    page = 1,
    pageSize = 25
  } = filters;

  const params = [];
  const whereClauses = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    params.push(`%${search}%`);
    whereClauses.push(`(l.name ILIKE $${paramCount} OR l.branch ILIKE $${paramCount})`);
  }

  if (contact_id) {
    paramCount++;
    params.push(contact_id);
    whereClauses.push(`l.contact_id = $${paramCount}`);
  }

  if (status) {
    paramCount++;
    params.push(status);
    whereClauses.push(`l.status = $${paramCount}`);
  }

  if (region) {
    paramCount++;
    params.push(region);
    whereClauses.push(`l.region = $${paramCount}`);
  }

  if (service_zone) {
    paramCount++;
    params.push(service_zone);
    whereClauses.push(`l.service_zone = $${paramCount}`);
  }

  const whereSql = whereClauses.length ? `AND ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;

  paramCount++;
  params.push(pageSizeNumber);
  paramCount++;
  params.push(offset);

  const listSql = `${CONTACT_QUERIES.LIST_LOCATIONS} ${whereSql} ORDER BY l.created_at DESC LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
  const countSql = `SELECT COUNT(*) as total FROM public.wrc_locations l WHERE 1=1 ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params.slice(0, -2))
  ]);

  return {
    items: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
    page: pageNumber,
    pageSize: pageSizeNumber
  };
}

export async function getLocationByIdRepository(id) {
  const result = await db.query(CONTACT_QUERIES.GET_LOCATION_BY_ID, [id]);
  return result.rows[0] || null;
}

export async function createLocationRepository(data) {
  const {
    contact_id,
    campus_id,
    building_id,
    name,
    branch,
    location_type,
    status = 'active',
    address_id,
    shipping_address_id,
    cached_city,
    cached_state,
    cached_postal_code,
    region,
    service_zone,
    route_code,
    billing_id,
    geom
  } = data;

  const result = await db.query(CONTACT_QUERIES.CREATE_LOCATION, [
    contact_id,
    campus_id || null,
    building_id || null,
    name,
    branch || null,
    location_type || null,
    status,
    address_id || null,
    shipping_address_id || null,
    cached_city || null,
    cached_state || null,
    cached_postal_code || null,
    region || null,
    service_zone || null,
    route_code || null,
    billing_id || null,
    geom || null
  ]);

  return result.rows[0];
}

export async function updateLocationRepository(id, data) {
  const {
    contact_id,
    campus_id,
    building_id,
    name,
    branch,
    location_type,
    status,
    address_id,
    shipping_address_id,
    cached_city,
    cached_state,
    cached_postal_code,
    region,
    service_zone,
    route_code,
    billing_id,
    geom
  } = data;

  const result = await db.query(CONTACT_QUERIES.UPDATE_LOCATION, [
    id,
    contact_id,
    campus_id,
    building_id,
    name,
    branch,
    location_type,
    status,
    address_id,
    shipping_address_id,
    cached_city,
    cached_state,
    cached_postal_code,
    region,
    service_zone,
    route_code,
    billing_id,
    geom
  ]);

  return result.rows[0] || null;
}

export async function deleteLocationRepository(id) {
  const result = await db.query(CONTACT_QUERIES.DELETE_LOCATION, [id]);
  return result.rows[0] || null;
}

// ============= ADDRESSES =============

export async function createAddressRepository(data) {
  const {
    line1,
    line2,
    city,
    state,
    postal_code,
    country,
    latitude,
    longitude,
    pwsid
  } = data;

  const result = await db.query(CONTACT_QUERIES.CREATE_ADDRESS, [
    line1 || null,
    line2 || null,
    city || null,
    state || null,
    postal_code || null,
    country || null,
    latitude || null,
    longitude || null,
    pwsid || null
  ]);

  return result.rows[0];
}

export async function updateAddressRepository(id, data) {
  const {
    line1,
    line2,
    city,
    state,
    postal_code,
    country,
    latitude,
    longitude,
    pwsid
  } = data;

  const result = await db.query(CONTACT_QUERIES.UPDATE_ADDRESS, [
    id,
    line1,
    line2,
    city,
    state,
    postal_code,
    country,
    latitude,
    longitude,
    pwsid
  ]);

  return result.rows[0] || null;
}

export async function deleteAddressRepository(id) {
  const result = await db.query(CONTACT_QUERIES.DELETE_ADDRESS, [id]);
  return result.rows[0] || null;
}

// ============= BILLING INFORMATION =============

export async function listBillingInfoRepository(filters = {}) {
  const {
    contact_id,
    location_id,
    is_active,
    page = 1,
    pageSize = 25
  } = filters;

  const params = [];
  const whereClauses = [];
  let paramCount = 0;

  if (contact_id) {
    paramCount++;
    params.push(contact_id);
    whereClauses.push(`b.contact_id = $${paramCount}`);
  }

  if (location_id) {
    paramCount++;
    params.push(location_id);
    whereClauses.push(`b.location_id = $${paramCount}`);
  }

  if (is_active !== undefined) {
    paramCount++;
    params.push(is_active);
    whereClauses.push(`b.is_active = $${paramCount}`);
  }

  const whereSql = whereClauses.length ? `AND ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;

  paramCount++;
  params.push(pageSizeNumber);
  paramCount++;
  params.push(offset);

  const listSql = `${CONTACT_QUERIES.LIST_BILLING_INFO} ${whereSql} ORDER BY b.created_at DESC LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
  const countSql = `SELECT COUNT(*) as total FROM public.wrc_billing_information b WHERE 1=1 ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params.slice(0, -2))
  ]);

  return {
    items: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
    page: pageNumber,
    pageSize: pageSizeNumber
  };
}

export async function getBillingInfoByIdRepository(id) {
  const result = await db.query(CONTACT_QUERIES.GET_BILLING_INFO_BY_ID, [id]);
  return result.rows[0] || null;
}

export async function createBillingInfoRepository(data) {
  const {
    contact_id,
    location_id,
    name,
    contact_type,
    department,
    contact_name,
    email,
    contact_note,
    address_id,
    contacts_sales_tax,
    discount_rate,
    hourly_labor_rate,
    is_default = false,
    is_active = true
  } = data;

  const result = await db.query(CONTACT_QUERIES.CREATE_BILLING_INFO, [
    contact_id,
    location_id || null,
    name || null,
    contact_type || null,
    department || null,
    contact_name || null,
    email || null,
    contact_note || null,
    address_id || null,
    contacts_sales_tax || null,
    discount_rate || null,
    hourly_labor_rate || null,
    is_default,
    is_active
  ]);

  return result.rows[0];
}

export async function updateBillingInfoRepository(id, data) {
  const {
    contact_id,
    location_id,
    name,
    contact_type,
    department,
    contact_name,
    email,
    contact_note,
    address_id,
    contacts_sales_tax,
    discount_rate,
    hourly_labor_rate,
    is_default,
    is_active
  } = data;

  const result = await db.query(CONTACT_QUERIES.UPDATE_BILLING_INFO, [
    id,
    contact_id,
    location_id,
    name,
    contact_type,
    department,
    contact_name,
    email,
    contact_note,
    address_id,
    contacts_sales_tax,
    discount_rate,
    hourly_labor_rate,
    is_default,
    is_active
  ]);

  return result.rows[0] || null;
}

export async function deleteBillingInfoRepository(id) {
  const result = await db.query(CONTACT_QUERIES.DELETE_BILLING_INFO, [id]);
  return result.rows[0] || null;
}

