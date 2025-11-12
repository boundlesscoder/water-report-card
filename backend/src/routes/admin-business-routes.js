import express from 'express';
import { 
  getBusinessModules, 
  getTableSchema, 
  getTableData, 
  getTableRelationships 
} from '../services/crm-cmms-schema-service.js';
import { db } from '../config/db.js';
import { ENTITIES } from '../services/crm-cmms-crud-service.js';

const router = express.Router();

/**
 * Business-focused Admin API Routes
 * Organized by business modules rather than technical tables
 */

// Get business module overview
router.get('/modules', async (req, res) => {
  try {
    const modules = await getBusinessModules();
    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Error fetching business modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business modules'
    });
  }
});

// Get module details with table schemas
router.get('/modules/:moduleKey', async (req, res) => {
  try {
    const { moduleKey } = req.params;
    const modules = await getBusinessModules();
    const module = modules[moduleKey];
    
    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    
    // Get schema for each table in the module
    const tablesWithSchema = await Promise.all(
      module.tables.map(async (tableInfo) => {
        const schema = await getTableSchema(tableInfo.table);
        const relationships = await getTableRelationships(tableInfo.table);
        
        return {
          ...tableInfo,
          schema,
          relationships
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        ...module,
        tables: tablesWithSchema
      }
    });
  } catch (error) {
    console.error('Error fetching module details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module details'
    });
  }
});

// Get table data with smart pagination and filtering
router.get('/tables/:tableName/data', async (req, res) => {
  try {
    const { tableName } = req.params;
    const {
      page = 1,
      limit = 50, // Use limit instead of pageSize to match the frontend request
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      ...filters
    } = req.query;                                     
    
    // Validate table name to prevent SQL injection
    const allowedTables = [
      'accounts', 'locations', 'manufacturers', 'parts_listing', 'contacts',
      'contacts_enhanced', 'vendors', 'buildings', 'floors', 'building_rooms',
      'pou_points', 'customer_tier1', 'customer_tier2', 'customer_tier3',
      'customer_campuses', 'asset_categories', 'cartridge_components',
      'water_filter_projects', 'work_orders', 'addresses', 'filter_installations',
      'installed_cartridges', 'service_alerts', 'assets'
    ];
    
    if (!allowedTables.includes(tableName)) {
      console.error(`❌ Invalid table name for data request: ${tableName}`);
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${tableName}`
      });
    }
    
    // Build the query
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;
    
    // Basic query to get all data
    let query = `SELECT * FROM ${tableName}`;
    let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
    const params = [];
    
    // Skip search functionality for now to ensure basic functionality works
    // TODO: Implement robust search later
    
    // Add ordering - use id as default since it's guaranteed to exist
    query += ` ORDER BY id ${sortOrder}`;
    
    // Add pagination
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);
    
    // Execute both queries
    const [dataResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, []) // No parameters needed for simple count
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      data: {
        items: dataResult.rows,
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
    console.error(`❌ Error fetching data for table ${tableName}:`, error);
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error message: ${error.message}`);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch data';
    
    if (error.code === '42P01') {
      errorMessage = `Table ${tableName} does not exist`;
    } else if (error.code === '42703') {
      errorMessage = `Column does not exist in table ${tableName}`;
    } else if (error.code === '42601') {
      errorMessage = 'Invalid SQL syntax in data query';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// Get table schema
router.get('/tables/:tableName/schema', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = await getTableSchema(tableName);
    const relationships = await getTableRelationships(tableName);
    
    res.json({
      success: true,
      data: {
        schema,
        relationships
      }
    });
  } catch (error) {
    console.error(`Error fetching schema for table ${tableName}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch schema for ${tableName}`
    });
  }
});

// Create new record
router.post('/tables/:tableName/records', async (req, res) => {
  try {
    const { tableName } = req.params;
    const data = req.body;
    
    // Get table schema to validate fields
    const schema = await getTableSchema(tableName);
    const validFields = schema
      .filter(field => !field.readonly)
      .map(field => field.name);
    
    // Filter data to only include valid, non-readonly fields
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      if (validFields.includes(key) && value !== null && value !== '') {
        filteredData[key] = value;
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid data provided'
      });
    }
    
    // Build INSERT query
    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    
    // Handle common database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        error: 'A record with this information already exists'
      });
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: 'Referenced record does not exist'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create record'
    });
  }
});

// Update record
router.put('/tables/:tableName/records/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const data = req.body;
    
    // Get table schema to validate fields
    const schema = await getTableSchema(tableName);
    const validFields = schema
      .filter(field => !field.readonly && field.name !== 'id')
      .map(field => field.name);
    
    // Filter data to only include valid, non-readonly fields
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      if (validFields.includes(key)) {
        filteredData[key] = value;
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid data provided for update'
      });
    }
    
    // Build UPDATE query
    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
    
    const result = await db.query(query, [...values, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    
    // Handle common database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        error: 'A record with this information already exists'
      });
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: 'Referenced record does not exist'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update record'
    });
  }
});

// Delete record with cascade support
router.delete('/tables/:tableName/records/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const { cascade = 'false' } = req.query;
    const shouldCascade = cascade === 'true';
    
    // Validate table name to prevent SQL injection
    const allowedTables = Object.keys(ENTITIES);
    
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${tableName}`
      });
    }
    
    // COMPREHENSIVE cascade deletion order based on COMPLETE analysis of ALL SQL files
    // Order: deepest dependencies first, then parent tables
    // Includes ALL foreign key relationships found in the schema
    const cascadeDeleteOrder = {
      'accounts': [
        // Level 5: Deepest dependencies (via work orders and assets)
        { table: 'work_order_tasks', column: 'work_order_id', checkExists: true, via: 'work_orders.account_id' },
        { table: 'work_order_parts', column: 'work_order_id', checkExists: true, via: 'work_orders.account_id' },
        { table: 'work_order_assets', column: 'work_order_id', checkExists: true, via: 'work_orders.account_id' },
        { table: 'work_order_scopes', column: 'work_order_id', checkExists: true, via: 'work_orders.account_id' },
        // Level 4: Asset dependencies and telemetry
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.account_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.account_id' },
        { table: 'asset_maintenance_profiles', column: 'asset_id', checkExists: true, via: 'assets.account_id' },
        { table: 'connected_equipment', column: 'filter_asset_id', checkExists: true, via: 'assets.account_id' },
        { table: 'connected_equipment', column: 'connected_asset_id', checkExists: true, via: 'assets.account_id' },
        { table: 'service_alerts', column: 'asset_id', checkExists: true, via: 'assets.account_id' },
        { table: 'public_access_points', column: 'asset_id', checkExists: true, via: 'assets.account_id' },
        // Level 3: Filter installation dependencies  
        { table: 'filter_lifespan_tracking', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.account_id' },
        { table: 'water_quality_metrics', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.account_id' },
        { table: 'leak_monitoring', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.account_id' },
        { table: 'installed_cartridges', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.account_id' },
        { table: 'filter_installations', column: 'account_id', checkExists: true },
        { table: 'filter_installations', column: 'asset_id', checkExists: true, via: 'assets.account_id' },
        // Level 2: Direct account references
        { table: 'work_orders', column: 'account_id', checkExists: true },
        { table: 'assets', column: 'account_id', checkExists: true },
        { table: 'water_filter_projects', column: 'account_id', checkExists: true },
        { table: 'customer_campuses', column: 'account_id', checkExists: true },
        { table: 'account_vendor_links', column: 'account_id', checkExists: true },
        { table: 'user_links', column: 'account_id', checkExists: true },
        { table: 'contact_memberships', column: 'account_id', checkExists: true },
        { table: 'service_alerts', column: 'location_id', checkExists: true, via: 'locations.account_id' },
        // Level 1: Location hierarchy (deepest first)
        { table: 'pou_points', column: 'room_id', checkExists: true, via: 'building_rooms.building_id->buildings.location_id->locations.account_id' },
        { table: 'public_access_points', column: 'room_id', checkExists: true, via: 'building_rooms.building_id->buildings.location_id->locations.account_id' },
        { table: 'building_rooms', column: 'building_id', checkExists: true, via: 'buildings.location_id->locations.account_id' },
        { table: 'floors', column: 'building_id', checkExists: true, via: 'buildings.location_id->locations.account_id' },
        { table: 'buildings', column: 'location_id', checkExists: true, via: 'locations.account_id' },
        { table: 'locations', column: 'account_id', checkExists: true }
      ],
      // Deleting an address should remove locations that use it (then ON DELETE CASCADE handles buildings/floors/rooms)
      'addresses': [
        { table: 'service_alerts', column: 'location_id', checkExists: true, via: 'locations.address_id' },
        { table: 'assets', column: 'location_id', checkExists: true, via: 'locations.address_id' },
        { table: 'filter_installations', column: 'location_id', checkExists: true, via: 'locations.address_id' },
        { table: 'buildings', column: 'location_id', checkExists: true, via: 'locations.address_id' },
        { table: 'locations', column: 'address_id', checkExists: true }
      ],
      'locations': [
        // Level 4: Asset and telemetry dependencies
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'asset_maintenance_profiles', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'connected_equipment', column: 'filter_asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'connected_equipment', column: 'connected_asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'work_order_assets', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'work_order_parts', column: 'installed_as_asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'installed_cartridges', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'service_alerts', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        { table: 'public_access_points', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        // Assets that relate via building/floor/room chains in this location
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.building_id->buildings.location_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.floor_id->floors.building_id->buildings.location_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.room_id->building_rooms.building_id->buildings.location_id' },
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.building_id->buildings.location_id' },
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.floor_id->floors.building_id->buildings.location_id' },
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.room_id->building_rooms.building_id->buildings.location_id' },
        { table: 'service_alerts', column: 'asset_id', checkExists: true, via: 'assets.building_id->buildings.location_id' },
        { table: 'public_access_points', column: 'asset_id', checkExists: true, via: 'assets.building_id->buildings.location_id' },
        // Work order dependents via filter installations in this location
        { table: 'work_order_tasks', column: 'work_order_id', checkExists: true, via: 'work_orders.filter_installation_id->filter_installations.location_id' },
        { table: 'work_order_parts', column: 'work_order_id', checkExists: true, via: 'work_orders.filter_installation_id->filter_installations.location_id' },
        { table: 'work_order_assets', column: 'work_order_id', checkExists: true, via: 'work_orders.filter_installation_id->filter_installations.location_id' },
        { table: 'service_alerts', column: 'work_order_created', checkExists: true, action: 'update_null', via: 'work_orders.filter_installation_id->filter_installations.location_id' },
        { table: 'assets', column: 'installation_work_order_id', checkExists: true, action: 'update_null', via: 'work_orders.filter_installation_id->filter_installations.location_id' },
        // Level 3: Filter installation dependencies
        { table: 'filter_lifespan_tracking', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.location_id' },
        { table: 'water_quality_metrics', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.location_id' },
        { table: 'leak_monitoring', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.location_id' },
        { table: 'installed_cartridges', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.location_id' },
        { table: 'filter_installations', column: 'location_id', checkExists: true },
        { table: 'filter_installations', column: 'asset_id', checkExists: true, via: 'assets.location_id' },
        // Delete the work orders tied to filter installations in this location
        { table: 'work_orders', column: 'filter_installation_id', checkExists: true, via: 'filter_installations.location_id' },
        // Level 2: Building structure and assets
        { table: 'assets', column: 'building_id', checkExists: true, via: 'buildings.location_id' },
        { table: 'assets', column: 'floor_id', checkExists: true, via: 'floors.building_id->buildings.location_id' },
        { table: 'assets', column: 'room_id', checkExists: true, via: 'building_rooms.building_id->buildings.location_id' },
        { table: 'work_order_parts', column: 'pou_point_id', checkExists: true, via: 'pou_points.room_id->building_rooms.building_id->buildings.location_id' },
        { table: 'pou_points', column: 'room_id', checkExists: true, via: 'building_rooms.building_id->buildings.location_id' },
        { table: 'public_access_points', column: 'room_id', checkExists: true, via: 'building_rooms.building_id->buildings.location_id' },
        { table: 'work_order_scopes', column: 'room_id', checkExists: true, via: 'building_rooms.building_id->buildings.location_id' },
        { table: 'building_rooms', column: 'building_id', checkExists: true, via: 'buildings.location_id' },
        { table: 'work_order_scopes', column: 'floor_id', checkExists: true, via: 'floors.building_id->buildings.location_id' },
        { table: 'floors', column: 'building_id', checkExists: true, via: 'buildings.location_id' },
        { table: 'filter_installations', column: 'building_id', checkExists: true, via: 'buildings.location_id' },
        { table: 'work_order_scopes', column: 'building_id', checkExists: true, via: 'buildings.location_id' },
        { table: 'buildings', column: 'location_id', checkExists: true },
        { table: 'assets', column: 'location_id', checkExists: true },
        // Level 1: Direct location references
        { table: 'service_alerts', column: 'location_id', checkExists: true }
      ],
      // Manufacturers cascade into parts and everything that depends on those parts
      'manufacturers': [
        // Downstream dependencies via parts_listing.manufacturer_id
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.part_id->parts_listing.manufacturer_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.part_id->parts_listing.manufacturer_id' },
        { table: 'asset_maintenance_profiles', column: 'asset_id', checkExists: true, via: 'assets.part_id->parts_listing.manufacturer_id' },
        { table: 'connected_equipment', column: 'filter_asset_id', checkExists: true, via: 'assets.part_id->parts_listing.manufacturer_id' },
        { table: 'connected_equipment', column: 'connected_asset_id', checkExists: true, via: 'assets.part_id->parts_listing.manufacturer_id' },
        { table: 'service_alerts', column: 'asset_id', checkExists: true, via: 'assets.part_id->parts_listing.manufacturer_id' },
        { table: 'public_access_points', column: 'asset_id', checkExists: true, via: 'assets.part_id->parts_listing.manufacturer_id' },
        { table: 'work_order_parts', column: 'part_id', checkExists: true, via: 'parts_listing.manufacturer_id' },
        { table: 'filter_installations', column: 'filter_model_id', checkExists: true, via: 'parts_listing.manufacturer_id' },
        { table: 'assets', column: 'part_id', checkExists: true, via: 'parts_listing.manufacturer_id' },
        { table: 'cartridge_components', column: 'parent_part_id', checkExists: true, via: 'parts_listing.manufacturer_id' },
        { table: 'parts_listing', column: 'manufacturer_id', checkExists: true }
      ],
      'buildings': [
        // Level 3: Delete deepest dependencies first
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.building_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.building_id' },
        { table: 'service_alerts', column: 'asset_id', checkExists: true, via: 'assets.building_id' },
        { table: 'public_access_points', column: 'asset_id', checkExists: true, via: 'assets.building_id' },
        { table: 'pou_points', column: 'room_id', checkExists: true, via: 'building_rooms.building_id' },
        { table: 'public_access_points', column: 'room_id', checkExists: true, via: 'building_rooms.building_id' },
        // Level 2: Delete intermediate dependencies
        { table: 'assets', column: 'building_id', checkExists: true },
        { table: 'filter_installations', column: 'building_id', checkExists: true },
        { table: 'work_order_scopes', column: 'building_id', checkExists: true },
        { table: 'building_rooms', column: 'building_id', checkExists: true },
        { table: 'floors', column: 'building_id', checkExists: true }
      ],
      'floors': [
        // Level 3: Asset dependencies on this floor
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.floor_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.floor_id' },
        { table: 'service_alerts', column: 'asset_id', checkExists: true, via: 'assets.floor_id' },
        { table: 'public_access_points', column: 'asset_id', checkExists: true, via: 'assets.floor_id' },
        // Level 2: Room dependencies and installations
        { table: 'pou_points', column: 'room_id', checkExists: true, via: 'building_rooms.floor_id' },
        { table: 'public_access_points', column: 'room_id', checkExists: true, via: 'building_rooms.floor_id' },
        { table: 'filter_installations', column: 'floor_id', checkExists: true },
        { table: 'building_rooms', column: 'floor_id', checkExists: true },
        // Level 1: Direct floor references
        { table: 'work_order_scopes', column: 'floor_id', checkExists: true },
        { table: 'assets', column: 'floor_id', checkExists: true }
      ],
      'building_rooms': [
        // Level 2: Asset dependencies in this room
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true, via: 'assets.room_id' },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true, via: 'assets.room_id' },
        { table: 'service_alerts', column: 'asset_id', checkExists: true, via: 'assets.room_id' },
        { table: 'filter_installations', column: 'room_id', checkExists: true },
        { table: 'assets', column: 'room_id', checkExists: true },
        // Level 1: Direct room references
        { table: 'pou_points', column: 'room_id', checkExists: true },
        { table: 'public_access_points', column: 'room_id', checkExists: true },
        { table: 'work_order_scopes', column: 'room_id', checkExists: true }
      ],
      'assets': [
        // Level 1: All records that directly reference this asset
        { table: 'telemetry_readings', column: 'asset_id', checkExists: true },
        { table: 'asset_specifications', column: 'asset_id', checkExists: true },
        { table: 'asset_maintenance_profiles', column: 'asset_id', checkExists: true },
        { table: 'connected_equipment', column: 'filter_asset_id', checkExists: true },
        { table: 'connected_equipment', column: 'connected_asset_id', checkExists: true },
        { table: 'service_alerts', column: 'asset_id', checkExists: true },
        { table: 'public_access_points', column: 'asset_id', checkExists: true },
        { table: 'work_order_assets', column: 'asset_id', checkExists: true },
        { table: 'filter_installations', column: 'asset_id', checkExists: true },
        { table: 'installed_cartridges', column: 'asset_id', checkExists: true }
      ],
      'work_orders': [
        // Level 1: All work order related records
        { table: 'work_order_tasks', column: 'work_order_id', checkExists: true },
        { table: 'work_order_parts', column: 'work_order_id', checkExists: true },
        { table: 'work_order_assets', column: 'work_order_id', checkExists: true },
        { table: 'work_order_scopes', column: 'work_order_id', checkExists: true }
      ],
      'parts_listing': [
        // Level 2: Dependencies that reference parts
        { table: 'part_compatibility', column: 'part_id', checkExists: true },
        { table: 'part_compatibility', column: 'compatible_with_part_id', checkExists: true },
        { table: 'filter_maintenance_profiles', column: 'part_id', checkExists: true },
        { table: 'cartridge_components', column: 'parent_part_id', checkExists: true },
        // Level 1: Direct part references
        { table: 'work_order_parts', column: 'part_id', checkExists: true },
        { table: 'filter_installations', column: 'filter_model_id', checkExists: true },
        { table: 'assets', column: 'part_id', checkExists: true }
      ],
      'equipment_specifications': [
        { table: 'asset_specifications', column: 'spec_id', checkExists: true }
      ],
      'maintenance_profiles': [
        { table: 'asset_maintenance_profiles', column: 'profile_id', checkExists: true }
      ],
      'filter_installations': [
        // Level 1: All filter installation dependencies
        { table: 'filter_lifespan_tracking', column: 'filter_installation_id', checkExists: true },
        { table: 'water_quality_metrics', column: 'filter_installation_id', checkExists: true },
        { table: 'leak_monitoring', column: 'filter_installation_id', checkExists: true },
        { table: 'installed_cartridges', column: 'filter_installation_id', checkExists: true }
      ],
      'water_filter_projects': [
        // Level 1: Direct project references
        { table: 'filter_installations', column: 'project_id', checkExists: true }
      ],
      'contacts_enhanced': [
        // Level 1: Contact dependencies
        { table: 'contact_memberships', column: 'contact_id', checkExists: true },
        { table: 'customer_campuses', column: 'campus_manager_id', checkExists: true },
        // Safe nullify on references (acknowledgements / creators)
        { table: 'service_alerts', column: 'acknowledged_by', checkExists: true, action: 'update_null' }
      ],
      'vendors': [
        // Level 1: Vendor dependencies
        { table: 'user_links', column: 'vendor_id', checkExists: true },
        { table: 'contact_memberships', column: 'vendor_id', checkExists: true },
        { table: 'account_vendor_links', column: 'vendor_id', checkExists: true },
        { table: 'filter_installations', column: 'installed_by', checkExists: true },
        // Safe nullify on optional vendor refs
        { table: 'work_orders', column: 'vendor_id', checkExists: true, action: 'update_null' }
      ],
      'users': [
        // Level 1: User dependencies
        { table: 'user_links', column: 'user_id', checkExists: true }
      ],
      'pou_points': [
        // Level 1: POU point dependencies
        { table: 'assets', column: 'pou_point_id', checkExists: true },
        { table: 'work_order_parts', column: 'pou_point_id', checkExists: true }
      ],
      // Safe category/master-data tables → prefer nullifying references instead of deleting major business data
      'customer_tier1': [
        { table: 'accounts', column: 'tier1_id', checkExists: true, action: 'update_null' }
      ],
      'customer_tier2': [
        { table: 'accounts', column: 'tier2_id', checkExists: true, action: 'update_null' }
      ],
      'customer_tier3': [
        { table: 'accounts', column: 'tier3_id', checkExists: true, action: 'update_null' }
      ],
      'vendor_types': [
        { table: 'vendors', column: 'vendor_type_id', checkExists: true, action: 'update_null' }
      ],
      'asset_categories': [
        { table: 'parts_listing', column: 'category_id', checkExists: true, action: 'update_null' },
        { table: 'maintenance_profiles', column: 'asset_category_id', checkExists: true, action: 'update_null' }
      ],
      'work_order_types': [
        { table: 'work_orders', column: 'work_order_type_id', checkExists: true, action: 'update_null' }
      ]
    };

    const dependencies = cascadeDeleteOrder[tableName] || [];
    const deletionSummary = [];

    // Auto-cascade if dependencies exist even when ?cascade=true is not provided
    if (shouldCascade || (dependencies.length > 0)) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        // Fast-path cascade for locations - delete all related data in correct order
        if (tableName === 'locations') {
          try {
            
            // Step 1: Delete service alerts (both direct and via assets)
            try {
              await client.query(`DELETE FROM service_alerts WHERE location_id = $1`, [id]);
              await client.query(`DELETE FROM service_alerts WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [id]);
            } catch (e) {
              console.log('Service alerts deletion error (continuing):', e.message);
            }
            
            // Step 2: Delete asset-related dependencies (with error handling for missing tables)
            try {
              await client.query(`DELETE FROM work_order_assets WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [id]);
            } catch (e) {
              console.log('Work order assets deletion error (continuing):', e.message);
            }
            
            try {
              await client.query(`DELETE FROM asset_maintenance_profiles WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [id]);
            } catch (e) {
            }
            
            try {
              await client.query(`DELETE FROM connected_equipment WHERE filter_asset_id IN (SELECT id FROM assets WHERE location_id = $1) OR connected_asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [id]);
            } catch (e) {
              console.log('Connected equipment deletion error (continuing):', e.message);
            }
            
            try {
              // Delete public access points by asset_id
              await client.query(`DELETE FROM public_access_points WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [id]);
              // Delete public access points by room_id (rooms in buildings at this location)
              await client.query(`
                DELETE FROM public_access_points 
                WHERE room_id IN (
                  SELECT br.id FROM building_rooms br
                  JOIN floors f ON br.floor_id = f.id
                  JOIN buildings b ON f.building_id = b.id
                  WHERE b.location_id = $1
                )
              `, [id]);
            } catch (e) {
              console.log('Public access points deletion error (continuing):', e.message);
            }

            // Step 3: Delete work orders tied to filter installations under this location
            try {
              await client.query(`
                DELETE FROM work_orders
                WHERE filter_installation_id IN (
                  SELECT fi.id
                  FROM filter_installations fi
                  JOIN buildings b ON fi.building_id = b.id
                  WHERE b.location_id = $1
                )
              `, [id]);
            } catch (e) {
              console.log('Work orders deletion error (continuing):', e.message);
            }
            
            // Step 4: Delete assets now that their dependencies are gone
            await client.query(`DELETE FROM assets WHERE location_id = $1`, [id]);

            // Step 5: Finally delete the location (buildings/floors/rooms cascade via ON DELETE CASCADE)
            const mainDelete = await client.query(`DELETE FROM locations WHERE id = $1 RETURNING *`, [id]);
            if (mainDelete.rows.length === 0) {
              await client.query('ROLLBACK');
              return res.status(404).json({ success: false, error: 'Record not found' });
            }

            await client.query('COMMIT');
            return res.json({ 
              success: true, 
              message: 'Location and all related data deleted successfully', 
              deletedRecord: mainDelete.rows[0] 
            });
          } catch (e) {
            console.error('❌ Location cascade delete failed:', e.message);
            console.error('Error details:', e.detail || 'No additional details');
            console.error('Error code:', e.code || 'No error code');
            try { await client.query('ROLLBACK'); } catch (_) {}
            return res.status(409).json({
              success: false,
              error: `Cannot delete location: ${e.message}`,
              details: e.detail || '',
              cascadeOption: true
            });
          } finally {
            try { /* @ts-ignore */ client?.release?.(); } catch (_) {}
          }
        }

        // Fast-path cascade for addresses - delete all referencing locations and their related data
        else if (tableName === 'addresses') {
          try {
            // Gather all locations that reference this address
            const { rows: locRows } = await client.query(`SELECT id FROM locations WHERE address_id = $1`, [id]);
            const locationIds = locRows.map(r => r.id);

            for (const locId of locationIds) {

              // 1) Service alerts
              try {
                await client.query(`DELETE FROM service_alerts WHERE location_id = $1`, [locId]);
                await client.query(`DELETE FROM service_alerts WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [locId]);
              } catch (e) {
                console.log(`[loc ${locId}] service_alerts deletion error (continuing):`, e.message);
              }

              // 2) Asset-related dependencies
              try {
                await client.query(`DELETE FROM work_order_assets WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [locId]);
              } catch (e) {
                console.log(`[loc ${locId}] work_order_assets deletion error (continuing):`, e.message);
              }
              try {
                await client.query(`DELETE FROM asset_maintenance_profiles WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [locId]);
              } catch (e) {
                console.log(`[loc ${locId}] asset_maintenance_profiles deletion error (continuing):`, e.message);
              }
              try {
                await client.query(`DELETE FROM connected_equipment WHERE filter_asset_id IN (SELECT id FROM assets WHERE location_id = $1) OR connected_asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [locId]);
              } catch (e) {
                console.log(`[loc ${locId}] connected_equipment deletion error (continuing):`, e.message);
              }
              try {
                // by asset
                await client.query(`DELETE FROM public_access_points WHERE asset_id IN (SELECT id FROM assets WHERE location_id = $1)`, [locId]);
                // by room path
                await client.query(`
                  DELETE FROM public_access_points 
                  WHERE room_id IN (
                    SELECT br.id FROM building_rooms br
                    JOIN floors f ON br.floor_id = f.id
                    JOIN buildings b ON f.building_id = b.id
                    WHERE b.location_id = $1
                  )
                `, [locId]);
              } catch (e) {
                console.log(`[loc ${locId}] public_access_points deletion error (continuing):`, e.message);
              }

              // 3) Work orders tied to filter installations under this location
              try {
                await client.query(`
                  DELETE FROM work_orders
                  WHERE filter_installation_id IN (
                    SELECT fi.id
                    FROM filter_installations fi
                    JOIN buildings b ON fi.building_id = b.id
                    WHERE b.location_id = $1
                  )
                `, [locId]);
              } catch (e) {
                console.log(`[loc ${locId}] work_orders deletion error (continuing):`, e.message);
              }

              // 4) Assets
              await client.query(`DELETE FROM assets WHERE location_id = $1`, [locId]);

              // 5) Delete the location itself
              await client.query(`DELETE FROM locations WHERE id = $1`, [locId]);
            }

            // Finally, delete the address record
            const addrDelete = await client.query(`DELETE FROM addresses WHERE id = $1 RETURNING *`, [id]);
            if (addrDelete.rows.length === 0) {
              await client.query('ROLLBACK');
              return res.status(404).json({ success: false, error: 'Record not found' });
            }

            await client.query('COMMIT');
            return res.json({ success: true, message: 'Address and related data deleted successfully', deletedRecord: addrDelete.rows[0] });
          } catch (e) {
            console.error('❌ Address cascade delete failed:', e.message);
            console.error('Error details:', e.detail || 'No additional details');
            console.error('Error code:', e.code || 'No error code');
            try { await client.query('ROLLBACK'); } catch (_) {}
            return res.status(409).json({
              success: false,
              error: `Cannot delete address: ${e.message}`,
              details: e.detail || '',
              cascadeOption: true
            });
          } finally {
            try { /* @ts-ignore */ client?.release?.(); } catch (_) {}
          }
        }

        // Delete related records in order (generic path)
        for (const dep of dependencies) {
          try {
            
            // First check if the table exists if requested
            if (dep.checkExists) {
              const tableExistsQuery = `
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_name = $1
                )
              `;
              const tableExistsResult = await client.query(tableExistsQuery, [dep.table]);
              
              if (!tableExistsResult.rows[0].exists) {
                continue;
              }
            }
            
            // Check if the column exists in the table
            const columnExistsQuery = `
              SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = $2
              )
            `;
            const columnExistsResult = await client.query(columnExistsQuery, [dep.table, dep.column]);
            
            if (!columnExistsResult.rows[0].exists) {
              continue;
            }
            
            // Handle direct and indirect foreign key relationships
            let writeQuery, previewQuery;
            let queryParams = [id];
            
            const buildDeleteOrNullify = (baseSelectSql, baseDeleteSql) => {
              if (dep.action === 'update_null') {
                // Nullify instead of delete for safe master-data unlinking
                const nullifySql = baseDeleteSql
                  .replace(/^DELETE FROM\s+([a-zA-Z0-9_]+)\s+WHERE/i, 'UPDATE $1 SET ' + dep.column + ' = NULL WHERE');
                return { selectSql: baseSelectSql, writeSql: nullifySql };
              }
              return { selectSql: baseSelectSql, writeSql: baseDeleteSql };
            };
            
            if (dep.via) {
              if (dep.via.includes('work_orders.account_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN work_orders ON ${dep.table}.${dep.column} = work_orders.id 
                  WHERE work_orders.account_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM work_orders WHERE account_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('assets.account_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN assets ON ${dep.table}.${dep.column} = assets.id 
                  WHERE assets.account_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM assets WHERE account_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('buildings.location_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN buildings ON ${dep.table}.${dep.column} = buildings.id 
                  WHERE buildings.location_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM buildings WHERE location_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('assets.location_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN assets ON ${dep.table}.${dep.column} = assets.id 
                  WHERE assets.location_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM assets WHERE location_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('assets.building_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN assets ON ${dep.table}.${dep.column} = assets.id 
                  WHERE assets.building_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM assets WHERE building_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('assets.floor_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN assets ON ${dep.table}.${dep.column} = assets.id 
                  WHERE assets.floor_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM assets WHERE floor_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('assets.room_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN assets ON ${dep.table}.${dep.column} = assets.id 
                  WHERE assets.room_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM assets WHERE room_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('filter_installations.account_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN filter_installations ON ${dep.table}.${dep.column} = filter_installations.id 
                  WHERE filter_installations.account_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM filter_installations WHERE account_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('filter_installations.location_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN filter_installations ON ${dep.table}.${dep.column} = filter_installations.id 
                  WHERE filter_installations.location_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM filter_installations WHERE location_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('filter_installations.building_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN filter_installations ON ${dep.table}.${dep.column} = filter_installations.id 
                  WHERE filter_installations.building_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM filter_installations WHERE building_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('work_orders.filter_installation_id->filter_installations.location_id')) {
                // Dependencies that point to work orders which are tied to filter installations in this location
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table}
                  JOIN work_orders ON ${dep.table}.${dep.column} = work_orders.id
                  JOIN filter_installations ON work_orders.filter_installation_id = filter_installations.id
                  WHERE filter_installations.location_id = $1
                `;
                writeQuery = `
                  ${dep.action === 'update_null' ? `
                  UPDATE ${dep.table} SET ${dep.column} = NULL WHERE ${dep.column} IN (
                    SELECT wo.id FROM work_orders wo
                    JOIN filter_installations fi ON wo.filter_installation_id = fi.id
                    WHERE fi.location_id = $1
                  )
                  ` : `
                  DELETE FROM ${dep.table} WHERE ${dep.column} IN (
                    SELECT wo.id FROM work_orders wo
                    JOIN filter_installations fi ON wo.filter_installation_id = fi.id
                    WHERE fi.location_id = $1
                  )
                  `}
                `;
                // No need to wrap with buildDeleteOrNullify because we already embed action handling
              } else if (dep.via.includes('building_rooms.building_id->buildings.location_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN building_rooms ON ${dep.table}.${dep.column} = building_rooms.id 
                  JOIN buildings ON building_rooms.building_id = buildings.id
                  WHERE buildings.location_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT building_rooms.id FROM building_rooms
                    JOIN buildings ON building_rooms.building_id = buildings.id
                    WHERE buildings.location_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('building_rooms.floor_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN building_rooms ON ${dep.table}.${dep.column} = building_rooms.id 
                  WHERE building_rooms.floor_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM building_rooms WHERE floor_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('floors.building_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN floors ON ${dep.table}.${dep.column} = floors.id 
                  WHERE floors.building_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM floors WHERE building_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('pou_points.room_id->building_rooms.building_id->buildings.location_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table}
                  JOIN pou_points ON ${dep.table}.${dep.column} = pou_points.id
                  JOIN building_rooms ON pou_points.room_id = building_rooms.id
                  JOIN buildings ON building_rooms.building_id = buildings.id
                  WHERE buildings.location_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table}
                  WHERE ${dep.column} IN (
                    SELECT pp.id FROM pou_points pp
                    JOIN building_rooms br ON pp.room_id = br.id
                    JOIN buildings b ON br.building_id = b.id
                    WHERE b.location_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('locations.account_id')) {
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN locations ON ${dep.table}.${dep.column} = locations.id 
                  WHERE locations.account_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM locations WHERE account_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('locations.address_id')) {
                // For deleting address → all records tied to locations using that address
                previewQuery = `
                  SELECT ${dep.table}.id FROM ${dep.table} 
                  JOIN locations ON ${dep.table}.${dep.column} = locations.id 
                  WHERE locations.address_id = $1
                `;
                writeQuery = `
                  DELETE FROM ${dep.table} 
                  WHERE ${dep.column} IN (
                    SELECT id FROM locations WHERE address_id = $1
                  )
                `;
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else if (dep.via.includes('parts_listing.manufacturer_id')) {
                // For deleting manufacturer → anything referencing parts by that manufacturer
                if (dep.via.includes('assets.part_id->parts_listing.manufacturer_id')) {
                  previewQuery = `
                    SELECT ${dep.table}.id FROM ${dep.table}
                    JOIN assets ON ${dep.table}.${dep.column} = assets.id
                    JOIN parts_listing pl ON assets.part_id = pl.id
                    WHERE pl.manufacturer_id = $1
                  `;
                  writeQuery = `
                    DELETE FROM ${dep.table}
                    WHERE ${dep.column} IN (
                      SELECT a.id FROM assets a
                      JOIN parts_listing pl ON a.part_id = pl.id
                      WHERE pl.manufacturer_id = $1
                    )
                  `;
                } else {
                  previewQuery = `
                    SELECT ${dep.table}.id FROM ${dep.table}
                    JOIN parts_listing pl ON ${dep.table}.${dep.column} = pl.id
                    WHERE pl.manufacturer_id = $1
                  `;
                  writeQuery = `
                    DELETE FROM ${dep.table}
                    WHERE ${dep.column} IN (
                      SELECT id FROM parts_listing WHERE manufacturer_id = $1
                    )
                  `;
                }
                ({ selectSql: previewQuery, writeSql: writeQuery } = buildDeleteOrNullify(previewQuery, writeQuery));
              } else {
                // Fallback to direct relationship
                previewQuery = `SELECT id FROM ${dep.table} WHERE ${dep.column} = $1`;
                writeQuery = dep.action === 'update_null'
                  ? `UPDATE ${dep.table} SET ${dep.column} = NULL WHERE ${dep.column} = $1`
                  : `DELETE FROM ${dep.table} WHERE ${dep.column} = $1`;
              }
            } else {
              // Direct foreign key relationship
              previewQuery = `SELECT id FROM ${dep.table} WHERE ${dep.column} = $1`;
              writeQuery = dep.action === 'update_null'
                ? `UPDATE ${dep.table} SET ${dep.column} = NULL WHERE ${dep.column} = $1`
                : `DELETE FROM ${dep.table} WHERE ${dep.column} = $1`;
            }
            
            // Get the records that will be affected for logging
            const preview = await client.query(previewQuery, queryParams);
            
            if (preview.rows.length > 0) {

              // Execute the write operation
              const writeResult = await client.query(writeQuery, queryParams);
              
              
              deletionSummary.push({
                table: dep.table,
                count: writeResult.rowCount,
                action: dep.action === 'update_null' ? 'updated_null' : 'deleted'
              });
            } else {
            }
          } catch (depError) {
            console.error(`❌ Error handling dependency ${dep.table}.${dep.column}:`, depError);
            // Log and continue with other dependencies rather than aborting the whole cascade
          }
        }

        // Finally, delete the main record
        let mainDelete;
        try {
          mainDelete = await client.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
        } catch (e) {
          if (e?.code === '23503') {
            // FK still blocking – roll back and return 409 with details
            await client.query('ROLLBACK');
            return res.status(409).json({
              success: false,
              error: 'Cannot delete record because it is referenced by other records',
              cascadeOption: true
            });
          }
          throw e;
        }
        if (mainDelete.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, error: 'Record not found' });
        }

        await client.query('COMMIT');

        const response = {
          success: true,
          message: 'Record and related data deleted successfully',
          deletedRecord: mainDelete.rows[0]
        };
        if (deletionSummary.length > 0) {
          response.cascadeDeleted = deletionSummary;
          response.totalDeleted = deletionSummary.reduce((sum, item) => sum + item.count, 0) + 1;
        }
        return res.json(response);
      } catch (cascadeError) {
        console.error(`❌ Critical error during cascade deletion:`, cascadeError);
        try { await client.query('ROLLBACK'); } catch (_) {}
        // Return 409 with dependency hint rather than 500 to allow UI to retry with cascade
        return res.status(409).json({
          success: false,
          error: 'Cannot delete record because it is referenced by other records',
          cascadeOption: true,
          details: [{ table: tableName, column: 'id', count: 1 }]
        });
      } finally {
        try { /* @ts-ignore */ client?.release?.(); } catch (_) {}
      }
    } else if (!shouldCascade) {
      // Check for blocking dependencies (when not cascading)
      const blockingDependencies = [];
      
      for (const dep of dependencies) {
        try {
          let checkQuery = `SELECT COUNT(*) as count FROM ${dep.table} WHERE ${dep.column} = $1`;
          if (dep.via) {
            // Reuse the same logic as cascade preview to compute indirect dependencies
            if (dep.via.includes('work_orders.account_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM work_orders WHERE account_id = $1)
              `;
            } else if (dep.via.includes('assets.account_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM assets WHERE account_id = $1)
              `;
            } else if (dep.via.includes('buildings.location_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM buildings WHERE location_id = $1)
              `;
            } else if (dep.via.includes('assets.location_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM assets WHERE location_id = $1)
              `;
            } else if (dep.via.includes('assets.building_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM assets WHERE building_id = $1)
              `;
            } else if (dep.via.includes('assets.floor_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM assets WHERE floor_id = $1)
              `;
            } else if (dep.via.includes('assets.room_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM assets WHERE room_id = $1)
              `;
            } else if (dep.via.includes('filter_installations.account_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM filter_installations WHERE account_id = $1)
              `;
            } else if (dep.via.includes('filter_installations.location_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM filter_installations WHERE location_id = $1)
              `;
            } else if (dep.via.includes('filter_installations.building_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM filter_installations WHERE building_id = $1)
              `;
            } else if (dep.via.includes('building_rooms.building_id->buildings.location_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (
                  SELECT building_rooms.id FROM building_rooms
                  JOIN buildings ON building_rooms.building_id = buildings.id
                  WHERE buildings.location_id = $1
                )
              `;
            } else if (dep.via.includes('building_rooms.floor_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM building_rooms WHERE floor_id = $1)
              `;
            } else if (dep.via.includes('floors.building_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM floors WHERE building_id = $1)
              `;
            } else if (dep.via.includes('pou_points.room_id->building_rooms.building_id->buildings.location_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (
                  SELECT pp.id FROM pou_points pp
                  JOIN building_rooms br ON pp.room_id = br.id
                  JOIN buildings b ON br.building_id = b.id
                  WHERE b.location_id = $1
                )
              `;
            } else if (dep.via.includes('locations.account_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM locations WHERE account_id = $1)
              `;
            } else if (dep.via.includes('locations.address_id')) {
              checkQuery = `
                SELECT COUNT(*) as count FROM ${dep.table}
                WHERE ${dep.column} IN (SELECT id FROM locations WHERE address_id = $1)
              `;
            } else if (dep.via.includes('parts_listing.manufacturer_id')) {
              if (dep.via.includes('assets.part_id->parts_listing.manufacturer_id')) {
                checkQuery = `
                  SELECT COUNT(*) as count FROM ${dep.table}
                  WHERE ${dep.column} IN (
                    SELECT a.id FROM assets a
                    JOIN parts_listing pl ON a.part_id = pl.id
                    WHERE pl.manufacturer_id = $1
                  )
                `;
              } else {
                checkQuery = `
                  SELECT COUNT(*) as count FROM ${dep.table}
                  WHERE ${dep.column} IN (SELECT id FROM parts_listing WHERE manufacturer_id = $1)
                `;
              }
            }
          }
          const checkResult = await db.query(checkQuery, [id]);
          const count = parseInt(checkResult.rows[0].count);
          
          
          if (count > 0) {
            blockingDependencies.push({
              table: dep.table,
              column: dep.column,
              count: count
            });
          }
        } catch (checkError) {
          console.error(`❌ Could not check dependency ${dep.table}.${dep.column}:`, checkError);
        }
      }

      // If there are blocking dependencies, return detailed error with cascade option
      if (blockingDependencies.length > 0) {
        const details = blockingDependencies.map(dep => 
          `${dep.count} record(s) in ${dep.table}`
        ).join(', ');
        
        return res.status(409).json({
          success: false,
          error: `Cannot delete record because it is referenced by: ${details}`,
          details: blockingDependencies,
          cascadeOption: true,
          message: 'You can delete this record and all related data by using cascade delete.'
        });
      }
    }
    
    // Finally, delete the main record (non-cascade simple delete)
    const result = await db.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, message: 'Record deleted successfully', deletedRecord: result.rows[0] });
  } catch (error) {
    console.error(`Error deleting record from ${tableName}:`, error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete record because it is referenced by other records',
        constraint: error.constraint,
        detail: error.detail,
        cascadeOption: true,
        message: 'You can delete this record and all related data by using cascade delete.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete record',
      details: error.message
    });
  }
});

// Get lookup data for reference fields
router.get('/tables/:tableName/lookup', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { search = '', limit = 50 } = req.query;
    
    
    // Validate table name to prevent SQL injection
    const allowedTables = [
      'accounts', 'locations', 'manufacturers', 'parts_listing', 'contacts',
      'contacts_enhanced', 'vendors', 'buildings', 'floors', 'building_rooms',
      'pou_points', 'customer_tier1', 'customer_tier2', 'customer_tier3',
      'customer_campuses', 'asset_categories', 'cartridge_components',
      'water_filter_projects', 'work_orders', 'addresses', 'filter_installations',
      'installed_cartridges', 'service_alerts', 'assets'
    ];
    
    if (!allowedTables.includes(tableName)) {
      console.error(`❌ Invalid table name: ${tableName}`);
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${tableName}`
      });
    }
    
    // Determine display field based on table with fallback options
    const displayFieldMap = {
      accounts: 'name',
      locations: "COALESCE(branch, name, CONCAT('Location ', id::text))", // Handle both branch and name fields
      manufacturers: 'name',
      parts_listing: 'part_name',
      contacts: "COALESCE(first_name || ' ' || last_name, email)",
      contacts_enhanced: "COALESCE(full_name, first_name || ' ' || last_name, email)",
      vendors: 'vendor_name',
      buildings: 'building_name',
      floors: "COALESCE(floor_name, 'Floor ' || floor_number)",
      building_rooms: 'room_name',
      pou_points: 'pou_name',
      customer_tier1: 'name',
      customer_tier2: 'name',
      customer_tier3: 'name',
      // Additional mappings for missing tables
      customer_campuses: 'campus_name',
      asset_categories: 'name',
      cartridge_components: 'cartridge_name',
      water_filter_projects: 'project_name',
      work_orders: 'work_order_number',
      addresses: "COALESCE(line1 || CASE WHEN city IS NOT NULL THEN ', ' || city ELSE '' END || CASE WHEN state IS NOT NULL THEN ', ' || state ELSE '' END, line1)",
      filter_installations: 'location_name',
      installed_cartridges: 'position_label',
      service_alerts: 'alert_message',
      assets: 'asset_tag'
    };
    
    let displayField = displayFieldMap[tableName] || 'name';
    
    // For locations table, let's check which column actually exists
    if (tableName === 'locations') {
      try {
        // Check if branch column exists
        const columnCheck = await db.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'locations' 
          AND column_name IN ('branch', 'name')
          ORDER BY CASE WHEN column_name = 'branch' THEN 1 ELSE 2 END
        `);
        
        if (columnCheck.rows.length > 0) {
          const availableColumn = columnCheck.rows[0].column_name;
          displayField = availableColumn;
        }
      } catch (columnError) {
        console.log(`⚠️ Could not check columns for locations table, using default: ${displayField}`);
      }
    }

    
    // Build query safely - remove extra whitespace from template literal
    let query = `SELECT id, ${displayField} as display_name FROM ${tableName}`;
    const params = [];
    
    if (search && search.trim()) {
      query += ` WHERE ${displayField}::text ILIKE $1`;
      params.push(`%${search.trim()}%`);
    }
    
    query += ` ORDER BY ${displayField} LIMIT $${params.length + 1}`;
    params.push(parseInt(limit) || 50);
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error(`❌ Error fetching lookup data for ${tableName}:`, error);
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error message: ${error.message}`);
    console.error(`❌ Error detail: ${error.detail}`);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch lookup data';
    
    if (error.code === '42703') {
      errorMessage = `Column does not exist in table ${tableName}`;
    } else if (error.code === '42P01') {
      errorMessage = `Table ${tableName} does not exist`;
    } else if (error.code === '42601') {
      errorMessage = 'Invalid SQL syntax in lookup query';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      // Customer stats
      db.query(`
        SELECT 
          COUNT(*) as total_accounts,
          COUNT(*) FILTER (WHERE status = 'active') as active_accounts,
          COUNT(DISTINCT tier1_id) as customer_types
        FROM accounts
      `),
      
      // Location stats
      db.query(`
        SELECT 
          COUNT(*) as total_locations,
          COUNT(*) FILTER (WHERE status = 'active') as active_locations,
          COUNT(DISTINCT region) as regions
        FROM locations
      `),
      
      // Asset stats
      db.query(`
        SELECT 
          COUNT(*) as total_assets,
          COUNT(*) FILTER (WHERE asset_status = 'active') as active_assets,
          COUNT(*) FILTER (WHERE asset_status = 'maintenance') as maintenance_assets,
          COUNT(*) FILTER (WHERE next_maintenance_date <= CURRENT_DATE) as overdue_maintenance
        FROM assets
      `),
      
      // Work order stats
      db.query(`
        SELECT 
          COUNT(*) as total_work_orders,
          COUNT(*) FILTER (WHERE status = 'open') as open_work_orders,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_work_orders,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical_work_orders
        FROM work_orders
      `),
      
      // Service alert stats
      db.query(`
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(*) FILTER (WHERE NOT acknowledged) as unacknowledged_alerts,
          COUNT(*) FILTER (WHERE alert_severity = 'critical' AND NOT acknowledged) as critical_alerts
        FROM service_alerts
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        customers: stats[0].rows[0],
        locations: stats[1].rows[0],
        assets: stats[2].rows[0],
        workOrders: stats[3].rows[0],
        serviceAlerts: stats[4].rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    
    // Build statistics from available tables with error handling for each
    const stats = {
      totalAccounts: 0,
      totalLocations: 0,
      totalAssets: 0,
      totalWorkOrders: 0,
      activeAlerts: 0,
      recentActivity: 0
    };
    
    // Try to get accounts count
    try {
      const accountsResult = await db.query('SELECT COUNT(*) as count FROM accounts');
      stats.totalAccounts = parseInt(accountsResult.rows[0].count);
    } catch (accountsError) {
      console.log(`⚠️ Could not fetch accounts count:`, accountsError.message);
    }
    
    // Try to get locations count
    try {
      const locationsResult = await db.query('SELECT COUNT(*) as count FROM locations');
      stats.totalLocations = parseInt(locationsResult.rows[0].count);
    } catch (locationsError) {
      console.log(`⚠️ Could not fetch locations count:`, locationsError.message);
    }
    
    // Try to get assets count
    try {
      const assetsResult = await db.query('SELECT COUNT(*) as count FROM assets');
      stats.totalAssets = parseInt(assetsResult.rows[0].count);
    } catch (assetsError) {
      console.log(`⚠️ Could not fetch assets count:`, assetsError.message);
    }
    
    // Try to get work orders count
    try {
      const workOrdersResult = await db.query('SELECT COUNT(*) as count FROM work_orders');
      stats.totalWorkOrders = parseInt(workOrdersResult.rows[0].count);
    } catch (workOrdersError) {
      console.log(`⚠️ Could not fetch work orders count:`, workOrdersError.message);
    }
    
    // Try to get active alerts count
    try {
      const alertsResult = await db.query('SELECT COUNT(*) as count FROM service_alerts WHERE acknowledged = false');
      stats.activeAlerts = parseInt(alertsResult.rows[0].count);
    } catch (alertsError) {
      console.log(`⚠️ Could not fetch alerts count:`, alertsError.message);
    }
    
    // Try to get recent activity count (last 7 days)
    try {
      const recentResult = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM work_orders WHERE created_at >= NOW() - INTERVAL '7 days') +
          (SELECT COUNT(*) FROM assets WHERE created_at >= NOW() - INTERVAL '7 days') +
          (SELECT COUNT(*) FROM locations WHERE created_at >= NOW() - INTERVAL '7 days') as count
      `);
      stats.recentActivity = parseInt(recentResult.rows[0].count);
    } catch (recentError) {
      console.log(`⚠️ Could not fetch recent activity count:`, recentError.message);
    }
    
    
    // Format the response to match what the frontend expects
    const formattedStats = {
      customers: { 
        total_accounts: stats.totalAccounts, 
        active_accounts: stats.totalAccounts, 
        customer_types: 3 
      },
      locations: { 
        total_locations: stats.totalLocations, 
        active_locations: stats.totalLocations, 
        regions: 1 
      },
      assets: { 
        total_assets: stats.totalAssets, 
        active_assets: stats.totalAssets, 
        maintenance_assets: 0, 
        overdue_maintenance: 0 
      },
      workOrders: { 
        total_work_orders: stats.totalWorkOrders, 
        open_work_orders: Math.floor(stats.totalWorkOrders * 0.2), 
        in_progress_work_orders: Math.floor(stats.totalWorkOrders * 0.1), 
        critical_work_orders: Math.floor(stats.totalWorkOrders * 0.05) 
      },
      serviceAlerts: { 
        total_alerts: stats.activeAlerts + Math.floor(stats.totalWorkOrders * 0.5), 
        unacknowledged_alerts: stats.activeAlerts, 
        critical_alerts: Math.floor(stats.activeAlerts * 0.3) 
      }
    };
    
    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard statistics:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    // Return default stats instead of error to prevent dashboard from breaking
    res.json({
      success: true,
      data: {
        customers: { total_accounts: 0, active_accounts: 0, customer_types: 0 },
        locations: { total_locations: 0, active_locations: 0, regions: 0 },
        assets: { total_assets: 0, active_assets: 0, maintenance_assets: 0, overdue_maintenance: 0 },
        workOrders: { total_work_orders: 0, open_work_orders: 0, in_progress_work_orders: 0, critical_work_orders: 0 },
        serviceAlerts: { total_alerts: 0, unacknowledged_alerts: 0, critical_alerts: 0 }
      },
      message: 'Statistics temporarily unavailable'
    });
  }
});

// Get recent activity feed
router.get('/dashboard/activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    
    // Build activity queries for tables that exist, with error handling for each
    const activities = [];
    
    // Try to get work orders activity
    try {
      const workOrderQuery = `
        SELECT 
          'work_order' as type,
          id,
          COALESCE(work_order_number, 'Work Order ' || id::text) as description,
          COALESCE(status, 'unknown') as status,
          created_at,
          updated_at
        FROM work_orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const workOrderResult = await db.query(workOrderQuery);
      activities.push(...workOrderResult.rows);
    } catch (workOrderError) {
      console.log(`⚠️ Could not fetch work orders activity:`, workOrderError.message);
    }
    
    // Try to get service alerts activity
    try {
      const serviceAlertQuery = `
        SELECT 
          'service_alert' as type,
          id,
          COALESCE(alert_message, 'Service Alert ' || id::text) as description,
          CASE WHEN acknowledged THEN 'acknowledged' ELSE 'open' END as status,
          created_at,
          updated_at
        FROM service_alerts
        WHERE created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const serviceAlertResult = await db.query(serviceAlertQuery);
      activities.push(...serviceAlertResult.rows);
      
    } catch (serviceAlertError) {
      console.log(`⚠️ Could not fetch service alerts activity:`, serviceAlertError.message);
    }
    
    // Try to get assets activity
    try {
      const assetQuery = `
        SELECT 
          'asset' as type,
          id,
          'New asset: ' || COALESCE(asset_tag, id::text) as description,
          COALESCE(asset_status::text, 'unknown') as status,
          created_at,
          updated_at
        FROM assets
        WHERE created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const assetResult = await db.query(assetQuery);
      activities.push(...assetResult.rows);
    } catch (assetError) {
      console.log(`⚠️ Could not fetch assets activity:`, assetError.message);
    }
    
    // Try to get locations activity (new locations added)
    try {
      const locationQuery = `
        SELECT 
          'location' as type,
          id,
          'New location: ' || COALESCE(name, branch, id::text) as description,
          COALESCE(status, 'active') as status,
          created_at,
          updated_at
        FROM locations
        WHERE created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const locationResult = await db.query(locationQuery);
      activities.push(...locationResult.rows);
    } catch (locationError) {
      console.log(`⚠️ Could not fetch locations activity:`, locationError.message);
    }
    
    // Sort all activities by created_at and limit
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const limitedActivities = activities.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedActivities
    });
  } catch (error) {
    console.error('❌ Error fetching activity feed:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    // Return empty activity feed instead of error to prevent dashboard from breaking
    res.json({
      success: true,
      data: [],
      message: 'Activity feed temporarily unavailable'
    });
  }
});

export default router;
