import { db } from '../config/db.js';
import { getUserHighestRole } from '../middleware/auth-middleware.js';

// Helper function to find or create an address
const findOrCreateAddress = async (client, addressData) => {
  try {
    const { line1, line2, city, state, postal_code, country, pwsid, latitude, longitude } = addressData;
    
    // First, try to find existing address
    const existingAddressQuery = `
      SELECT id FROM core.addresses 
      WHERE line1 = $1 
        AND (line2 = $2 OR (line2 IS NULL AND $2 IS NULL))
        AND city = $3 
        AND state = $4 
        AND (postal_code = $5 OR (postal_code IS NULL AND $5 IS NULL))
        AND (country = $6 OR (country IS NULL AND $6 IS NULL))
        AND (pwsid = $7 OR (pwsid IS NULL AND $7 IS NULL))
      LIMIT 1
    `;
    
    const existingResult = await client.query(existingAddressQuery, [
      line1, line2, city, state, postal_code, country, pwsid
    ]);
    
    if (existingResult.rows.length > 0) {
      console.log('Found existing address, reusing ID:', existingResult.rows[0].id);
      return existingResult.rows[0].id;
    }
    
    // Address doesn't exist, create new one with coordinates from frontend
    const insertQuery = `
      INSERT INTO core.addresses (line1, line2, city, state, postal_code, country, pwsid, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
      RETURNING id
    `;
    
    const insertResult = await client.query(insertQuery, [
      line1, line2, city, state, postal_code, country, pwsid, 
      longitude || null, latitude || null
    ]);
    
    console.log('Created new address with ID:', insertResult.rows[0].id, 
                (latitude && longitude) ? `at coordinates (${latitude}, ${longitude})` : 'without coordinates');
    
    return insertResult.rows[0].id;
  } catch (error) {
    console.error('Error in findOrCreateAddress:', error);
    throw error;
  }
};

// Get customer hierarchy tree
export const getCustomerHierarchy = async (req, res) => {
  try {
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        message: 'No active role found'
      });
    }

    let query;
    let params = [];

    if (['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      // Platform admin can see all customers - use direct query as fallback
      query = `
        SELECT 
          c.id,
          c.name,
          c.parent_id,
          c.path,
          c.hierarchy_level,
          c.status,
          loc_addr.city as location_city,
          loc_addr.state as location_state,
          c.contact_1_email,
          COUNT(child.id) as children_count
        FROM customers c
        LEFT JOIN customers child ON child.parent_id = c.id
        LEFT JOIN addresses loc_addr ON loc_addr.id = c.location_address_id
        GROUP BY c.id, c.name, c.parent_id, c.path, c.hierarchy_level, c.status, loc_addr.city, loc_addr.state, c.contact_1_email
        ORDER BY c.path
      `;
    } else {
      // Other users can only see customers they have access to
      query = `
        SELECT 
          c.id,
          c.name,
          c.parent_id,
          c.path,
          c.hierarchy_level,
          c.status,
          loc_addr.city as location_city,
          loc_addr.state as location_state,
          c.contact_1_email,
          COUNT(child.id) as children_count
        FROM customers c
        LEFT JOIN customers child ON child.parent_id = c.id
        LEFT JOIN addresses loc_addr ON loc_addr.id = c.location_address_id
        WHERE c.path <@ (SELECT customers.path FROM customers WHERE customers.id = $1)
        GROUP BY c.id, c.name, c.parent_id, c.path, c.hierarchy_level, c.status, loc_addr.city, loc_addr.state, c.contact_1_email
        ORDER BY c.path
      `;
      params = [highestRole.customer_id];
    }

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching customer hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer hierarchy'
    });
  }
};

// Get customers accessible by current user
export const getCustomers = async (req, res) => {
  try {
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status = '', 
      parent_id = null 
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query;
    let countQuery;
    let params = [];
    let paramCount = 0;

    if (['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      // Platform admin can see all customers
      query = `
        SELECT 
          c.id,
          c.name,
          c.status,
          c.parent_id,
          c.path,
          c.hierarchy_level,
          c.location_name,
          loc_addr.city as location_city,
          loc_addr.state as location_state,
          loc_addr.line1 as location_address,
          ST_Y(loc_addr.location) as latitude,
          ST_X(loc_addr.location) as longitude,
          c.billing_email,
          c.contact_1_email,
          c.created_at,
          c.updated_at,
          parent.name as parent_name,
          COUNT(child.id) as children_count
        FROM core.customers c
        LEFT JOIN core.customers parent ON parent.id = c.parent_id
        LEFT JOIN core.customers child ON child.parent_id = c.id
        LEFT JOIN core.addresses loc_addr ON loc_addr.id = c.location_address_id
        WHERE 1=1 AND c.name <> 'LiquosLabs Platform'
      `;
      
      countQuery = `
        SELECT COUNT(*) as total
        FROM core.customers c
        WHERE 1=1 AND c.name <> 'LiquosLabs Platform'
      `;
    } else {
      // Other users can only see customers they have access to (including descendants)
      query = `
        SELECT 
          c.id,
          c.name,
          c.status,
          c.parent_id,
          c.path,
          c.hierarchy_level,
          c.location_name,
          loc_addr.city as location_city,
          loc_addr.state as location_state,
          loc_addr.line1 as location_address,
          ST_Y(loc_addr.location) as latitude,
          ST_X(loc_addr.location) as longitude,
          c.billing_email,
          c.contact_1_email,
          c.created_at,
          c.updated_at,
          parent.name as parent_name,
          COUNT(child.id) as children_count
        FROM core.customers c
        LEFT JOIN core.customers parent ON parent.id = c.parent_id
        LEFT JOIN core.customers child ON child.parent_id = c.id
        LEFT JOIN core.addresses loc_addr ON loc_addr.id = c.location_address_id
        WHERE c.path <@ (SELECT path FROM core.customers WHERE id = $1)
      `;
      
      countQuery = `
        SELECT COUNT(*) as total
        FROM core.customers c
        WHERE c.path <@ (SELECT path FROM core.customers WHERE id = $1)
      `;
      
      params.push(highestRole.customer_id);
      paramCount++;
    }

    // Add search filter
    if (search && search.trim()) {
      const searchParam = `%${search.trim()}%`;
      if (highestRole.role_key === 'waterreportcard_super_admin') {
        query += ` AND (c.name ILIKE $${paramCount + 1} OR c.billing_email ILIKE $${paramCount + 1})`;
        countQuery += ` AND (c.name ILIKE $${paramCount + 1} OR c.billing_email ILIKE $${paramCount + 1})`;
      } else {
        query += ` AND (c.name ILIKE $${paramCount + 1} OR loc_addr.city ILIKE $${paramCount + 1} OR c.billing_email ILIKE $${paramCount + 1})`;
        countQuery += ` AND (c.name ILIKE $${paramCount + 1} OR c.billing_email ILIKE $${paramCount + 1})`;
      }
      params.push(searchParam);
      paramCount++;
    }

    // Add status filter
    if (status && status !== 'all') {
      query += ` AND c.status = $${paramCount + 1}`;
      countQuery += ` AND c.status = $${paramCount + 1}`;
      params.push(status);
      paramCount++;
    }

    // Add parent filter
    if (parent_id && parent_id !== 'null') {
      query += ` AND c.parent_id = $${paramCount + 1}`;
      countQuery += ` AND c.parent_id = $${paramCount + 1}`;
      params.push(parent_id);
      paramCount++;
    }

    // Add grouping and ordering
    query += `
      GROUP BY c.id, c.name, c.status, c.parent_id, c.path, c.hierarchy_level, 
               c.location_name, loc_addr.city, loc_addr.state, loc_addr.line1, 
               ST_Y(loc_addr.location), ST_X(loc_addr.location), c.billing_email, 
               c.contact_1_email, c.created_at, c.updated_at, parent.name
      ORDER BY c.path
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limitNum, offset);

    const [dataResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2)) // Remove limit and offset params
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        customers: dataResult.rows,
        total: total
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
};

// Get single customer details
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    let query;
    let params = [id];

    if (['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      // Platform admin can see any customer
      query = `
        SELECT 
          c.*,
          parent.name as parent_name,
          parent.path as parent_path,
          loc_addr.line1 as location_address_line_1,
          loc_addr.line2 as location_address_line_2,
          loc_addr.city as location_city,
          loc_addr.state as location_state,
          loc_addr.postal_code as location_zip,
          loc_addr.country as location_country,
          loc_addr.pwsid as location_pwsid,
          ST_Y(loc_addr.location) as latitude,
          ST_X(loc_addr.location) as longitude,
          bill_addr.line1 as billing_address_line_1,
          bill_addr.line2 as billing_address_line_2,
          bill_addr.city as billing_city,
          bill_addr.state as billing_state,
          bill_addr.postal_code as billing_zip,
          bill_addr.country as billing_country
        FROM core.customers c
        LEFT JOIN core.customers parent ON parent.id = c.parent_id
        LEFT JOIN core.addresses loc_addr ON loc_addr.id = c.location_address_id
        LEFT JOIN core.addresses bill_addr ON bill_addr.id = c.billing_address_id
        WHERE c.id = $1
      `;
    } else {
      // Other users can only see customers they have access to
      query = `
        SELECT 
          c.*,
          parent.name as parent_name,
          parent.path as parent_path,
          loc_addr.line1 as location_address_line_1,
          loc_addr.line2 as location_address_line_2,
          loc_addr.city as location_city,
          loc_addr.state as location_state,
          loc_addr.postal_code as location_zip,
          loc_addr.country as location_country,
          loc_addr.pwsid as location_pwsid,
          ST_Y(loc_addr.location) as latitude,
          ST_X(loc_addr.location) as longitude,
          bill_addr.line1 as billing_address_line_1,
          bill_addr.line2 as billing_address_line_2,
          bill_addr.city as billing_city,
          bill_addr.state as billing_state,
          bill_addr.postal_code as billing_zip,
          bill_addr.country as billing_country
        FROM core.customers c
        LEFT JOIN core.customers parent ON parent.id = c.parent_id
        LEFT JOIN core.addresses loc_addr ON loc_addr.id = c.location_address_id
        LEFT JOIN core.addresses bill_addr ON bill_addr.id = c.billing_address_id
        WHERE c.id = $1 
          AND c.path <@ (SELECT path FROM core.customers WHERE id = $2)
      `;
      params.push(highestRole.customer_id);
    }

    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or access denied'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    const customerData = req.body;
    
    // Validate required fields
    if (!customerData.name || !customerData.name.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      });
    }

    // Set parent_id based on user's access level
    let parentId = customerData.parent_id;
    
    if (!['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      // Non-platform admins can only create customers under their accessible customers
      if (!parentId) {
        parentId = highestRole.customer_id;
      } else {
        // Verify the parent is accessible
        const parentCheck = await client.query(`
          SELECT id FROM core.customers 
          WHERE id = $1 AND path <@ (SELECT path FROM core.customers WHERE id = $2)
        `, [parentId, highestRole.customer_id]);
        
        if (parentCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            success: false,
            error: 'Access denied to specified parent customer'
          });
        }
      }
    }

    // Create location address if location data is provided
    let locationAddressId = null;
    if (customerData.location_address_line_1 || customerData.location_city || customerData.location_state) {
      locationAddressId = await findOrCreateAddress(client, {
        line1: customerData.location_address_line_1 || null,
        line2: customerData.location_address_line_2 || null,
        city: customerData.location_city || null,
        state: customerData.location_state || null,
        postal_code: customerData.location_zip || null,
        country: customerData.location_country || null,
        pwsid: customerData.location_pwsid || null,
        latitude: customerData.location_latitude || null,
        longitude: customerData.location_longitude || null
      });
    }

    // Create billing address if billing data is provided
    let billingAddressId = null;
    if (customerData.billing_address_line_1 || customerData.billing_city || customerData.billing_state) {
      billingAddressId = await findOrCreateAddress(client, {
        line1: customerData.billing_address_line_1 || null,
        line2: customerData.billing_address_line_2 || null,
        city: customerData.billing_city || null,
        state: customerData.billing_state || null,
        postal_code: customerData.billing_zip || null,
        country: customerData.billing_country || null,
        pwsid: null, // Billing addresses typically don't have PWSID
        latitude: customerData.billing_latitude || null,
        longitude: customerData.billing_longitude || null
      });
    }

    // Create customer with all fields - using dynamic INSERT approach
    const fields = [];
    const values = [];
    const params = [];
    let paramCount = 1;

    // Helper function to add field
    const addField = (fieldName, value, transform = null) => {
      fields.push(fieldName);
      values.push(`$${paramCount}`);
      if (transform && value) {
        params.push(transform(value));
      } else {
        params.push(value || null);
      }
      paramCount++;
    };

    // Add all fields systematically
    addField('name', customerData.name?.trim());
    addField('status', customerData.status || 'active');
    addField('parent_id', parentId);
    
    // Address references
    addField('location_address_id', locationAddressId);
    addField('billing_address_id', billingAddressId);
    
    // Business contact information
    addField('contact_id', customerData.contact_id);
    addField('contact_name', customerData.contact_name);
    addField('sub_contact_name', customerData.sub_contact_name);
    addField('sub_contact_parent_id', customerData.sub_contact_parent_id);
    
    // Location information (non-address fields)
    addField('location_name', customerData.location_name);
    addField('location_region', customerData.location_region);
    addField('location_campus', customerData.location_campus);
    addField('location_building_name', customerData.location_building_name);
    addField('location_route', customerData.location_route);
    addField('location_phone_no', customerData.location_phone_no);
    addField('location_service_zone', customerData.location_service_zone);
    
    // Billing information (non-address fields)
    addField('billing_contact_type', customerData.billing_contact_type);
    addField('billing_address_contact_name', customerData.billing_address_contact_name);
    addField('billing_email', customerData.billing_email);
    addField('billing_contact_note', customerData.billing_contact_note);
    addField('billing_type', customerData.billing_type);
    addField('billing_name', customerData.billing_name);
    addField('hourly_labor_rate', customerData.hourly_labor_rate, parseFloat);
    addField('discount_rate', customerData.discount_rate, parseFloat);
    addField('sales_tax_rate', customerData.sales_tax_rate, parseFloat);
    
    // Contact information
    addField('contact_1_email', customerData.contact_1_email);
    addField('contact_1_first_name', customerData.contact_1_first_name);
    addField('contact_1_last_name', customerData.contact_1_last_name);
    addField('contact_1_direct_line', customerData.contact_1_direct_line);
    addField('contact_1_cell_phone', customerData.contact_1_cell_phone);
    addField('contact_1_title', customerData.contact_1_title);
    addField('contact_1_notes', customerData.contact_1_notes);
    
    addField('contact_2_name', customerData.contact_2_name);
    addField('contact_2_title', customerData.contact_2_title);
    addField('contact_2_direct_line', customerData.contact_2_direct_line);
    addField('contact_2_email', customerData.contact_2_email);
    addField('contact_2_cell', customerData.contact_2_cell);
    addField('contact_2_notes', customerData.contact_2_notes);
    
    // Technical information
    addField('wifi_network_name', customerData.wifi_network_name);
    addField('wifi_password', customerData.wifi_password);
    addField('wifi_admin', customerData.wifi_admin);
    
    // Service provider information
    addField('architect_firm', customerData.architect_firm);
    addField('architect_fax_no', customerData.architect_fax_no);
    addField('maintenance_profile', customerData.maintenance_profile);
    addField('architect_electrical_contractor', customerData.architect_electrical_contractor);
    addField('mntc_con_start_date', customerData.mntc_con_start_date);
    addField('mntc_con_end_date', customerData.mntc_con_end_date);
    addField('elect_foreman', customerData.elect_foreman);
    addField('billing_dept_consultant', customerData.billing_dept_consultant);
    addField('installation_date', customerData.installation_date);
    addField('consultant_cell', customerData.consultant_cell);
    addField('spelling_contractor', customerData.spelling_contractor);
    addField('route_site_supervisor', customerData.route_site_supervisor);
    addField('configuration_type', customerData.configuration_type);
    addField('supervisor_cell', customerData.supervisor_cell);
    addField('site_phone', customerData.site_phone);
    
    // Employee information
    addField('employees_contact_1', customerData.employees_contact_1);
    addField('employees_contact_1_last_name', customerData.employees_contact_1_last_name);
    addField('employees_contact_1_direct_line', customerData.employees_contact_1_direct_line);
    addField('employees_contact_1_cell_phone', customerData.employees_contact_1_cell_phone);
    addField('employees_contact_1_email', customerData.employees_contact_1_email);
    addField('employees_contact_1_title', customerData.employees_contact_1_title);
    addField('employees_key_person', customerData.employees_key_person);
    addField('employees_contact_notes', customerData.employees_contact_notes);
    
    // Additional business fields
    addField('access_key', customerData.access_key);
    addField('email_subscriber', customerData.email_subscriber || false);
    addField('contract_terms', customerData.contract_terms);
    addField('custom_field_custom3', customerData.custom_field_custom3);
    addField('general_notes', customerData.general_notes);
    addField('special_instructions', customerData.special_instructions);
    
    // Lead source and marketing
    addField('referral_lead_source', customerData.referral_lead_source);
    addField('url', customerData.url);

    const query = `
      INSERT INTO core.customers (${fields.join(', ')})
      VALUES (${values.join(', ')})
      RETURNING *
    `;

    const result = await client.query(query, params);
    
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Customer created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating customer:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        error: 'A customer with this name already exists under the same parent'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  } finally {
    client.release();
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    const customerData = req.body;
    
    // Check if user can access this customer
    let accessQuery;
    let accessParams = [id];

    if (!['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      accessQuery = `
        SELECT id FROM core.customers 
        WHERE id = $1 AND path <@ (SELECT path FROM core.customers WHERE id = $2)
      `;
      accessParams.push(highestRole.customer_id);
    } else {
      accessQuery = `SELECT id FROM core.customers WHERE id = $1`;
    }

    const accessResult = await db.query(accessQuery, accessParams);
    
    if (accessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or access denied'
      });
    }

    // Validate required fields
    if (customerData.name && !customerData.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Customer name cannot be empty'
      });
    }

    // Handle address updates if address data is provided
    let locationAddressId = null;
    let billingAddressId = null;
    
    if (customerData.location_address_line_1 || customerData.location_city || customerData.location_state) {
      locationAddressId = await findOrCreateAddress(db, {
        line1: customerData.location_address_line_1 || null,
        line2: customerData.location_address_line_2 || null,
        city: customerData.location_city || null,
        state: customerData.location_state || null,
        postal_code: customerData.location_zip || null,
        country: customerData.location_country || null,
        pwsid: customerData.location_pwsid || null,
        latitude: customerData.location_latitude || null,
        longitude: customerData.location_longitude || null
      });
    }

    if (customerData.billing_address_line_1 || customerData.billing_city || customerData.billing_state) {
      billingAddressId = await findOrCreateAddress(db, {
        line1: customerData.billing_address_line_1 || null,
        line2: customerData.billing_address_line_2 || null,
        city: customerData.billing_city || null,
        state: customerData.billing_state || null,
        postal_code: customerData.billing_zip || null,
        country: customerData.billing_country || null,
        pwsid: null, // Billing addresses typically don't have PWSID
        latitude: customerData.billing_latitude || null,
        longitude: customerData.billing_longitude || null
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const allowedFields = [
      'name', 'status', 'location_name',
      'billing_email', 'contact_1_email', 'contact_1_first_name', 'contact_1_last_name',
      'contact_1_direct_line', 'contact_1_cell_phone', 'contact_1_title',
      'general_notes', 'special_instructions'
    ];

    for (const field of allowedFields) {
      if (customerData[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        updateValues.push(customerData[field]);
      }
    }

    // Add address ID updates if addresses were created/updated
    if (locationAddressId !== null) {
      paramCount++;
      updateFields.push(`location_address_id = $${paramCount}`);
      updateValues.push(locationAddressId);
    }

    if (billingAddressId !== null) {
      paramCount++;
      updateFields.push(`billing_address_id = $${paramCount}`);
      updateValues.push(billingAddressId);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add WHERE clause
    paramCount++;
    updateValues.push(id);

    const query = `
      UPDATE core.customers 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        error: 'A customer with this name already exists under the same parent'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    // Check if user can access this customer
    let accessQuery;
    let accessParams = [id];

    if (!['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      accessQuery = `
        SELECT id FROM core.customers 
        WHERE id = $1 AND path <@ (SELECT path FROM core.customers WHERE id = $2)
      `;
      accessParams.push(highestRole.customer_id);
    } else {
      accessQuery = `SELECT id FROM core.customers WHERE id = $1`;
    }

    const accessResult = await db.query(accessQuery, accessParams);
    
    if (accessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or access denied'
      });
    }

    // Check if customer has children
    const childrenResult = await db.query(`
      SELECT COUNT(*) as count FROM core.customers WHERE parent_id = $1
    `, [id]);

    if (parseInt(childrenResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with child customers. Please delete or move child customers first.'
      });
    }

    // Delete customer
    const result = await db.query(`
      DELETE FROM core.customers WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer because it is referenced by other records'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    });
  }
};

// Get customer descendants
export const getCustomerDescendants = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    // Check if user can access this customer
    let accessQuery;
    let accessParams = [id];

    if (!['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      accessQuery = `
        SELECT id FROM core.customers 
        WHERE id = $1 AND path <@ (SELECT path FROM core.customers WHERE id = $2)
      `;
      accessParams.push(highestRole.customer_id);
    } else {
      accessQuery = `SELECT id FROM core.customers WHERE id = $1`;
    }

    const accessResult = await db.query(accessQuery, accessParams);
    
    if (accessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or access denied'
      });
    }

    const result = await db.query(`
      SELECT * FROM core.get_customer_descendants($1)
      ORDER BY path
    `, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching customer descendants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer descendants'
    });
  }
};

// Get customer ancestors
export const getCustomerAncestors = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const highestRole = getUserHighestRole(currentUser);
    
    if (!highestRole) {
      return res.status(403).json({
        success: false,
        error: 'No active role found'
      });
    }

    // Check if user can access this customer
    let accessQuery;
    let accessParams = [id];

    if (!['waterreportcard_super_admin','liquoslabs_general_manager'].includes(highestRole.role_key)) {
      accessQuery = `
        SELECT id FROM core.customers 
        WHERE id = $1 AND path <@ (SELECT path FROM core.customers WHERE id = $2)
      `;
      accessParams.push(highestRole.customer_id);
    } else {
      accessQuery = `SELECT id FROM core.customers WHERE id = $1`;
    }

    const accessResult = await db.query(accessQuery, accessParams);
    
    if (accessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or access denied'
      });
    }

    const result = await db.query(`
      SELECT * FROM core.get_customer_ancestors($1)
      ORDER BY hierarchy_level
    `, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching customer ancestors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer ancestors'
    });
  }
};
