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

  // Note: LIST_CONTACTS already includes ORDER BY for DISTINCT ON, so we just add LIMIT and OFFSET
  const listSql = `${CONTACT_QUERIES.LIST_CONTACTS} ${whereSql} LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
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

// Get dropdown options for a specific field, filtered by other search conditions
export async function getDropdownOptionsRepository(searches = [], fieldId) {
  // Filter out empty values and "Show all"
  const activeSearches = searches.filter(search => {
    if (!search.value) return false;
    const trimmedValue = String(search.value).trim();
    if (trimmedValue === '') return false;
    if (trimmedValue.toLowerCase() === 'show all') return false;
    // Exclude the field we're getting options for
    if (search.fieldId === fieldId) return false;
    return true;
  });

  // Build WHERE clause based on active searches
  const params = [];
  const whereClauses = [];
  let paramCount = 0;

  // Field mapping: frontend fieldId -> database field for filtering
  const filterFieldMapping = {
    'name': 'c.contact_name',
    'contact_type': 'b.contact_type',
    'category_description': 'c.category_description',
    'region': 'l.region',
    'state': 'l.cached_state',
    'city': 'l.cached_city',
    'location': 'l.name',
    'location_name': 'l.name',
    'service_zone': 'l.service_zone',
    'route': 'l.route_code',
    'pwsid': 'a_physical.pwsid',
    'email': 'b.email',
    'contact_status': 'l.status',
    'zip': 'l.cached_postal_code'
  };

  // Build WHERE clauses for filtering
  activeSearches.forEach(search => {
    const dbField = filterFieldMapping[search.fieldId] || `c.${search.fieldId}`;
    
    if (search.fieldId === 'contact_type') {
      // Handle hierarchical contact_type
      paramCount++;
      params.push(`%${search.value}%`);
      whereClauses.push(`(${dbField} ILIKE $${paramCount} OR ${dbField} LIKE $${paramCount} || '/%')`);
    } else {
      paramCount++;
      params.push(`%${search.value}%`);
      whereClauses.push(`${dbField} ILIKE $${paramCount}`);
    }
  });

  const whereSql = whereClauses.length ? `AND ${whereClauses.join(' AND ')}` : '';

  // Field mapping for target field (the one we want dropdown options for)
  const targetFieldMapping = {
    'name': 'c.contact_name',
    'contact_type': 'b.contact_type',
    'category_description': 'c.category_description',
    'region': 'l.region',
    'state': 'l.cached_state',
    'city': 'l.cached_city',
    'location': 'l.name',
    'location_name': 'l.name',
    'service_zone': 'l.service_zone',
    'route': 'l.route_code',
    'pwsid': 'a_physical.pwsid',
    'email': 'b.email',
    'contact_status': 'l.status',
    'zip': 'l.cached_postal_code'
  };

  const targetField = targetFieldMapping[fieldId] || `c.${fieldId}`;
  
  // Special handling for 'name' field - only show parent contacts
  const nameFilter = fieldId === 'name' ? 'AND c.parent_id IS NULL' : '';

  // Build query to get unique values
  const query = `
    SELECT DISTINCT ${targetField} as value
    FROM public.wrc_contacts c
    LEFT JOIN public.wrc_locations l ON l.id = c.location_id AND l.status = 'active'
    LEFT JOIN public.wrc_addresses a_physical ON a_physical.id = l.address_id
    LEFT JOIN public.wrc_addresses a_shipping ON a_shipping.id = l.shipping_address_id
    LEFT JOIN public.wrc_billing_information b ON b.id = c.billing_id AND b.is_active = true
    LEFT JOIN public.wrc_addresses a_billing ON a_billing.id = b.address_id
    WHERE 1=1 ${whereSql} ${nameFilter}
      AND ${targetField} IS NOT NULL
      AND TRIM(COALESCE(${targetField}::text, '')) != ''
    ORDER BY ${targetField} ASC
  `;

  const result = await db.query(query, params);
  
  // Extract unique values and filter out nulls/empty strings
  const values = result.rows
    .map(row => row.value)
    .filter(val => val !== null && val !== undefined && String(val).trim() !== '')
    .map(val => String(val));

  // Remove duplicates and sort
  return [...new Set(values)].sort();
}

// Get contacts filtered by search conditions and sorted
export async function getContactsBySearchRepository(searches = [], sorts = [], page = 1, limit = 50) {
  // Filter out empty values and "Show all"
  const activeSearches = searches.filter(search => {
    if (!search.value) return false;
    const trimmedValue = String(search.value).trim();
    if (trimmedValue === '') return false;
    if (trimmedValue.toLowerCase() === 'show all') return false;
    return true;
  });

  // Build WHERE clause based on active searches
  const params = [];
  const whereClauses = [];
  let paramCount = 0;

  // Field mapping: frontend fieldId -> database field for filtering
  const filterFieldMapping = {
    'name': 'c.contact_name',
    'contact_type': 'b.contact_type',
    'category_description': 'c.category_description',
    'region': 'l.region',
    'state': 'l.cached_state',
    'city': 'l.cached_city',
    'location': 'l.name',
    'location_name': 'l.name',
    'service_zone': 'l.service_zone',
    'route': 'l.route_code',
    'pwsid': 'a_physical.pwsid',
    'email': 'b.email',
    'contact_status': 'l.status',
    'zip': 'l.cached_postal_code'
  };

  // Build WHERE clauses for filtering
  activeSearches.forEach(search => {
    const dbField = filterFieldMapping[search.fieldId] || `c.${search.fieldId}`;
    
    if (search.fieldId === 'contact_type') {
      // Handle hierarchical contact_type
      paramCount++;
      params.push(`%${search.value}%`);
      whereClauses.push(`(${dbField} ILIKE $${paramCount} OR ${dbField} LIKE $${paramCount} || '/%')`);
    } else {
      paramCount++;
      params.push(`%${search.value}%`);
      whereClauses.push(`${dbField} ILIKE $${paramCount}`);
    }
  });

  const whereSql = whereClauses.length ? `AND ${whereClauses.join(' AND ')}` : '';

  // Build ORDER BY clause from sorts
  const orderByClauses = [];
  const sortFieldMapping = {
    'name': 'c.contact_name',
    'contact_type': 'b.contact_type',
    'category_description': 'c.category_description',
    'region': 'l.region',
    'state': 'l.cached_state',
    'city': 'l.cached_city',
    'location': 'l.name',
    'location_name': 'l.name',
    'service_zone': 'l.service_zone',
    'route': 'l.route_code',
    'pwsid': 'a_physical.pwsid',
    'email': 'b.email',
    'contact_status': 'l.status',
    'zip': 'l.cached_postal_code'
  };

  sorts.forEach(sort => {
    if (sort.fieldId && sort.direction) {
      const dbField = sortFieldMapping[sort.fieldId] || `c.${sort.fieldId}`;
      const direction = sort.direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderByClauses.push(`${dbField} ${direction}`);
    }
  });

  // Default ordering if no sorts provided
  const orderBySql = orderByClauses.length > 0 
    ? `ORDER BY ${orderByClauses.join(', ')}, c.id ASC`
    : `ORDER BY c.id ASC`;

  // Pagination
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNumber - 1) * pageSizeNumber;

  paramCount++;
  params.push(pageSizeNumber);
  paramCount++;
  params.push(offset);

  // Build query - use LIST_CONTACTS as base, but remove the default ORDER BY
  // DISTINCT ON requires ORDER BY to start with the DISTINCT ON columns
  const baseQuery = CONTACT_QUERIES.LIST_CONTACTS.replace(/\s+ORDER BY c\.id, l\.created_at ASC\s*$/, '');
  
  // For ORDER BY with DISTINCT ON, we need to start with c.id, then add other sorts
  const distinctOrderBy = orderByClauses.length > 0
    ? `ORDER BY c.id, ${orderByClauses.join(', ')}`
    : `ORDER BY c.id, l.created_at ASC`;
  
  const listSql = `${baseQuery} ${whereSql} ${distinctOrderBy} LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
  
  // Count query
  const countSql = `
    SELECT COUNT(DISTINCT c.id) as total
    FROM public.wrc_contacts c
    LEFT JOIN public.wrc_locations l ON l.id = c.location_id AND l.status = 'active'
    LEFT JOIN public.wrc_addresses a_physical ON a_physical.id = l.address_id
    LEFT JOIN public.wrc_addresses a_shipping ON a_shipping.id = l.shipping_address_id
    LEFT JOIN public.wrc_billing_information b ON b.id = c.billing_id AND b.is_active = true
    LEFT JOIN public.wrc_addresses a_billing ON a_billing.id = b.address_id
    WHERE 1=1 ${whereSql}
  `;

  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params.slice(0, -2)) // Remove limit and offset params for count
  ]);

  return {
    items: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
    page: pageNumber,
    pageSize: pageSizeNumber,
    totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || '0', 10) / pageSizeNumber)
  };
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
    whereClauses.push(`c.id = $${paramCount}`);
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

  // If filtering by contact_id, need to join with contacts
  const fromClause = contact_id 
    ? `FROM public.wrc_locations l LEFT JOIN public.wrc_contacts c ON c.location_id = l.id`
    : `FROM public.wrc_locations l`;
  
  const listSql = `${CONTACT_QUERIES.LIST_LOCATIONS} ${whereSql} ORDER BY l.created_at DESC LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
  const countSql = `SELECT COUNT(*) as total ${fromClause} WHERE 1=1 ${whereSql}`;

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
    whereClauses.push(`c.id = $${paramCount}`);
  }

  if (location_id) {
    paramCount++;
    params.push(location_id);
    whereClauses.push(`c.location_id = $${paramCount}`);
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

  // If filtering by contact_id or location_id, need to join with contacts
  const fromClause = (contact_id || location_id)
    ? `FROM public.wrc_billing_information b LEFT JOIN public.wrc_contacts c ON c.billing_id = b.id`
    : `FROM public.wrc_billing_information b`;
  
  const listSql = `${CONTACT_QUERIES.LIST_BILLING_INFO} ${whereSql} ORDER BY b.created_at DESC LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
  const countSql = `SELECT COUNT(*) as total ${fromClause} WHERE 1=1 ${whereSql}`;

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

