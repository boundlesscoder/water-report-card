import { db } from '../config/db.js';

/**
 * Dynamic Database Schema Service for Admin Panel
 * Fetches table structures and organizes them for user-friendly management
 */

// Business-friendly field groupings and labels
export const FIELD_GROUPS = {
  // Basic Information
  basic: {
    label: 'Basic Information',
    description: 'Essential details and identification',
    priority: 1
  },
  // Contact & Location
  contact: {
    label: 'Contact & Location',
    description: 'Address, phone, and geographic information',
    priority: 2
  },
  // Financial & Business
  financial: {
    label: 'Financial & Business',
    description: 'Pricing, costs, and business terms',
    priority: 3
  },
  // Technical Specifications
  technical: {
    label: 'Technical Specifications',
    description: 'Equipment specs and technical details',
    priority: 4
  },
  // Maintenance & Service
  maintenance: {
    label: 'Maintenance & Service',
    description: 'Service schedules and maintenance data',
    priority: 5
  },
  // Status & Tracking
  status: {
    label: 'Status & Tracking',
    description: 'Current status and tracking information',
    priority: 6
  },
  // System & Metadata
  system: {
    label: 'System Information',
    description: 'System-generated data and metadata',
    priority: 10
  }
};

// User-friendly field labels and groupings
export const FIELD_MAPPINGS = {
  // Account fields
  'accounts': {
    id: { label: 'Account ID', group: 'system', type: 'uuid', readonly: true },
    name: { label: 'Company Name', group: 'basic', type: 'text', required: true },
    account_number: { label: 'Account Number', group: 'basic', type: 'text', unique: true },
    status: { label: 'Account Status', group: 'status', type: 'select', options: ['active', 'inactive', 'prospect', 'suspended'] },
    tier1_id: { label: 'Customer Type', group: 'basic', type: 'reference', table: 'customer_tier1' },
    tier2_id: { label: 'Customer Category', group: 'basic', type: 'reference', table: 'customer_tier2' },
    tier3_id: { label: 'Customer Subcategory', group: 'basic', type: 'reference', table: 'customer_tier3' },
    billing_address_line1: { label: 'Billing Address', group: 'contact', type: 'text' },
    billing_city: { label: 'Billing City', group: 'contact', type: 'text' },
    billing_state: { label: 'Billing State', group: 'contact', type: 'text' },
    billing_zip: { label: 'Billing ZIP', group: 'contact', type: 'text' },
    billing_email: { label: 'Billing Email', group: 'contact', type: 'email' },
    created_at: { label: 'Created Date', group: 'system', type: 'datetime', readonly: true },
    updated_at: { label: 'Last Updated', group: 'system', type: 'datetime', readonly: true }
  },

  // Location fields
  'locations': {
    id: { label: 'Location ID', group: 'system', type: 'uuid', readonly: true },
    account_id: { label: 'Account', group: 'basic', type: 'reference', table: 'accounts', required: true },
    branch: { label: 'Branch', group: 'basic', type: 'text', required: true },
    location_type: { label: 'Location Type', group: 'basic', type: 'select', options: ['retail_store', 'office', 'plant', 'school', 'hospital'] },
    route_code: { label: 'Service Route', group: 'basic', type: 'text' },
    region: { label: 'Region', group: 'basic', type: 'text' },
    address_id: { label: 'Address', group: 'contact', type: 'reference', table: 'addresses' },
    phone: { label: 'Phone Number', group: 'contact', type: 'phone' },
    hours_of_operation: { label: 'Operating Hours', group: 'basic', type: 'text' },
    days_of_operation: { label: 'Operating Days', group: 'basic', type: 'text' },
    status: { label: 'Location Status', group: 'status', type: 'select', options: ['active', 'inactive', 'under_construction'] },
    created_at: { label: 'Created Date', group: 'system', type: 'datetime', readonly: true },
    updated_at: { label: 'Last Updated', group: 'system', type: 'datetime', readonly: true }
  },

  // Assets fields
  'assets': {
    id: { label: 'Asset ID', group: 'system', type: 'uuid', readonly: true },
    part_id: { label: 'Equipment Type', group: 'basic', type: 'reference', table: 'parts_listing', required: true },
    account_id: { label: 'Customer', group: 'basic', type: 'reference', table: 'accounts', required: true },
    location_id: { label: 'Location', group: 'basic', type: 'reference', table: 'locations' },
    building_id: { label: 'Building', group: 'basic', type: 'reference', table: 'buildings' },
    floor_id: { label: 'Floor', group: 'basic', type: 'reference', table: 'floors' },
    room_id: { label: 'Room', group: 'basic', type: 'reference', table: 'building_rooms' },
    pou_point_id: { label: 'POU Point', group: 'basic', type: 'reference', table: 'pou_points' },
    asset_tag: { label: 'Asset Tag', group: 'basic', type: 'text', unique: true },
    serial_number: { label: 'Serial Number', group: 'basic', type: 'text' },
    installation_date: { label: 'Installation Date', group: 'maintenance', type: 'date' },
    last_maintenance_date: { label: 'Last Service Date', group: 'maintenance', type: 'date' },
    next_maintenance_date: { label: 'Next Service Date', group: 'maintenance', type: 'date' },
    asset_status: { label: 'Asset Status', group: 'status', type: 'select', options: ['active', 'maintenance', 'repair', 'inactive', 'decommissioned'] },
    condition_rating: { label: 'Condition Rating (1-10)', group: 'maintenance', type: 'number', min: 1, max: 10 },
    quantity: { label: 'Quantity', group: 'basic', type: 'number', default: 1 },
    created_at: { label: 'Created Date', group: 'system', type: 'datetime', readonly: true },
    updated_at: { label: 'Last Updated', group: 'system', type: 'datetime', readonly: true }
  },

  // Work Orders fields
  'work_orders': {
    id: { label: 'Work Order ID', group: 'system', type: 'uuid', readonly: true },
    work_order_number: { label: 'Work Order #', group: 'basic', type: 'text', unique: true, required: true },
    title: { label: 'Work Order Title', group: 'basic', type: 'text', required: true },
    description: { label: 'Description', group: 'basic', type: 'textarea' },
    work_type: { label: 'Work Type', group: 'basic', type: 'select', options: ['preventive_maintenance', 'repair', 'emergency', 'inspection', 'replacement'] },
    priority: { label: 'Priority', group: 'status', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    status: { label: 'Status', group: 'status', type: 'select', options: ['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'] },
    assigned_to: { label: 'Assigned Technician', group: 'basic', type: 'reference', table: 'contacts' },
    requested_by: { label: 'Requested By', group: 'basic', type: 'reference', table: 'contacts' },
    scheduled_date: { label: 'Scheduled Date', group: 'maintenance', type: 'date' },
    estimated_duration_hours: { label: 'Estimated Hours', group: 'maintenance', type: 'number' },
    actual_duration_hours: { label: 'Actual Hours', group: 'maintenance', type: 'number' },
    labor_cost: { label: 'Labor Cost', group: 'financial', type: 'currency' },
    parts_cost: { label: 'Parts Cost', group: 'financial', type: 'currency' },
    total_cost: { label: 'Total Cost', group: 'financial', type: 'currency' },
    completion_notes: { label: 'Completion Notes', group: 'maintenance', type: 'textarea' },
    customer_signature: { label: 'Customer Signed', group: 'status', type: 'boolean' },
    created_at: { label: 'Created Date', group: 'system', type: 'datetime', readonly: true },
    updated_at: { label: 'Last Updated', group: 'system', type: 'datetime', readonly: true }
  },

  // Parts Listing fields
  'parts_listing': {
    id: { label: 'Part ID', group: 'system', type: 'uuid', readonly: true },
    manufacturer_id: { label: 'Manufacturer', group: 'basic', type: 'reference', table: 'manufacturers', required: true },
    manufacturer_part_number: { label: 'Manufacturer Part #', group: 'basic', type: 'text', required: true },
    sku: { label: 'SKU', group: 'basic', type: 'text' },
    part_name: { label: 'Part Name', group: 'basic', type: 'text', required: true },
    part_description: { label: 'Description', group: 'basic', type: 'textarea' },
    part_type: { label: 'Part Type', group: 'basic', type: 'select', options: ['filter_system', 'cartridge', 'ice_machine', 'coffee_equipment', 'grinder', 'espresso_machine'] },
    model_number: { label: 'Model Number', group: 'basic', type: 'text' },
    nsf_certified: { label: 'NSF Certified', group: 'technical', type: 'boolean' },
    warranty_months: { label: 'Warranty (Months)', group: 'technical', type: 'number' },
    expected_lifespan_years: { label: 'Expected Lifespan (Years)', group: 'technical', type: 'number' },
    status: { label: 'Part Status', group: 'status', type: 'select', options: ['active', 'discontinued', 'obsolete'] },
    created_at: { label: 'Created Date', group: 'system', type: 'datetime', readonly: true },
    updated_at: { label: 'Last Updated', group: 'system', type: 'datetime', readonly: true }
  },

  // Service Alerts fields
  'service_alerts': {
    id: { label: 'Alert ID', group: 'system', type: 'uuid', readonly: true },
    asset_id: { label: 'Asset', group: 'basic', type: 'reference', table: 'assets' },
    location_id: { label: 'Location', group: 'basic', type: 'reference', table: 'locations' },
    alert_type: { label: 'Alert Type', group: 'basic', type: 'select', options: ['flow_rate', 'pressure', 'tds', 'leak', 'scheduled', 'maintenance'] },
    alert_severity: { label: 'Severity', group: 'status', type: 'select', options: ['info', 'warning', 'critical'] },
    alert_message: { label: 'Alert Message', group: 'basic', type: 'textarea', required: true },
    threshold_value: { label: 'Threshold Value', group: 'technical', type: 'number' },
    actual_value: { label: 'Actual Value', group: 'technical', type: 'number' },
    acknowledged: { label: 'Acknowledged', group: 'status', type: 'boolean', default: false },
    acknowledged_by: { label: 'Acknowledged By', group: 'status', type: 'reference', table: 'contacts_enhanced' },
    acknowledged_at: { label: 'Acknowledged Date', group: 'status', type: 'datetime' },
    work_order_created: { label: 'Work Order Created', group: 'status', type: 'reference', table: 'work_orders' },
    created_at: { label: 'Alert Created', group: 'system', type: 'datetime', readonly: true },
    updated_at: { label: 'Last Updated', group: 'system', type: 'datetime', readonly: true }
  }
};

// Business-friendly table organization
export const BUSINESS_MODULES = {
  customers: {
    label: 'Customer Management',
    icon: 'users',
    description: 'Manage customer accounts, locations, and relationships',
    priority: 1,
    tables: [
      { table: 'accounts', label: 'Customer Accounts', primary: true },
      { table: 'locations', label: 'Customer Locations' },
      { table: 'customer_campuses', label: 'Customer Campuses' },
      { table: 'addresses', label: 'Address Book' },
      { table: 'customer_tier1', label: 'Customer Types' },
      { table: 'customer_tier2', label: 'Customer Categories' },
      { table: 'customer_tier3', label: 'Customer Subcategories' }
    ]
  },
  facilities: {
    label: 'Facility Management',
    icon: 'building',
    description: 'Manage buildings, floors, rooms, and POU points',
    priority: 2,
    tables: [
      { table: 'buildings', label: 'Buildings', primary: true },
      { table: 'floors', label: 'Floors' },
      { table: 'building_rooms', label: 'Rooms' },
      { table: 'pou_points', label: 'POU Points' },
      { table: 'public_access_points', label: 'QR Code Access Points' }
    ]
  },
  equipment: {
    label: 'Equipment & Parts',
    icon: 'cog',
    description: 'Manage equipment catalog, manufacturers, and specifications',
    priority: 3,
    tables: [
      { table: 'parts_listing', label: 'Parts Catalog', primary: true },
      { table: 'manufacturers', label: 'Manufacturers' },
      { table: 'asset_categories', label: 'Equipment Categories' },
      { table: 'cartridge_components', label: 'Filter Cartridges' },
      { table: 'equipment_specifications', label: 'Technical Specifications' },
      { table: 'nsf_certifications', label: 'NSF Certifications' },
      { table: 'part_compatibility', label: 'Part Compatibility' }
    ]
  },
  assets: {
    label: 'Asset Management',
    icon: 'wrench',
    description: 'Track installed equipment and asset lifecycle',
    priority: 4,
    tables: [
      { table: 'assets', label: 'Installed Assets', primary: true },
      { table: 'asset_specifications', label: 'Asset Specifications' },
      { table: 'connected_equipment', label: 'Connected Equipment' },
      { table: 'filter_installations', label: 'Filter Installations' },
      { table: 'installed_cartridges', label: 'Installed Cartridges' },
      { table: 'telemetry_readings', label: 'Equipment Telemetry' }
    ]
  },
  maintenance: {
    label: 'Maintenance & Service',
    icon: 'tools',
    description: 'Manage maintenance schedules, work orders, and service',
    priority: 5,
    tables: [
      { table: 'work_orders', label: 'Work Orders', primary: true },
      { table: 'work_order_tasks', label: 'Work Order Tasks' },
      { table: 'work_order_parts', label: 'Work Order Parts' },
      { table: 'work_order_assets', label: 'Work Order Assets' },
      { table: 'work_order_scopes', label: 'Work Order Scopes' },
      { table: 'maintenance_profiles', label: 'Maintenance Profiles' },
      { table: 'asset_maintenance_profiles', label: 'Asset Maintenance Profiles' },
      { table: 'filter_maintenance_profiles', label: 'Filter Maintenance Profiles' }
    ]
  },
  monitoring: {
    label: 'Monitoring & Quality',
    icon: 'chart-line',
    description: 'Monitor water quality, filter performance, and alerts',
    priority: 6,
    tables: [
      { table: 'service_alerts', label: 'Service Alerts', primary: true },
      { table: 'water_quality_metrics', label: 'Water Quality Data' },
      { table: 'filter_lifespan_tracking', label: 'Filter Lifespan' },
      { table: 'leak_monitoring', label: 'Leak Detection' },
      { table: 'water_filter_projects', label: 'Filter Projects' }
    ]
  },
  vendors: {
    label: 'Vendor Management',
    icon: 'truck',
    description: 'Manage service providers, vendors, and partnerships',
    priority: 7,
    tables: [
      { table: 'vendors', label: 'Vendors & Service Providers', primary: true },
      { table: 'vendor_types', label: 'Vendor Types' },
      { table: 'account_vendor_links', label: 'Customer-Vendor Links' }
    ]
  },
  contacts: {
    label: 'Contact Management',
    icon: 'address-book',
    description: 'Manage contacts, users, and communication',
    priority: 8,
    tables: [
      { table: 'contacts_enhanced', label: 'Enhanced Contacts', primary: true },
      { table: 'contacts', label: 'Basic Contacts' },
      { table: 'contact_memberships', label: 'Contact Memberships' },
      { table: 'user_links', label: 'User Account Links' }
    ]
  }
};

/**
 * Fetch dynamic table schema from database
 */
export async function getTableSchema(tableName) {
  try {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        udt_name
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    const result = await db.query(query, [tableName]);
    
    // Enhance with our field mappings
    const schema = result.rows.map(col => {
      const fieldMapping = FIELD_MAPPINGS[tableName]?.[col.column_name] || {};
      
      return {
        name: col.column_name,
        label: fieldMapping.label || formatFieldLabel(col.column_name),
        type: fieldMapping.type || mapPostgresTypeToUIType(col.data_type, col.udt_name),
        group: fieldMapping.group || inferFieldGroup(col.column_name),
        required: col.is_nullable === 'NO' && !col.column_default,
        readonly: fieldMapping.readonly || col.column_name.endsWith('_at') || col.column_name === 'id',
        maxLength: col.character_maximum_length,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        default: fieldMapping.default || col.column_default,
        options: fieldMapping.options,
        reference: fieldMapping.table ? { table: fieldMapping.table } : null,
        unique: fieldMapping.unique || false,
        min: fieldMapping.min,
        max: fieldMapping.max
      };
    });
    
    return schema;
  } catch (error) {
    console.error(`Error fetching schema for table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get all available tables with metadata
 */
export async function getAllTables() {
  try {
    const query = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
        obj_description(c.oid) as table_comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE '%_backup'
      AND t.table_name NOT LIKE 'staging_%'
      ORDER BY t.table_name
    `;
    
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching table list:', error);
    throw error;
  }
}

/**
 * Get foreign key relationships for a table
 */
export async function getTableRelationships(tableName) {
  try {
    const query = `
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_type
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = $1 
      AND tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
    `;
    
    const result = await db.query(query, [tableName]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching relationships for table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Helper functions
 */

function formatFieldLabel(columnName) {
  return columnName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Id$/, 'ID')
    .replace(/Url$/, 'URL')
    .replace(/Nsf/, 'NSF')
    .replace(/Pou/, 'POU');
}

function mapPostgresTypeToUIType(dataType, udtName) {
  const typeMap = {
    'character varying': 'text',
    'text': 'textarea',
    'integer': 'number',
    'bigint': 'number',
    'numeric': 'number',
    'decimal': 'number',
    'boolean': 'boolean',
    'date': 'date',
    'timestamp with time zone': 'datetime',
    'timestamp without time zone': 'datetime',
    'uuid': 'uuid',
    'json': 'json',
    'jsonb': 'json'
  };
  
  // Handle custom enums
  if (udtName && udtName.endsWith('_enum')) {
    return 'select';
  }
  
  return typeMap[dataType] || 'text';
}

function inferFieldGroup(columnName) {
  const groupPatterns = {
    system: ['id', 'created_at', 'updated_at', 'version'],
    contact: ['phone', 'email', 'address', 'city', 'state', 'zip', 'postal_code', 'country', 'lat', 'lon', 'latitude', 'longitude'],
    financial: ['cost', 'price', 'amount', 'billing', 'payment', 'credit'],
    technical: ['specification', 'capacity', 'rating', 'pressure', 'flow', 'tds', 'nsf', 'model', 'serial'],
    maintenance: ['maintenance', 'service', 'installation', 'replacement', 'lifespan', 'condition'],
    status: ['status', 'active', 'enabled', 'acknowledged', 'priority', 'severity']
  };
  
  const lowerName = columnName.toLowerCase();
  
  for (const [group, patterns] of Object.entries(groupPatterns)) {
    if (patterns.some(pattern => lowerName.includes(pattern))) {
      return group;
    }
  }
  
  return 'basic';
}

/**
 * Get organized business modules with table metadata
 */
export async function getBusinessModules() {
  try {
    const allTables = await getAllTables();
    const tableMetadata = {};
    
    // Create lookup for table metadata
    allTables.forEach(table => {
      tableMetadata[table.table_name] = table;
    });
    
    // Enhance business modules with metadata
    const enhancedModules = {};
    
    for (const [moduleKey, module] of Object.entries(BUSINESS_MODULES)) {
      enhancedModules[moduleKey] = {
        ...module,
        tables: module.tables.map(tableInfo => ({
          ...tableInfo,
          columnCount: tableMetadata[tableInfo.table]?.column_count || 0,
          comment: tableMetadata[tableInfo.table]?.table_comment,
          exists: !!tableMetadata[tableInfo.table]
        })).filter(table => table.exists) // Only include existing tables
      };
    }
    
    return enhancedModules;
  } catch (error) {
    console.error('Error getting business modules:', error);
    throw error;
  }
}

/**
 * Get table data with smart pagination and filtering
 */
export async function getTableData(tableName, options = {}) {
  const {
    page = 1,
    pageSize = 25,
    search = '',
    sortBy = 'created_at',
    sortOrder = 'DESC',
    filters = {}
  } = options;
  
  try {
    const schema = await getTableSchema(tableName);
    const offset = (page - 1) * pageSize;
    
    // Build search conditions
    let searchConditions = '';
    let searchParams = [];
    let paramCount = 0;
    
    if (search) {
      const textFields = schema
        .filter(field => ['text', 'textarea'].includes(field.type) && !field.readonly)
        .map(field => field.name);
      
      if (textFields.length > 0) {
        const searchClauses = textFields.map(field => {
          paramCount++;
          searchParams.push(`%${search}%`);
          return `${field}::text ILIKE $${paramCount}`;
        });
        searchConditions = `WHERE (${searchClauses.join(' OR ')})`;
      }
    }
    
    // Build filter conditions
    let filterConditions = '';
    if (Object.keys(filters).length > 0) {
      const filterClauses = [];
      for (const [field, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') {
          paramCount++;
          searchParams.push(value);
          filterClauses.push(`${field} = $${paramCount}`);
        }
      }
      
      if (filterClauses.length > 0) {
        const connector = searchConditions ? ' AND ' : ' WHERE ';
        filterConditions = connector + filterClauses.join(' AND ');
      }
    }
    
    // Build the query
    const baseQuery = `FROM ${tableName} ${searchConditions}${filterConditions}`;
    
    // Get total count
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await db.query(countQuery, searchParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Get data
    paramCount += 2;
    const dataQuery = `
      SELECT * ${baseQuery}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;
    
    const dataResult = await db.query(dataQuery, [...searchParams, pageSize, offset]);
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      },
      schema
    };
    
  } catch (error) {
    console.error(`Error fetching data for table ${tableName}:`, error);
    throw error;
  }
}

export default {
  getTableSchema,
  getAllTables,
  getTableRelationships,
  getBusinessModules,
  getTableData,
  FIELD_GROUPS,
  FIELD_MAPPINGS,
  BUSINESS_MODULES
};
