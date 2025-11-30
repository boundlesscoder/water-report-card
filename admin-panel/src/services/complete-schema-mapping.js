// Complete Schema Mapping - Extracted from ALL migration files
// This contains EVERY field from EVERY table in the CRM/CMMS database

export const COMPLETE_SCHEMA_MAPPING = {
  // =====================================================
  // CORE ENTITIES (Migration 1)
  // =====================================================
  accounts: {
    fields: [
      'id', 'name', 'account_number', 'status', 'created_at', 'updated_at',
      // Added in migration 2
      'tier1_id', 'tier2_id', 'tier3_id',
      // Added in migration 3
      'billing_address_line1', 'billing_address_line2', 'billing_city', 'billing_state', 
      'billing_zip', 'billing_country', 'billing_department', 'billing_email'
    ],
    primaryKey: 'id',
    displayName: 'Customer Accounts',
    searchFields: ['name', 'account_number'],
    requiredFields: ['name', 'status']
  },

  addresses: {
    fields: [
      'id', 'line1', 'line2', 'city', 'state', 'postal_code', 'country', 
      'latitude', 'longitude', 'pwsid', 'created_at', 'updated_at',
      // Added in migration 7
      'geom'
    ],
    primaryKey: 'id',
    displayName: 'Addresses',
    searchFields: ['line1', 'city', 'state', 'postal_code'],
    requiredFields: ['line1', 'city', 'state']
  },

  locations: {
    fields: [
      'id', 'account_id', 'branch', 'location_type', 'route_code', 'region', 
      'address_id', 'phone', 'hours_of_operation', 'days_of_operation', 
      'status', 'created_at', 'updated_at',
      // Added in migration 7
      'geom',
      // Added in migration 9
      'cached_city', 'cached_state', 'cached_postal_code'
    ],
    primaryKey: 'id',
    displayName: 'Locations',
    searchFields: ['name', 'region', 'route_code'],
    requiredFields: ['account_id', 'name', 'status']
  },

  manufacturers: {
    fields: [
      'id', 'name', 'website', 'status', 'created_at', 'updated_at',
      // Added in migration 8/9
      'country'
    ],
    primaryKey: 'id',
    displayName: 'Manufacturers',
    searchFields: ['name', 'website'],
    requiredFields: ['name']
  },

  contacts: {
    fields: [
      'id', 'first_name', 'last_name', 'email', 'mobile_phone', 'title', 
      'created_at', 'updated_at',
      // Added in migration 9
      'department', 'notes', 'is_active'
    ],
    primaryKey: 'id',
    displayName: 'Base Contacts',
    searchFields: ['first_name', 'last_name', 'email'],
    requiredFields: []
  },

  // =====================================================
  // CUSTOMER TIERS (Migration 2)
  // =====================================================
  customer_tier1: {
    fields: ['id', 'code', 'name', 'description', 'created_at', 'updated_at'],
    primaryKey: 'id',
    displayName: 'Customer Tier 1',
    searchFields: ['code', 'name'],
    requiredFields: ['code', 'name']
  },

  customer_tier2: {
    fields: ['id', 'tier1_id', 'code', 'name', 'description', 'created_at', 'updated_at'],
    primaryKey: 'id',
    displayName: 'Customer Tier 2',
    searchFields: ['code', 'name'],
    requiredFields: ['tier1_id', 'code', 'name']
  },

  customer_tier3: {
    fields: ['id', 'tier2_id', 'code', 'name', 'description', 'created_at', 'updated_at'],
    primaryKey: 'id',
    displayName: 'Customer Tier 3',
    searchFields: ['code', 'name'],
    requiredFields: ['tier2_id', 'code', 'name']
  },

  // =====================================================
  // ASSET CATEGORIES AND PARTS (Migration 2)
  // =====================================================
  asset_categories: {
    fields: ['id', 'code', 'name', 'description', 'parent_category_id', 'created_at', 'updated_at'],
    primaryKey: 'id',
    displayName: 'Asset Categories',
    searchFields: ['code', 'name'],
    requiredFields: ['code', 'name']
  },

  equipment_specifications: {
    fields: [
      'id', 'spec_type', 'spec_key', 'spec_name', 'description', 'data_type', 
      'unit_of_measure', 'is_required', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Equipment Specifications',
    searchFields: ['spec_type', 'spec_name'],
    requiredFields: ['spec_type', 'spec_key', 'spec_name']
  },

  parts_listing: {
    fields: [
      'id', 'category_id', 'manufacturer_id', 'manufacturer_part_number', 'sku', 
      'part_name', 'part_description', 'part_type', 'model_number', 'serial_number_format',
      // Filter-specific fields
      'purifier_type', 'flow_meter_model', 'number_of_filters', 'has_ro', 'nsf_certified',
      // Ice machine specific
      'ice_production_capacity_lbs', 'ice_harvest_type', 'compressor_type', 'water_usage_gpd',
      // Coffee equipment specific
      'brewing_capacity_oz', 'number_of_groups', 'steam_boiler_capacity_liters',
      // General specs
      'power_requirements', 'dimensions_length_in', 'dimensions_width_in', 'dimensions_height_in', 
      'weight_lbs', 'status', 'warranty_months', 'expected_lifespan_years', 'created_at', 'updated_at',
      // Added in migration 7
      'search_vector'
    ],
    primaryKey: 'id',
    displayName: 'Parts Catalog',
    searchFields: ['part_name', 'manufacturer_part_number', 'part_type', 'model_number'],
    requiredFields: ['manufacturer_part_number', 'part_name']
  },

  cartridge_components: {
    fields: [
      'id', 'parent_part_id', 'stage_number', 'cartridge_part_number', 'cartridge_name', 
      'filter_media', 'micron_rating', 'capacity_gallons', 'life_months', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Cartridge Components',
    searchFields: ['cartridge_part_number', 'cartridge_name', 'filter_media'],
    requiredFields: ['parent_part_id', 'stage_number', 'cartridge_part_number']
  },

  // =====================================================
  // BUILDINGS AND FLOORS (Migration 2)
  // =====================================================
  buildings: {
    fields: [
      'id', 'location_id', 'building_name', 'building_code', 'total_floors', 'year_built', 
      'building_type', 'square_footage', 'occupancy_count', 'water_system_type', 
      'primary_pwsid', 'secondary_pwsid', 'created_at', 'updated_at',
      // Added in migration 3
      'campus_id', 'building_number', 'water_district_id', 'building_manager_company',
      'building_manager_email', 'building_manager_mobile', 'building_manager_title'
    ],
    primaryKey: 'id',
    displayName: 'Buildings',
    searchFields: ['building_name', 'building_code', 'building_type'],
    requiredFields: ['location_id', 'building_name']
  },

  floors: {
    fields: [
      'id', 'building_id', 'floor_number', 'floor_name', 'floor_type', 
      'square_footage', 'occupancy_count', 'water_usage_level', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Floors',
    searchFields: ['floor_name', 'floor_type'],
    requiredFields: ['building_id', 'floor_number']
  },

  building_rooms: {
    fields: [
      'id', 'floor_id', 'room_number', 'room_name', 'room_type', 'room_description', 
      'pou_id', 'qr_code', 'geo_lat', 'geo_lon', 'created_at', 'updated_at',
      // Added in migration 6
      'geom',
      // Added in migration 9
      'has_water_access', 'has_drainage', 'square_footage', 'occupancy_count', 'water_usage_level'
    ],
    primaryKey: 'id',
    displayName: 'Building Rooms',
    searchFields: ['room_number', 'room_name', 'room_type'],
    requiredFields: ['floor_id']
  },

  // =====================================================
  // WATER FILTER PROJECTS (Migration 2)
  // =====================================================
  water_filter_projects: {
    fields: [
      'id', 'account_id', 'project_name', 'project_code', 'project_type', 'status', 
      'priority', 'start_date', 'target_completion_date', 'actual_completion_date', 
      'budget_amount', 'actual_cost', 'project_manager_id', 'service_provider_id', 
      'description', 'notes', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Water Filter Projects',
    searchFields: ['project_name', 'project_code', 'project_type'],
    requiredFields: ['account_id', 'project_name', 'status']
  },

  filter_installations: {
    fields: [
      'id', 'project_id', 'building_id', 'floor_id', 'location_name', 'installation_type', 
      'filter_model_id', 'serial_number', 'installation_date', 'warranty_expiry_date', 
      'expected_lifespan_months', 'service_interval_months', 'last_service_date', 
      'next_service_date', 'status', 'notes', 'created_at', 'updated_at',
      // Added in migration 7
      'asset_id'
    ],
    primaryKey: 'id',
    displayName: 'Filter Installations',
    searchFields: ['location_name', 'installation_type', 'serial_number'],
    requiredFields: ['project_id', 'building_id', 'filter_model_id', 'installation_date']
  },

  installed_cartridges: {
    fields: [
      'id', 'filter_installation_id', 'cartridge_id', 'stage_position', 'position_label', 
      'installation_date', 'expected_lifespan_months', 'expected_capacity_gallons', 
      'current_usage_gallons', 'current_usage_months', 'replacement_due_date', 
      'last_replacement_date', 'status', 'notes', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Installed Cartridges',
    searchFields: ['position_label', 'status'],
    requiredFields: ['filter_installation_id', 'cartridge_id', 'stage_position', 'installation_date']
  },

  water_quality_metrics: {
    fields: [
      'id', 'filter_installation_id', 'measurement_date', 'ro_psi_inlet', 'ro_psi_outlet', 
      'flow_rate_gpm', 'tds_inlet', 'tds_outlet', 'tds_reduction_percent', 'ph_inlet', 
      'ph_outlet', 'temperature_f', 'turbidity_ntu', 'chlorine_ppm', 'hardness_grains', 
      'measured_by', 'measurement_method', 'notes', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Water Quality Metrics',
    searchFields: ['measurement_method'],
    requiredFields: ['filter_installation_id', 'measurement_date']
  },

  filter_lifespan_tracking: {
    fields: [
      'id', 'installed_cartridge_id', 'tracking_date', 'current_usage_gallons', 
      'current_usage_months', 'remaining_lifespan_percent', 'performance_rating', 
      'visual_inspection_notes', 'pressure_drop_psi', 'flow_rate_reduction_percent', 
      'recommended_action', 'notes', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Filter Lifespan Tracking',
    searchFields: ['recommended_action'],
    requiredFields: ['installed_cartridge_id', 'tracking_date', 'current_usage_gallons', 'current_usage_months']
  },

  leak_monitoring: {
    fields: [
      'id', 'filter_installation_id', 'detection_date', 'leak_type', 'leak_severity', 
      'leak_location', 'estimated_water_loss_gpd', 'repair_required', 'repair_date', 
      'repair_notes', 'detected_by', 'notes', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Leak Monitoring',
    searchFields: ['leak_type', 'leak_severity', 'leak_location'],
    requiredFields: ['filter_installation_id', 'detection_date']
  },

  // =====================================================
  // WORK ORDERS (Migration 2)
  // =====================================================
  work_orders: {
    fields: [
      'id', 'project_id', 'filter_installation_id', 'work_order_number', 'title', 
      'description', 'work_type', 'priority', 'status', 'assigned_to', 'requested_by', 
      'requested_date', 'scheduled_date', 'estimated_duration_hours', 'actual_start_time', 
      'actual_completion_time', 'actual_duration_hours', 'parts_used', 'labor_cost', 
      'parts_cost', 'total_cost', 'completion_notes', 'customer_signature', 'created_at', 'updated_at',
      // Added in migration 3
      'work_order_type_id', 'vendor_id', 'source', 'alert_id', 'legacy_work_order', 
      'client_work_order_number', 'failure_analysis', 'root_cause'
    ],
    primaryKey: 'id',
    displayName: 'Work Orders',
    searchFields: ['work_order_number', 'title', 'work_type', 'status'],
    requiredFields: ['work_order_number', 'title']
  },

  work_order_tasks: {
    fields: [
      'id', 'work_order_id', 'task_name', 'task_description', 'task_order', 
      'estimated_duration_minutes', 'actual_duration_minutes', 'status', 
      'completed_by', 'completed_at', 'notes', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Work Order Tasks',
    searchFields: ['task_name', 'status'],
    requiredFields: ['work_order_id', 'task_name', 'task_order']
  },

  work_order_parts: {
    fields: [
      'id', 'work_order_id', 'part_id', 'quantity', 'unit_cost', 'total_cost', 
      'serial_number', 'installed_as_asset_id', 'created_at',
      // Added in migration 9 (unified schema)
      'pou_point_id', 'installation_notes', 'status', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Work Order Parts',
    searchFields: ['serial_number', 'status'],
    requiredFields: ['work_order_id', 'part_id']
  },

  nsf_certifications: {
    fields: [
      'id', 'catalog_model_id', 'catalog_cartridge_id', 'nsf_standard', 'certification_number', 
      'certification_date', 'expiry_date', 'certifying_body', 'certification_status', 
      'test_results_url', 'compliance_notes', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'NSF Certifications',
    searchFields: ['nsf_standard', 'certification_number', 'certifying_body'],
    requiredFields: ['nsf_standard']
  },

  // =====================================================
  // VENDORS AND ENHANCED CONTACTS (Migration 3)
  // =====================================================
  vendor_types: {
    fields: ['id', 'code', 'name', 'description', 'is_service_provider', 'created_at', 'updated_at'],
    primaryKey: 'id',
    displayName: 'Vendor Types',
    searchFields: ['code', 'name'],
    requiredFields: ['code', 'name']
  },

  vendors: {
    fields: [
      'id', 'vendor_type_id', 'vendor_name', 'vendor_ein', 'vendor_status', 
      'billing_address_line1', 'billing_address_line2', 'billing_city', 'billing_state', 
      'billing_zip', 'billing_country', 'billing_lat', 'billing_lon', 'billing_email', 
      'admin_contact_name', 'admin_contact_email', 'admin_contact_mobile', 'admin_contact_title', 
      'vendor_username', 'vendor_password_hash', 'website', 'tax_id', 'payment_terms', 
      'credit_limit', 'preferred_payment_method', 'created_at', 'updated_at',
      // Added in migration 7
      'can_login'
    ],
    primaryKey: 'id',
    displayName: 'Vendors',
    searchFields: ['vendor_name', 'vendor_ein', 'admin_contact_name'],
    requiredFields: ['vendor_name']
  },

  contacts_enhanced: {
    fields: [
      'id', 'contact_type', 'account_id', 'vendor_id', 'first_name', 'last_name', 
      'full_name', 'title', 'department', 'email', 'mobile_phone', 'office_phone', 
      'fax', 'preferred_contact_method', 'username', 'password_hash', 'is_primary', 
      'can_login', 'last_login', 'status', 'created_at', 'updated_at',
      // Added in migration 9
      'phone', 'company', 'notes', 'is_active',
      // Added in migration 10
      'category_id', 'location_id', 'is_liquoslabs_account' 
    ],
    primaryKey: 'id',
    displayName: 'Enhanced Contacts',
    searchFields: ['first_name', 'last_name', 'full_name', 'email', 'company'],
    requiredFields: ['contact_type']
  },

  customer_campuses: {
    fields: [
      'id', 'account_id', 'campus_name', 'campus_code', 'campus_type', 
      'address_line1', 'address_line2', 'city', 'state', 'zip', 'country', 
      'lat', 'lon', 'campus_manager_id', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Customer Campuses',
    searchFields: ['campus_name', 'campus_code', 'campus_type'],
    requiredFields: ['account_id', 'campus_name']
  },

  // =====================================================
  // ASSETS (Migration 3)
  // =====================================================
  assets: {
    fields: [
      'id', 'part_id', 'account_id', 'location_id', 'building_id', 'floor_id', 'room_id', 
      'asset_tag', 'barcode', 'qr_code', 'serial_number', 'installation_date', 
      'installed_by', 'installation_work_order_id', 'location_description', 'pou_id', 
      'serves_equipment', 'maintenance_interval_months', 'last_maintenance_date', 
      'next_maintenance_date', 'asset_status', 'condition_rating', 'quantity', 
      'asset_photos', 'created_at', 'updated_at', 'asset_description',
      // Added in migration 7
      'pou_point_id'
    ],
    primaryKey: 'id',
    displayName: 'Assets',
    searchFields: ['asset_tag', 'serial_number', 'location_description'],
    requiredFields: ['part_id', 'account_id']
  },

  asset_specifications: {
    fields: [
      'id', 'asset_id', 'spec_id', 'spec_key', 'spec_value', 'spec_unit', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Asset Specifications',
    searchFields: ['spec_key', 'spec_value'],
    requiredFields: ['asset_id', 'spec_key']
  },

  connected_equipment: {
    fields: [
      'id', 'filter_asset_id', 'connected_asset_id', 'connection_type', 
      'connection_description', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Connected Equipment',
    searchFields: ['connection_type', 'connection_description'],
    requiredFields: ['filter_asset_id', 'connected_asset_id']
  },

  // =====================================================
  // WORK ORDER SYSTEM (Migration 3)
  // =====================================================
  work_order_types: {
    fields: [
      'id', 'code', 'name', 'description', 'color_code', 'default_priority', 
      'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Work Order Types',
    searchFields: ['code', 'name'],
    requiredFields: ['code', 'name']
  },

  work_order_assets: {
    fields: [
      'id', 'work_order_id', 'asset_id', 'action_performed', 'notes', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Work Order Assets',
    searchFields: ['action_performed'],
    requiredFields: ['work_order_id', 'asset_id']
  },

  // =====================================================
  // MAINTENANCE PROFILES (Migration 3)
  // =====================================================
  maintenance_profiles: {
    fields: [
      'id', 'profile_name', 'asset_category_id', 'nsf_standard', 'nsf_rating', 
      'flow_rate_threshold_gpm', 'pressure_drop_threshold_psi', 'tds_threshold_ppm', 
      'scheduled_interval_months', 'scheduled_interval_gallons', 'low_contamination_multiplier', 
      'medium_contamination_multiplier', 'high_contamination_multiplier', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Maintenance Profiles',
    searchFields: ['profile_name', 'nsf_standard'],
    requiredFields: ['profile_name']
  },

  asset_maintenance_profiles: {
    fields: [
      'id', 'asset_id', 'profile_id', 'total_volume_gallons', 'contamination_level', 
      'calculated_replacement_date', 'remaining_life_percent', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Asset Maintenance Profiles',
    searchFields: ['contamination_level'],
    requiredFields: ['asset_id', 'profile_id']
  },

  service_alerts: {
    fields: [
      'id', 'asset_id', 'location_id', 'alert_type', 'alert_severity', 'alert_message', 
      'threshold_value', 'actual_value', 'acknowledged', 'acknowledged_by', 'acknowledged_at', 
      'work_order_created', 'created_at', 'updated_at',
      // Added in migration 7
      'predicted_failure_date', 'confidence_score', 'maintenance_profile_id',
      // Added in migration 9
      'status', 'priority', 'alert_category'
    ],
    primaryKey: 'id',
    displayName: 'Service Alerts',
    searchFields: ['alert_type', 'alert_severity', 'alert_message', 'status'],
    requiredFields: ['alert_type']
  },

  // =====================================================
  // AUTH AND LINKS (Migration 6)
  // =====================================================
  users: {
    fields: [
      'id', 'email', 'password_hash', 'first_name', 'last_name', 'is_active', 
      'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Users',
    searchFields: ['email', 'first_name', 'last_name'],
    requiredFields: ['email']
  },

  user_links: {
    fields: [
      'id', 'user_id', 'account_id', 'vendor_id', 'role', 'is_primary', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'User Links',
    searchFields: ['role'],
    requiredFields: ['user_id', 'role']
  },

  contact_memberships: {
    fields: [
      'id', 'contact_id', 'account_id', 'vendor_id', 'role', 'is_primary', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Contact Memberships',
    searchFields: ['role'],
    requiredFields: ['contact_id']
  },

  account_vendor_links: {
    fields: [
      'id', 'account_id', 'vendor_id', 'relationship_type', 'active', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Account Vendor Links',
    searchFields: ['relationship_type'],
    requiredFields: ['account_id', 'vendor_id']
  },

  part_compatibility: {
    fields: [
      'id', 'part_id', 'compatible_with_part_id', 'compatibility_type', 'notes', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Part Compatibility',
    searchFields: ['compatibility_type', 'notes'],
    requiredFields: ['part_id', 'compatible_with_part_id']
  },

  // =====================================================
  // POU POINTS (Migration 7)
  // =====================================================
  pou_points: {
    fields: [
      'id', 'pou_id', 'room_id', 'pou_name', 'pou_description', 'equipment_group', 
      'barcode_format', 'location_notes', 'geom', 'is_active', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'POU Points',
    searchFields: ['pou_id', 'pou_name', 'equipment_group'],
    requiredFields: ['pou_id', 'room_id']
  },

  filter_maintenance_profiles: {
    fields: [
      'id', 'part_id', 'nsf_standard', 'rated_capacity_gallons', 'rated_life_months', 
      'flow_rate_threshold_gpm', 'pressure_drop_threshold_psi', 'tds_reduction_threshold_percent', 
      'contamination_factor', 'usage_factor', 'temperature_factor', 'maintenance_interval_days', 
      'replacement_lead_time_days', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Filter Maintenance Profiles',
    searchFields: ['nsf_standard'],
    requiredFields: ['part_id']
  },

  // =====================================================
  // TELEMETRY AND SCOPES (Migration 6/9)
  // =====================================================
  telemetry_readings: {
    fields: [
      'id', 'asset_id', 'reading_time', 'metric_name', 'metric_value', 'metric_unit', 
      'quality_score', 'source_device', 'notes', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Telemetry Readings',
    searchFields: ['metric_name', 'source_device'],
    requiredFields: ['asset_id', 'reading_time', 'metric_name', 'metric_value', 'metric_unit']
  },

  work_order_scopes: {
    fields: [
      'id', 'work_order_id', 'building_id', 'floor_id', 'room_id', 'pou_id', 
      'notes', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Work Order Scopes',
    searchFields: ['pou_id', 'notes'],
    requiredFields: ['work_order_id']
  },

  // =====================================================
  // PUBLIC ACCESS POINTS (Migration 9)
  // =====================================================
  public_access_points: {
    fields: [
      'id', 'qr_code', 'room_id', 'asset_id', 'access_type', 'display_name', 
      'public_url', 'show_water_quality', 'show_filter_status', 'show_sustainability', 
      'show_maintenance_schedule', 'is_active', 'created_at', 'updated_at'
    ],
    primaryKey: 'id',
    displayName: 'Public Access Points',
    searchFields: ['qr_code', 'display_name', 'access_type'],
    requiredFields: ['qr_code', 'access_type', 'display_name']
  },

  // =====================================================
  // STAGING TABLE (Migration 9)
  // =====================================================
  staging_press_coffee_locations: {
    fields: [
      'id', 'location_name', 'address_line1', 'city', 'state', 'zip', 'phone', 
      'region', 'route_code', 'building_type', 'import_batch_id', 'processed', 
      'error_message', 'created_at'
    ],
    primaryKey: 'id',
    displayName: 'Staging Press Coffee Locations',
    searchFields: ['location_name', 'city', 'state'],
    requiredFields: ['location_name']
  }
};

// Custom Field Display Names for Admin Panel
// Maps database field names to user-friendly display names
export const FIELD_DISPLAY_NAMES = {
  // Common ID fields
  'id': 'ID',
  'account_id': 'Account Name',
  'address_id': 'Address',
  'location_id': 'Location Name', 
  'building_id': 'Building Name',
  'floor_id': 'Floor Name',
  'room_id': 'Room Name',
  'vendor_id': 'Vendor Name',
  'manufacturer_id': 'Manufacturer Name',
  'part_id': 'Part Name',
  'asset_id': 'Asset Name',
  'contact_id': 'Contact Name',
  'user_id': 'User Name',
  'project_id': 'Project Name',
  'work_order_id': 'Work Order',
  'filter_installation_id': 'Filter Installation',
  'installed_cartridge_id': 'Installed Cartridge',
  'cartridge_id': 'Cartridge Name',
  'profile_id': 'Profile Name',
  'category_id': 'Category Name',
  'tier1_id': 'Tier 1 Category',
  'tier2_id': 'Tier 2 Category',
  'tier3_id': 'Tier 3 Category',
  'campus_id': 'Campus Name',
  'pou_id': 'POU ID',
  'pou_point_id': 'POU Point ID',
  'spec_id': 'Specification',
  'alert_id': 'Alert',
  
  // Account fields
  'account_number': 'Account Number',
  'billing_address_line1': 'Billing Address Line 1',
  'billing_address_line2': 'Billing Address Line 2',
  'billing_city': 'Billing City',
  'billing_state': 'Billing State',
  'billing_zip': 'Billing ZIP Code',
  'billing_country': 'Billing Country',
  'billing_department': 'Billing Department',
  'billing_email': 'Billing Email',
  
  // Address fields
  'line1': 'Address Line 1',
  'line2': 'Address Line 2',
  'postal_code': 'ZIP/Postal Code',
  'pwsid': 'Public Water System ID',
  
  // Location fields
  'location_type': 'Location Type',
  'route_code': 'Route Code',
  'hours_of_operation': 'Operating Hours',
  'days_of_operation': 'Operating Days',
  'cached_city': 'City',
  'cached_state': 'State',
  'cached_postal_code': 'ZIP Code',
  
  // Building fields
  'building_name': 'Building Name',
  'building_code': 'Building Code',
  'building_number': 'Building Number',
  'building_type': 'Building Type',
  'total_floors': 'Total Floors',
  'year_built': 'Year Built',
  'square_footage': 'Square Footage',
  'occupancy_count': 'Occupancy Count',
  'water_system_type': 'Water System Type',
  'primary_pwsid': 'Primary Water System ID',
  'secondary_pwsid': 'Secondary Water System ID',
  'water_district_id': 'Water District',
  'building_manager_company': 'Building Manager Company',
  'building_manager_email': 'Building Manager Email',
  'building_manager_mobile': 'Building Manager Mobile',
  'building_manager_title': 'Building Manager Title',
  
  // Floor fields
  'floor_number': 'Floor Number',
  'floor_name': 'Floor Name',
  'floor_type': 'Floor Type',
  'water_usage_level': 'Water Usage Level',
  
  // Room fields
  'room_number': 'Room Number',
  'room_name': 'Room Name',
  'room_type': 'Room Type',
  'room_description': 'Room Description',
  'qr_code': 'QR Code',
  'geo_lat': 'Latitude',
  'geo_lon': 'Longitude',
  'has_water_access': 'Has Water Access',
  'has_drainage': 'Has Drainage',
  
  // Contact fields
  'first_name': 'First Name',
  'last_name': 'Last Name',
  'full_name': 'Full Name',
  'mobile_phone': 'Mobile Phone',
  'office_phone': 'Office Phone',
  'preferred_contact_method': 'Preferred Contact Method',
  'is_primary': 'Primary Contact',
  'can_login': 'Can Login',
  'last_login': 'Last Login',
  'is_active': 'Active',
  'contact_type': 'Contact Type',
  
  // Vendor fields
  'vendor_name': 'Vendor Name',
  'vendor_ein': 'Vendor EIN',
  'vendor_status': 'Vendor Status',
  'vendor_type_id': 'Vendor Type',
  'admin_contact_name': 'Admin Contact Name',
  'admin_contact_email': 'Admin Contact Email',
  'admin_contact_mobile': 'Admin Contact Mobile',
  'admin_contact_title': 'Admin Contact Title',
  'vendor_username': 'Vendor Username',
  'vendor_password_hash': 'Vendor Password',
  'tax_id': 'Tax ID',
  'payment_terms': 'Payment Terms',
  'credit_limit': 'Credit Limit',
  'preferred_payment_method': 'Preferred Payment Method',
  'is_service_provider': 'Service Provider',
  
  // Campus fields
  'campus_name': 'Campus Name',
  'campus_code': 'Campus Code',
  'campus_type': 'Campus Type',
  'campus_manager_id': 'Campus Manager',
  
  // Customer tier fields
  'tier1_id': 'Tier 1',
  'tier2_id': 'Tier 2',
  'tier3_id': 'Tier 3',
  // Asset fields
  'asset_tag': 'Asset Tag',
  'serial_number': 'Serial Number',
  'installation_date': 'Installation Date',
  'installed_by': 'Installed By',
  'installation_work_order_id': 'Installation Work Order',
  'location_description': 'Location Description',
  'serves_equipment': 'Serves Equipment',
  'maintenance_interval_months': 'Maintenance Interval (Months)',
  'last_maintenance_date': 'Last Maintenance Date',
  'next_maintenance_date': 'Next Maintenance Date',
  'asset_status': 'Asset Status',
  'condition_rating': 'Condition Rating',
  'asset_photos': 'Asset Photos',
  'asset_description': 'Asset Description',
  
  // Part fields
  'manufacturer_part_number': 'Manufacturer Part Number',
  'part_name': 'Part Name',
  'part_description': 'Part Description',
  'part_type': 'Part Type',
  'model_number': 'Model Number',
  'serial_number_format': 'Serial Number Format',
  'purifier_type': 'Purifier Type',
  'flow_meter_model': 'Flow Meter Model',
  'number_of_filters': 'Number of Filters',
  'has_ro': 'Has RO System',
  'nsf_certified': 'NSF Certified',
  'ice_production_capacity_lbs': 'Ice Production Capacity (lbs)',
  'ice_harvest_type': 'Ice Harvest Type',
  'compressor_type': 'Compressor Type',
  'water_usage_gpd': 'Water Usage (GPD)',
  'brewing_capacity_oz': 'Brewing Capacity (oz)',
  'number_of_groups': 'Number of Groups',
  'steam_boiler_capacity_liters': 'Steam Boiler Capacity (L)',
  'power_requirements': 'Power Requirements',
  'dimensions_length_in': 'Length (inches)',
  'dimensions_width_in': 'Width (inches)',
  'dimensions_height_in': 'Height (inches)',
  'weight_lbs': 'Weight (lbs)',
  'warranty_months': 'Warranty (Months)',
  'expected_lifespan_years': 'Expected Lifespan (Years)',
  
  // Work Order fields
  'work_order_number': 'Work Order Number',
  'work_type': 'Work Type',
  'assigned_to': 'Assigned To',
  'requested_by': 'Requested By',
  'requested_date': 'Requested Date',
  'scheduled_date': 'Scheduled Date',
  'estimated_duration_hours': 'Estimated Duration (Hours)',
  'actual_start_time': 'Actual Start Time',
  'actual_completion_time': 'Actual Completion Time',
  'actual_duration_hours': 'Actual Duration (Hours)',
  'parts_used': 'Parts Used',
  'labor_cost': 'Labor Cost',
  'parts_cost': 'Parts Cost',
  'total_cost': 'Total Cost',
  'completion_notes': 'Completion Notes',
  'customer_signature': 'Customer Signature',
  'work_order_type_id': 'Work Order Type',
  'client_work_order_number': 'Client Work Order Number',
  'failure_analysis': 'Failure Analysis',
  'root_cause': 'Root Cause',
  'legacy_work_order': 'Legacy Work Order',
  
  // Task fields
  'task_name': 'Task Name',
  'task_description': 'Task Description',
  'task_order': 'Task Order',
  'estimated_duration_minutes': 'Estimated Duration (Minutes)',
  'actual_duration_minutes': 'Actual Duration (Minutes)',
  'completed_by': 'Completed By',
  'completed_at': 'Completed At',
  
  // Project fields
  'project_name': 'Project Name',
  'project_code': 'Project Code',
  'project_type': 'Project Type',
  'start_date': 'Start Date',
  'target_completion_date': 'Target Completion Date',
  'actual_completion_date': 'Actual Completion Date',
  'budget_amount': 'Budget Amount',
  'actual_cost': 'Actual Cost',
  'project_manager_id': 'Project Manager',
  'service_provider_id': 'Service Provider',
  
  // Filter fields
  'filter_model_id': 'Filter Model',
  'warranty_expiry_date': 'Warranty Expiry Date',
  'expected_lifespan_months': 'Expected Lifespan (Months)',
  'service_interval_months': 'Service Interval (Months)',
  'last_service_date': 'Last Service Date',
  'next_service_date': 'Next Service Date',
  'installation_type': 'Installation Type',
  
  // Cartridge fields
  'stage_position': 'Stage Position',
  'position_label': 'Position Label',
  'expected_capacity_gallons': 'Expected Capacity (Gallons)',
  'current_usage_gallons': 'Current Usage (Gallons)',
  'current_usage_months': 'Current Usage (Months)',
  'replacement_due_date': 'Replacement Due Date',
  'last_replacement_date': 'Last Replacement Date',
  'cartridge_part_number': 'Cartridge Part Number',
  'cartridge_name': 'Cartridge Name',
  'filter_media': 'Filter Media',
  'micron_rating': 'Micron Rating',
  'capacity_gallons': 'Capacity (Gallons)',
  'life_months': 'Life (Months)',
  
  // Water Quality fields
  'measurement_date': 'Measurement Date',
  'ro_psi_inlet': 'RO PSI Inlet',
  'ro_psi_outlet': 'RO PSI Outlet',
  'flow_rate_gpm': 'Flow Rate (GPM)',
  'tds_inlet': 'TDS Inlet',
  'tds_outlet': 'TDS Outlet',
  'tds_reduction_percent': 'TDS Reduction (%)',
  'ph_inlet': 'pH Inlet',
  'ph_outlet': 'pH Outlet',
  'temperature_f': 'Temperature (°F)',
  'turbidity_ntu': 'Turbidity (NTU)',
  'chlorine_ppm': 'Chlorine (PPM)',
  'hardness_grains': 'Hardness (Grains)',
  'measured_by': 'Measured By',
  'measurement_method': 'Measurement Method',
  
  // Alert fields
  'alert_type': 'Alert Type',
  'alert_severity': 'Alert Severity',
  'alert_message': 'Alert Message',
  'alert_category': 'Alert Category',
  'threshold_value': 'Threshold Value',
  'actual_value': 'Actual Value',
  'acknowledged_by': 'Acknowledged By',
  'acknowledged_at': 'Acknowledged At',
  'work_order_created': 'Work Order Created',
  'predicted_failure_date': 'Predicted Failure Date',
  'confidence_score': 'Confidence Score',
  'maintenance_profile_id': 'Maintenance Profile',
  
  // Tracking fields
  'tracking_date': 'Tracking Date',
  'remaining_lifespan_percent': 'Remaining Lifespan (%)',
  'performance_rating': 'Performance Rating',
  'visual_inspection_notes': 'Visual Inspection Notes',
  'pressure_drop_psi': 'Pressure Drop (PSI)',
  'flow_rate_reduction_percent': 'Flow Rate Reduction (%)',
  'recommended_action': 'Recommended Action',
  
  // Leak Monitoring fields
  'detection_date': 'Detection Date',
  'leak_type': 'Leak Type',
  'leak_severity': 'Leak Severity',
  'leak_location': 'Leak Location',
  'estimated_water_loss_gpd': 'Estimated Water Loss (GPD)',
  'repair_required': 'Repair Required',
  'repair_date': 'Repair Date',
  'repair_notes': 'Repair Notes',
  'detected_by': 'Detected By',
  
  // Telemetry fields
  'reading_time': 'Reading Time',
  'metric_name': 'Metric Name',
  'metric_value': 'Metric Value',
  'metric_unit': 'Metric Unit',
  'quality_score': 'Quality Score',
  'source_device': 'Source Device',
  
  // POU fields
  'pou_name': 'POU Name',
  'pou_description': 'POU Description',
  'equipment_group': 'Equipment Group',
  'barcode_format': 'Barcode Format',
  'location_notes': 'Location Notes',
  
  // Public Access fields
  'access_type': 'Access Type',
  'display_name': 'Display Name',
  'public_url': 'Public URL',
  'show_water_quality': 'Show Water Quality',
  'show_filter_status': 'Show Filter Status',
  'show_sustainability': 'Show Sustainability',
  'show_maintenance_schedule': 'Show Maintenance Schedule',
  
  // NSF Certification fields
  'nsf_standard': 'NSF Standard',
  'certification_number': 'Certification Number',
  'certification_date': 'Certification Date',
  'expiry_date': 'Expiry Date',
  'certifying_body': 'Certifying Body',
  'certification_status': 'Certification Status',
  'test_results_url': 'Test Results URL',
  'compliance_notes': 'Compliance Notes',
  
  // Maintenance Profile fields
  'profile_name': 'Profile Name',
  'nsf_rating': 'NSF Rating',
  'flow_rate_threshold_gpm': 'Flow Rate Threshold (GPM)',
  'pressure_drop_threshold_psi': 'Pressure Drop Threshold (PSI)',
  'tds_threshold_ppm': 'TDS Threshold (PPM)',
  'scheduled_interval_months': 'Scheduled Interval (Months)',
  'scheduled_interval_gallons': 'Scheduled Interval (Gallons)',
  'low_contamination_multiplier': 'Low Contamination Multiplier',
  'medium_contamination_multiplier': 'Medium Contamination Multiplier',
  'high_contamination_multiplier': 'High Contamination Multiplier',
  'total_volume_gallons': 'Total Volume (Gallons)',
  'contamination_level': 'Contamination Level',
  'calculated_replacement_date': 'Calculated Replacement Date',
  'remaining_life_percent': 'Remaining Life (%)',
  
  // Specification fields
  'spec_type': 'Specification Type',
  'spec_key': 'Specification Key',
  'spec_name': 'Specification Name',
  'spec_value': 'Specification Value',
  'spec_unit': 'Specification Unit',
  'data_type': 'Data Type',
  'unit_of_measure': 'Unit of Measure',
  'is_required': 'Required',
  
  // Connection fields
  'connection_type': 'Connection Type',
  'connection_description': 'Connection Description',
  'filter_asset_id': 'Filter Asset',
  'connected_asset_id': 'Connected Asset',
  'action_performed': 'Action Performed',
  
  // Compatibility fields
  'compatible_with_part_id': 'Compatible With Part',
  'compatibility_type': 'Compatibility Type',
  
  // User fields
  'password_hash': 'Password',
  'relationship_type': 'Relationship Type',
  'role': 'Role',
  
  // Common fields
  'created_at': 'Created Date',
  'updated_at': 'Updated Date',
  'status': 'Status',
  'priority': 'Priority',
  'name': 'Name',
  'description': 'Description',
  'notes': 'Notes',
  'code': 'Code',
  'title': 'Title',
  'email': 'Email',
  'phone': 'Phone',
  'website': 'Website',
  'country': 'Country',
  'active': 'Active',
  'quantity': 'Quantity',
  'unit_cost': 'Unit Cost',
  'source': 'Source',
  'company': 'Company',
  'department': 'Department',
  'branch': 'Branch',
  'region': 'Region',
  'latitude': 'Latitude',
  'longitude': 'Longitude',
  'color_code': 'Color Code',
  'default_priority': 'Default Priority',
  'parent_category_id': 'Parent Category',
  'import_batch_id': 'Import Batch ID',
  'processed': 'Processed',
  'error_message': 'Error Message'
};

// Custom Filter Configurations for Each Table
// Defines business-specific, table-tailored filters
export const CUSTOM_TABLE_FILTERS = {
  // =====================================================
  // CUSTOMER MANAGEMENT FILTERS
  // =====================================================
  accounts: {
    customFilters: [
      {
        key: 'account_status_group',
        label: 'Account Status',
        type: 'multi_select',
        options: [
          { value: 'active', label: '✅ Active Accounts', color: 'green' },
          { value: 'inactive', label: '❌ Inactive Accounts', color: 'red' },
          { value: 'pending', label: '⏳ Pending Accounts', color: 'yellow' },
          { value: 'suspended', label: '🚫 Suspended Accounts', color: 'orange' }
        ],
        filterLogic: (items, values) => items.filter(item => values.includes(item.status))
      },
      {
        key: 'customer_tier_filter',
        label: 'Customer Tier Level',
        type: 'tier_selector',
        options: [
          { value: 'tier1', label: '🥇 Tier 1 Customers', description: 'Premium customers' },
          { value: 'tier2', label: '🥈 Tier 2 Customers', description: 'Standard customers' },
          { value: 'tier3', label: '🥉 Tier 3 Customers', description: 'Basic customers' },
          { value: 'no_tier', label: '❓ Unassigned Tier', description: 'No tier assigned' }
        ],
        filterLogic: (items, value) => {
          if (value === 'no_tier') return items.filter(item => !item.tier1_id && !item.tier2_id && !item.tier3_id);
          if (value === 'tier1') return items.filter(item => item.tier1_id && !item.tier2_id && !item.tier3_id);
          if (value === 'tier2') return items.filter(item => item.tier2_id && !item.tier3_id);
          if (value === 'tier3') return items.filter(item => item.tier3_id);
          return items;
        }
      },
      {
        key: 'billing_status',
        label: 'Billing Information',
        type: 'checkbox_group',
        options: [
          { value: 'has_billing_address', label: '📮 Has Billing Address' },
          { value: 'has_billing_email', label: '📧 Has Billing Email' },
          { value: 'complete_billing', label: '✅ Complete Billing Info' }
        ],
        filterLogic: (items, values) => {
          return items.filter(item => {
            return values.every(value => {
              switch (value) {
                case 'has_billing_address': return item.billing_address_line1;
                case 'has_billing_email': return item.billing_email;
                case 'complete_billing': return item.billing_address_line1 && item.billing_email && item.billing_city;
                default: return true;
              }
            });
          });
        }
      }
    ]
  },

  locations: {
    customFilters: [
      {
        key: 'location_operational_status',
        label: 'Operational Status',
        type: 'button_group',
        options: [
          { value: 'operational', label: '🟢 Operational', color: 'green' },
          { value: 'maintenance', label: '🟡 Under Maintenance', color: 'yellow' },
          { value: 'closed', label: '🔴 Closed', color: 'red' },
          { value: 'new', label: '🆕 New Locations', color: 'blue' }
        ],
        filterLogic: (items, value) => {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          
          switch (value) {
            case 'operational': return items.filter(item => item.status === 'active');
            case 'maintenance': return items.filter(item => item.status === 'maintenance');
            case 'closed': return items.filter(item => item.status === 'inactive' || item.status === 'closed');
            case 'new': return items.filter(item => new Date(item.created_at) > thirtyDaysAgo);
            default: return items;
          }
        }
      },
      {
        key: 'location_coverage',
        label: 'Service Coverage',
        type: 'range_slider',
        min: 0,
        max: 100,
        step: 10,
        label_suffix: '% Coverage',
        filterLogic: (items, range) => {
          // This would integrate with actual coverage calculation
          return items.filter(item => {
            const coverage = Math.random() * 100; // Placeholder - replace with actual logic
            return coverage >= range.min && coverage <= range.max;
          });
        }
      },
      {
        key: 'geographic_region',
        label: 'Geographic Regions',
        type: 'map_selector',
        options: [
          { value: 'west_coast', label: '🌊 West Coast', regions: ['CA', 'OR', 'WA'] },
          { value: 'east_coast', label: '🏙️ East Coast', regions: ['NY', 'NJ', 'MA', 'FL'] },
          { value: 'midwest', label: '🌾 Midwest', regions: ['IL', 'OH', 'MI', 'WI'] },
          { value: 'south', label: '🌴 South', regions: ['TX', 'GA', 'NC', 'TN'] },
          { value: 'mountain', label: '⛰️ Mountain', regions: ['CO', 'UT', 'NV', 'AZ'] }
        ],
        filterLogic: (items, value, config) => {
          const regionConfig = config.options.find(opt => opt.value === value);
          if (!regionConfig) return items;
          return items.filter(item => regionConfig.regions.includes(item.cached_state));
        }
      }
    ]
  },

  // =====================================================
  // ASSET MANAGEMENT FILTERS
  // =====================================================
  assets: {
    customFilters: [
      {
        key: 'asset_health_status',
        label: 'Asset Health Dashboard',
        type: 'health_indicator',
        options: [
          { value: 'excellent', label: '🟢 Excellent Condition', range: [90, 100], color: 'green' },
          { value: 'good', label: '🟡 Good Condition', range: [70, 89], color: 'yellow' },
          { value: 'fair', label: '🟠 Fair Condition', range: [50, 69], color: 'orange' },
          { value: 'poor', label: '🔴 Poor Condition', range: [0, 49], color: 'red' },
          { value: 'unknown', label: '❓ Unknown Condition', color: 'gray' }
        ],
        filterLogic: (items, value, config) => {
          const healthConfig = config.options.find(opt => opt.value === value);
          if (!healthConfig) return items;
          
          return items.filter(item => {
            const rating = parseFloat(item.condition_rating) || 0;
            if (value === 'unknown') return !item.condition_rating;
            return rating >= healthConfig.range[0] && rating <= healthConfig.range[1];
          });
        }
      },
      {
        key: 'maintenance_urgency',
        label: 'Maintenance Priority',
        type: 'urgency_matrix',
        options: [
          { value: 'critical', label: '🚨 Critical - Immediate Action', days: 0, color: 'red' },
          { value: 'urgent', label: '⚡ Urgent - Within 7 Days', days: 7, color: 'orange' },
          { value: 'scheduled', label: '📅 Scheduled - Within 30 Days', days: 30, color: 'yellow' },
          { value: 'routine', label: '🔄 Routine - Within 90 Days', days: 90, color: 'green' },
          { value: 'overdue', label: '⏰ Overdue Maintenance', color: 'purple' }
        ],
        filterLogic: (items, value, config) => {
          const now = new Date();
          const urgencyConfig = config.options.find(opt => opt.value === value);
          
          return items.filter(item => {
            const nextMaintenance = new Date(item.next_maintenance_date);
            const daysDiff = Math.ceil((nextMaintenance - now) / (1000 * 60 * 60 * 24));
            
            switch (value) {
              case 'critical': return daysDiff <= 0;
              case 'urgent': return daysDiff > 0 && daysDiff <= 7;
              case 'scheduled': return daysDiff > 7 && daysDiff <= 30;
              case 'routine': return daysDiff > 30 && daysDiff <= 90;
              case 'overdue': return daysDiff < 0;
              default: return true;
            }
          });
        }
      },
      {
        key: 'asset_lifecycle',
        label: 'Asset Lifecycle Stage',
        type: 'lifecycle_timeline',
        options: [
          { value: 'new', label: '🆕 New Assets (0-1 years)', color: 'blue' },
          { value: 'prime', label: '⭐ Prime Condition (1-3 years)', color: 'green' },
          { value: 'mature', label: '🔧 Mature Assets (3-7 years)', color: 'yellow' },
          { value: 'aging', label: '⚠️ Aging Assets (7-10 years)', color: 'orange' },
          { value: 'legacy', label: '🏛️ Legacy Assets (10+ years)', color: 'red' }
        ],
        filterLogic: (items, value) => {
          const now = new Date();
          
          return items.filter(item => {
            const installDate = new Date(item.installation_date);
            const yearsOld = (now - installDate) / (1000 * 60 * 60 * 24 * 365);
            
            switch (value) {
              case 'new': return yearsOld <= 1;
              case 'prime': return yearsOld > 1 && yearsOld <= 3;
              case 'mature': return yearsOld > 3 && yearsOld <= 7;
              case 'aging': return yearsOld > 7 && yearsOld <= 10;
              case 'legacy': return yearsOld > 10;
              default: return true;
            }
          });
        }
      }
    ]
  },

  // =====================================================
  // WATER QUALITY FILTERS
  // =====================================================
  water_quality_metrics: {
    customFilters: [
      {
        key: 'water_quality_grade',
        label: 'Water Quality Grade',
        type: 'quality_grade',
        options: [
          { value: 'excellent', label: '🟢 A+ Excellent', tds_max: 50, color: 'green' },
          { value: 'good', label: '🟡 B+ Good', tds_max: 150, color: 'yellow' },
          { value: 'acceptable', label: '🟠 C Acceptable', tds_max: 300, color: 'orange' },
          { value: 'poor', label: '🔴 D Poor', tds_max: 500, color: 'red' },
          { value: 'unacceptable', label: '⚫ F Unacceptable', color: 'black' }
        ],
        filterLogic: (items, value, config) => {
          const gradeConfig = config.options.find(opt => opt.value === value);
          
          return items.filter(item => {
            const tds = parseFloat(item.tds_outlet) || 0;
            const ph = parseFloat(item.ph_outlet) || 7;
            
            switch (value) {
              case 'excellent': return tds <= 50 && ph >= 6.5 && ph <= 8.5;
              case 'good': return tds <= 150 && ph >= 6.0 && ph <= 9.0;
              case 'acceptable': return tds <= 300 && ph >= 5.5 && ph <= 9.5;
              case 'poor': return tds <= 500 && ph >= 5.0 && ph <= 10.0;
              case 'unacceptable': return tds > 500 || ph < 5.0 || ph > 10.0;
              default: return true;
            }
          });
        }
      },
      {
        key: 'contamination_alerts',
        label: 'Contamination Alerts',
        type: 'alert_dashboard',
        options: [
          { value: 'high_tds', label: '⚠️ High TDS Levels', threshold: 300, color: 'red' },
          { value: 'ph_imbalance', label: '⚖️ pH Imbalance', color: 'orange' },
          { value: 'high_chlorine', label: '🧪 High Chlorine', threshold: 4, color: 'yellow' },
          { value: 'turbidity_issues', label: '🌫️ Turbidity Issues', threshold: 1, color: 'brown' },
          { value: 'all_clear', label: '✅ All Parameters Normal', color: 'green' }
        ],
        filterLogic: (items, value) => {
          return items.filter(item => {
            const tds = parseFloat(item.tds_outlet) || 0;
            const ph = parseFloat(item.ph_outlet) || 7;
            const chlorine = parseFloat(item.chlorine_ppm) || 0;
            const turbidity = parseFloat(item.turbidity_ntu) || 0;
            
            switch (value) {
              case 'high_tds': return tds > 300;
              case 'ph_imbalance': return ph < 6.5 || ph > 8.5;
              case 'high_chlorine': return chlorine > 4;
              case 'turbidity_issues': return turbidity > 1;
              case 'all_clear': return tds <= 300 && ph >= 6.5 && ph <= 8.5 && chlorine <= 4 && turbidity <= 1;
              default: return true;
            }
          });
        }
      }
    ]
  },

  // =====================================================
  // WORK ORDER FILTERS
  // =====================================================
  work_orders: {
    customFilters: [
      {
        key: 'work_order_dashboard',
        label: 'Work Order Dashboard',
        type: 'status_board',
        options: [
          { value: 'emergency', label: '🚨 Emergency Orders', color: 'red', priority: 'high' },
          { value: 'in_progress', label: '🔄 In Progress', color: 'blue', status: 'in_progress' },
          { value: 'scheduled_today', label: '📅 Scheduled Today', color: 'green' },
          { value: 'overdue', label: '⏰ Overdue Orders', color: 'purple' },
          { value: 'pending_parts', label: '📦 Pending Parts', color: 'orange' },
          { value: 'completed_today', label: '✅ Completed Today', color: 'teal' }
        ],
        filterLogic: (items, value) => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          
          return items.filter(item => {
            const scheduledDate = new Date(item.scheduled_date);
            const completionDate = item.actual_completion_time ? new Date(item.actual_completion_time) : null;
            
            switch (value) {
              case 'emergency': return item.priority === 'high' || item.priority === 'critical';
              case 'in_progress': return item.status === 'in_progress' || item.status === 'assigned';
              case 'scheduled_today': return scheduledDate >= today && scheduledDate < tomorrow && item.status !== 'completed';
              case 'overdue': return scheduledDate < today && item.status !== 'completed';
              case 'pending_parts': return item.status === 'pending_parts' || (item.parts_used && !item.actual_start_time);
              case 'completed_today': return completionDate && completionDate >= today && completionDate < tomorrow;
              default: return true;
            }
          });
        }
      },
      {
        key: 'technician_workload',
        label: 'Technician Workload',
        type: 'workload_distribution',
        options: [
          { value: 'unassigned', label: '❓ Unassigned Orders', color: 'gray' },
          { value: 'overloaded', label: '🔴 Overloaded Technicians', color: 'red' },
          { value: 'balanced', label: '🟢 Balanced Workload', color: 'green' },
          { value: 'available', label: '🟡 Available Capacity', color: 'yellow' }
        ],
        filterLogic: (items, value) => {
          // This would integrate with actual technician workload data
          return items.filter(item => {
            switch (value) {
              case 'unassigned': return !item.assigned_to;
              case 'overloaded': return item.assigned_to && Math.random() > 0.7; // Placeholder logic
              case 'balanced': return item.assigned_to && Math.random() > 0.3 && Math.random() <= 0.7;
              case 'available': return item.assigned_to && Math.random() <= 0.3;
              default: return true;
            }
          });
        }
      }
    ]
  },

  // =====================================================
  // MAINTENANCE FILTERS
  // =====================================================
  service_alerts: {
    customFilters: [
      {
        key: 'alert_severity_matrix',
        label: 'Alert Severity Matrix',
        type: 'severity_matrix',
        options: [
          { value: 'critical_unack', label: '🚨 Critical Unacknowledged', color: 'red', severity: 'critical', ack: false },
          { value: 'high_unack', label: '⚠️ High Priority Unacknowledged', color: 'orange', severity: 'high', ack: false },
          { value: 'escalated', label: '📈 Escalated Alerts', color: 'purple' },
          { value: 'resolved_today', label: '✅ Resolved Today', color: 'green' },
          { value: 'recurring', label: '🔄 Recurring Issues', color: 'blue' }
        ],
        filterLogic: (items, value) => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          
          return items.filter(item => {
            const createdDate = new Date(item.created_at);
            const ackDate = item.acknowledged_at ? new Date(item.acknowledged_at) : null;
            
            switch (value) {
              case 'critical_unack': return item.alert_severity === 'critical' && !item.acknowledged;
              case 'high_unack': return item.alert_severity === 'high' && !item.acknowledged;
              case 'escalated': return createdDate < new Date(now.getTime() - 24 * 60 * 60 * 1000) && !item.acknowledged;
              case 'resolved_today': return ackDate && ackDate >= today && ackDate < tomorrow;
              case 'recurring': return item.alert_type && Math.random() > 0.8; // Placeholder for recurring logic
              default: return true;
            }
          });
        }
      }
    ]
  }
};

// Business Module Groupings for the Admin Panel
export const BUSINESS_MODULE_MAPPINGS = {
  customers: {
    label: 'Customer Management',
    icon: 'UserGroupIcon',
    tables: ['accounts', 'customer_tier1', 'customer_tier2', 'customer_tier3', 'customer_campuses']
  },
  facilities: {
    label: 'Facility Management', 
    icon: 'HomeIcon',
    tables: ['locations', 'addresses', 'buildings', 'floors', 'building_rooms', 'pou_points', 'public_access_points']
  },
  equipment: {
    label: 'Equipment & Parts',
    icon: 'CogIcon', 
    tables: ['parts_listing', 'manufacturers', 'asset_categories', 'cartridge_components', 'equipment_specifications', 'part_compatibility']
  },
  assets: {
    label: 'Asset Management',
    icon: 'WrenchScrewdriverIcon',
    tables: ['assets', 'asset_specifications', 'connected_equipment', 'filter_installations', 'installed_cartridges']
  },
  maintenance: {
    label: 'Maintenance & Service',
    icon: 'WrenchScrewdriverIcon',
    tables: ['work_orders', 'work_order_tasks', 'work_order_parts', 'work_order_assets', 'work_order_types', 'work_order_scopes', 'maintenance_profiles', 'asset_maintenance_profiles', 'filter_maintenance_profiles']
  },
  monitoring: {
    label: 'Monitoring & Quality',
    icon: 'ChartBarIcon',
    tables: ['service_alerts', 'water_quality_metrics', 'filter_lifespan_tracking', 'leak_monitoring', 'water_filter_projects', 'telemetry_readings', 'nsf_certifications']
  },
  vendors: {
    label: 'Vendor Management',
    icon: 'TruckIcon',
    tables: ['vendors', 'vendor_types', 'account_vendor_links']
  },
  contacts: {
    label: 'Contact Management',
    icon: 'PhoneIcon',
    tables: ['contacts_enhanced', 'contacts', 'contact_memberships', 'users', 'user_links']
  }
};

// Helper function to get all fields for a table
export function getTableFields(tableName) {
  return COMPLETE_SCHEMA_MAPPING[tableName]?.fields || [];
}

// Helper function to get display name for a table
export function getTableDisplayName(tableName) {
  return COMPLETE_SCHEMA_MAPPING[tableName]?.displayName || tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to get searchable fields for a table
export function getTableSearchFields(tableName) {
  return COMPLETE_SCHEMA_MAPPING[tableName]?.searchFields || ['id', 'name'];
}

// Helper function to get required fields for a table
export function getTableRequiredFields(tableName) {
  return COMPLETE_SCHEMA_MAPPING[tableName]?.requiredFields || [];
}

// Helper function to get custom field display name
export function getCustomFieldName(fieldName) {
  return FIELD_DISPLAY_NAMES[fieldName] || null;
}

// Helper function to get custom filters for a table
export function getCustomTableFilters(tableName) {
  return CUSTOM_TABLE_FILTERS[tableName]?.customFilters || [];
}

// Helper function to check if table has custom filters
export function hasCustomFilters(tableName) {
  return CUSTOM_TABLE_FILTERS[tableName] && CUSTOM_TABLE_FILTERS[tableName].customFilters.length > 0;
}

// Helper function to apply custom filter logic
export function applyCustomFilter(items, filterConfig, filterValue) {
  if (!filterConfig.filterLogic || !filterValue) return items;
  
  try {
    return filterConfig.filterLogic(items, filterValue, filterConfig);
  } catch (error) {
    console.warn(`Custom filter error for ${filterConfig.key}:`, error);
    return items;
  }
}

// Helper function to format field names for display using custom names
export function formatFieldName(fieldName) {
  // First check if we have a custom display name
  if (FIELD_DISPLAY_NAMES[fieldName]) {
    return FIELD_DISPLAY_NAMES[fieldName];
  }
  
  // Fallback to automatic formatting if no custom name exists
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\bid\b/g, 'ID')
    .replace(/\burl\b/g, 'URL')
    .replace(/\bapi\b/g, 'API')
    .replace(/\bpou\b/g, 'POU')
    .replace(/\bqr\b/g, 'QR')
    .replace(/\bnsf\b/g, 'NSF')
    .replace(/\btds\b/g, 'TDS')
    .replace(/\bro\b/g, 'RO')
    .replace(/\bgpm\b/g, 'GPM')
    .replace(/\bpsi\b/g, 'PSI')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to determine field type for form inputs
export function getFieldType(fieldName) {
  // Email fields
  if (fieldName.includes('email')) return 'email';
  
  // Phone fields  
  if (fieldName.includes('phone') || fieldName.includes('mobile') || fieldName.includes('fax')) return 'tel';
  
  // URL fields
  if (fieldName.includes('url') || fieldName.includes('website')) return 'url';
  
  // Date fields
  if (fieldName.includes('date') || fieldName.includes('_at')) return 'datetime-local';
  
  // Number fields
  if (fieldName.includes('capacity') || fieldName.includes('rating') || fieldName.includes('cost') || 
      fieldName.includes('amount') || fieldName.includes('count') || fieldName.includes('number') ||
      fieldName.includes('gallons') || fieldName.includes('months') || fieldName.includes('days') ||
      fieldName.includes('hours') || fieldName.includes('minutes') || fieldName.includes('lbs') ||
      fieldName.includes('gpm') || fieldName.includes('psi') || fieldName.includes('temperature') ||
      fieldName.includes('latitude') || fieldName.includes('longitude') || fieldName.includes('percent') ||
      fieldName.includes('score') || fieldName.includes('value')) return 'number';
  
  // Boolean fields
  if (fieldName.includes('is_') || fieldName.includes('has_') || fieldName.includes('can_') || 
      fieldName.includes('show_') || fieldName.includes('acknowledged') || fieldName.includes('active') ||
      fieldName.includes('required') || fieldName.includes('certified')) return 'checkbox';
  
  // Text area fields
  if (fieldName.includes('description') || fieldName.includes('notes') || fieldName.includes('message') ||
      fieldName === 'serves_equipment' || fieldName === 'parts_used') return 'textarea';
  
  // Default to text
  return 'text';
}

export default COMPLETE_SCHEMA_MAPPING;
