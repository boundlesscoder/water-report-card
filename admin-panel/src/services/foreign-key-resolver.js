// Foreign Key Resolver Service
// Resolves ID fields to human-readable names from related tables

import api from './api';

// Define foreign key relationships based on database schema
export const FOREIGN_KEY_MAPPINGS = {
  // Core relationships
  account_id: { table: 'accounts', displayField: 'name', label: 'Account' },
  location_id: { table: 'locations', displayField: 'name', label: 'Location' },
  address_id: { table: 'addresses', displayField: 'line1', label: 'Address' },
  manufacturer_id: { table: 'manufacturers', displayField: 'name', label: 'Manufacturer' },
  
  // Customer tiers
  tier1_id: { table: 'customer_tier1', displayField: 'name', label: 'Customer Tier 1' },
  tier2_id: { table: 'customer_tier2', displayField: 'name', label: 'Customer Tier 2' },
  tier3_id: { table: 'customer_tier3', displayField: 'name', label: 'Customer Tier 3' },
  
  // Building hierarchy
  building_id: { table: 'buildings', displayField: 'building_name', label: 'Building' },
  floor_id: { table: 'floors', displayField: 'floor_name', label: 'Floor' },
  room_id: { table: 'building_rooms', displayField: 'room_name', label: 'Room' },
  campus_id: { table: 'customer_campuses', displayField: 'campus_name', label: 'Campus' },
  
  // Parts and assets
  part_id: { table: 'parts_listing', displayField: 'part_name', label: 'Part' },
  category_id: { table: 'asset_categories', displayField: 'name', label: 'Category' },
  asset_id: { table: 'assets', displayField: 'asset_tag', label: 'Asset' },
  parent_part_id: { table: 'parts_listing', displayField: 'part_name', label: 'Parent Part' },
  filter_model_id: { table: 'parts_listing', displayField: 'part_name', label: 'Filter Model' },
  cartridge_id: { table: 'cartridge_components', displayField: 'cartridge_name', label: 'Cartridge' },
  
  // Work orders and maintenance
  work_order_id: { table: 'work_orders', displayField: 'work_order_number', label: 'Work Order' },
  project_id: { table: 'water_filter_projects', displayField: 'project_name', label: 'Project' },
  work_order_type_id: { table: 'work_order_types', displayField: 'name', label: 'Work Order Type' },
  profile_id: { table: 'maintenance_profiles', displayField: 'profile_name', label: 'Maintenance Profile' },
  maintenance_profile_id: { table: 'filter_maintenance_profiles', displayField: 'nsf_standard', label: 'Filter Maintenance Profile' },
  
  // Installations and monitoring
  filter_installation_id: { table: 'filter_installations', displayField: 'location_name', label: 'Filter Installation' },
  installed_cartridge_id: { table: 'installed_cartridges', displayField: 'position_label', label: 'Installed Cartridge' },
  
  // Contacts and users
  contact_id: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Contact' },
  user_id: { table: 'users', displayField: 'email', label: 'User' },
  vendor_id: { table: 'vendors', displayField: 'vendor_name', label: 'Vendor' },
  vendor_type_id: { table: 'vendor_types', displayField: 'name', label: 'Vendor Type' },
  
  // People references
  assigned_to: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Assigned To' },
  requested_by: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Requested By' },
  completed_by: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Completed By' },
  measured_by: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Measured By' },
  detected_by: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Detected By' },
  acknowledged_by: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Acknowledged By' },
  project_manager_id: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Project Manager' },
  service_provider_id: { table: 'accounts', displayField: 'name', label: 'Service Provider' },
  campus_manager_id: { table: 'contacts_enhanced', displayField: 'full_name', label: 'Campus Manager' },
  installed_by: { table: 'vendors', displayField: 'vendor_name', label: 'Installed By' },
  
  // POU and access points
  pou_point_id: { table: 'pou_points', displayField: 'pou_name', label: 'POU Point' },
  
  // Specifications and compatibility
  spec_id: { table: 'equipment_specifications', displayField: 'spec_name', label: 'Specification' },
  compatible_with_part_id: { table: 'parts_listing', displayField: 'part_name', label: 'Compatible With' },
  filter_asset_id: { table: 'assets', displayField: 'asset_tag', label: 'Filter Asset' },
  connected_asset_id: { table: 'assets', displayField: 'asset_tag', label: 'Connected Asset' },
  
  // Work order references
  installation_work_order_id: { table: 'work_orders', displayField: 'work_order_number', label: 'Installation Work Order' },
  work_order_created: { table: 'work_orders', displayField: 'work_order_number', label: 'Work Order Created' },
  installed_as_asset_id: { table: 'assets', displayField: 'asset_tag', label: 'Installed As Asset' },
  alert_id: { table: 'service_alerts', displayField: 'alert_message', label: 'Alert' },
  
  // Catalog references (for legacy views)
  catalog_model_id: { table: 'parts_listing', displayField: 'part_name', label: 'Catalog Model' },
  catalog_cartridge_id: { table: 'cartridge_components', displayField: 'cartridge_name', label: 'Catalog Cartridge' },
  
  // Additional missing mappings
  asset_category_id: { table: 'asset_categories', displayField: 'name', label: 'Asset Category' },
  parent_category_id: { table: 'asset_categories', displayField: 'name', label: 'Parent Category' }
};

// Cache for resolved names to avoid repeated API calls
const resolvedNamesCache = new Map();
const cacheExpiry = 5 * 60 * 1000; // 5 minutes

// Helper to determine if a field is a foreign key
export function isForeignKeyField(fieldName) {
  return FOREIGN_KEY_MAPPINGS.hasOwnProperty(fieldName);
}

// Get foreign key configuration for a field
export function getForeignKeyConfig(fieldName) {
  return FOREIGN_KEY_MAPPINGS[fieldName];
}

// Resolve a single ID to its display name
export async function resolveIdToName(fieldName, id) {
  if (!id || !isForeignKeyField(fieldName)) {
    return id;
  }
  
  const config = getForeignKeyConfig(fieldName);
  const cacheKey = `${config.table}_${id}`;
  
  // Check cache first
  const cached = resolvedNamesCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < cacheExpiry)) {
    return cached.name;
  }
  
  try {
    // Try business lookup API first (most efficient), fallback to data API, then generic API
    let response;
    
    try {
      // Try the lookup endpoint first - this is specifically designed for foreign key resolution
      const lookupUrl = `/api/admin/business/tables/${config.table}/lookup?limit=1000`;
      response = await api.get(lookupUrl);
      
      if (response.data?.success && response.data.data) {
        const items = response.data.data;
        
        const item = items.find(item => item.id === id);
        
        if (item) {
          let displayName = item.display_name || item[config.displayField] || item.name || item.id;
          
          // Cache the result
          resolvedNamesCache.set(cacheKey, {
            name: displayName,
            timestamp: Date.now()
          });
          
          return displayName;
        } else {
          console.warn(`❌ Could not find ${fieldName} with ID ${id} in lookup data`);
        }
      }
    } catch (lookupApiError) {
      
      try {
        // Fallback to data endpoint
        const businessUrl = `/api/admin/business/tables/${config.table}/data?pageSize=1000`;
        response = await api.get(businessUrl);
        
        if (response.data?.success && response.data.data) {
          const items = Array.isArray(response.data.data) ? response.data.data : 
                       response.data.data.items || [];
          
          const item = items.find(item => item.id === id);
          
          if (item) {
            let displayName = item[config.displayField] || item.name || item.id;
            
            // For addresses, create a more readable format
            if (config.table === 'addresses') {
              displayName = `${item.line1 || ''}${item.city ? `, ${item.city}` : ''}${item.state ? `, ${item.state}` : ''}`.trim();
            }
            
            // Cache the result
            resolvedNamesCache.set(cacheKey, {
              name: displayName,
              timestamp: Date.now()
            });
            
            return displayName;
          }
        }
      } catch (businessApiError) {
        
        try {
          // Final fallback to generic admin API
          const genericUrl = `/api/admin/entities/${config.table}/rows?pageSize=1000`;
          response = await api.get(genericUrl);
          
          if (response.data?.success && response.data.data) {
            const items = Array.isArray(response.data.data) ? response.data.data : 
                         response.data.data.items || [];
            const item = items.find(item => item.id === id);
            
            if (item) {
              let displayName = item[config.displayField] || item.name || item.id;
              
              // Cache the result
              resolvedNamesCache.set(cacheKey, {
                name: displayName,
                timestamp: Date.now()
              });
            
              return displayName;
            }
          }
        } catch (genericError) {
          console.error(`All APIs failed for ${fieldName} resolution:`, genericError);
        }
      }
    }
    
    console.warn(`❌ Could not resolve ${fieldName} with ID ${id} using any API endpoint`);
  } catch (error) {
    console.warn(`Failed to resolve ${fieldName} ID ${id}:`, error);
  }
  
  return id; // Fallback to showing the ID if resolution fails
}

// Resolve multiple IDs for a single field type
export async function resolveMultipleIds(fieldName, ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {};
  }
  
  const config = getForeignKeyConfig(fieldName);
  const uniqueIds = [...new Set(ids.filter(id => id))];
  const results = {};
  
  
  try {
    // Try to get all data at once instead of individual lookups
    let response;
    let allItems = [];
    
    try {
      // Try lookup API first
      response = await api.get(`/api/admin/business/tables/${config.table}/lookup?limit=1000`);
      if (response.data?.success && response.data.data) {
        allItems = response.data.data;
        
        // Build results from lookup data
        uniqueIds.forEach(id => {
          const item = allItems.find(item => item.id === id);
          if (item) {
            results[id] = item.display_name || item[config.displayField] || item.name || id;
          } else {
            results[id] = id;
            console.warn(`❌ Could not find ${fieldName} ${id} in lookup data`);
          }
        });
        
        return results;
      }
    } catch (lookupError) {
      console.warn(`❌ Bulk lookup failed for ${fieldName}:`, lookupError.response?.status);
    }
    
    try {
      // Fallback to data API
      response = await api.get(`/api/admin/business/tables/${config.table}/data?pageSize=1000`);
      if (response.data?.success && response.data.data) {
        allItems = Array.isArray(response.data.data) ? response.data.data : 
                   response.data.data.items || [];
        
        // Build results from data API
        uniqueIds.forEach(id => {
          const item = allItems.find(item => item.id === id);
          if (item) {
            let displayName = item[config.displayField] || item.name || id;
            
            // For addresses, create a more readable format
            if (config.table === 'addresses') {
              displayName = `${item.line1 || ''}${item.city ? `, ${item.city}` : ''}${item.state ? `, ${item.state}` : ''}`.trim();
            }
            
            results[id] = displayName;
          } else {
            results[id] = id;
            console.warn(`❌ Could not find ${fieldName} ${id} in data API response`);
          }
        });
        
        return results;
      }
    } catch (dataError) {
      console.warn(`❌ Bulk data API failed for ${fieldName}:`, dataError.response?.status);
    }
    
    try {
      // Final fallback to generic admin API
      response = await api.get(`/api/admin/entities/${config.table}/rows?pageSize=1000`);
      if (response.data?.success && response.data.data) {
        allItems = Array.isArray(response.data.data) ? response.data.data : 
                   response.data.data.items || [];
        
        // Build results from generic API
        uniqueIds.forEach(id => {
          const item = allItems.find(item => item.id === id);
          if (item) {
            const displayName = item[config.displayField] || item.name || id;
            results[id] = displayName;
          } else {
            results[id] = id;
            console.warn(`❌ Could not find ${fieldName} ${id} in generic API response`);
          }
        });
        
        return results;
      }
    } catch (genericError) {
      console.warn(`❌ All bulk APIs failed for ${fieldName}:`, genericError);
    }
    
  } catch (error) {
    console.error(`❌ Error in resolveMultipleIds for ${fieldName}:`, error);
  }
  
  // If all APIs fail, return IDs as-is
  console.warn(`❌ All resolution attempts failed for ${fieldName}, returning raw IDs`);
  uniqueIds.forEach(id => {
    results[id] = id;
  });
  
  return results;
}

// Resolve all foreign keys in a data row
export async function resolveRowForeignKeys(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }
  
  const resolvedRow = { ...row };
  const foreignKeyFields = Object.keys(row).filter(isForeignKeyField);
  
  if (foreignKeyFields.length === 0) {
    return resolvedRow;
  }
  
  // Resolve all foreign keys concurrently
  const promises = foreignKeyFields.map(async (fieldName) => {
    const id = row[fieldName];
    const resolvedName = await resolveIdToName(fieldName, id);
    return { fieldName, resolvedName };
  });
  
  const results = await Promise.all(promises);
  
  // Add resolved names to the row
  results.forEach(({ fieldName, resolvedName }) => {
    resolvedRow[`${fieldName}_resolved`] = resolvedName;
  });
  
  return resolvedRow;
}

// Resolve foreign keys for an array of data rows
export async function resolveArrayForeignKeys(data) {
  
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }
  
  
  // Get all unique foreign key fields and their IDs across all rows
  const foreignKeyData = {};
  
  data.forEach((row, index) => {
    Object.keys(row).forEach(fieldName => {
      if (isForeignKeyField(fieldName) && row[fieldName]) {
        if (!foreignKeyData[fieldName]) {
          foreignKeyData[fieldName] = new Set();
        }
        foreignKeyData[fieldName].add(row[fieldName]);
        if (index === 0) {
        }
      }
    });
  });
  
  
  // Resolve all unique IDs for each foreign key field
  const resolvedMaps = {};
  const resolvePromises = Object.entries(foreignKeyData).map(async ([fieldName, idsSet]) => {
    const ids = Array.from(idsSet);
    const resolvedMap = await resolveMultipleIds(fieldName, ids);
    resolvedMaps[fieldName] = resolvedMap;
  });
  
  await Promise.all(resolvePromises);
  
  
  // Apply resolved names to all rows
  const resolvedData = data.map(row => {
    const resolvedRow = { ...row };
    
    Object.keys(resolvedMaps).forEach(fieldName => {
      const id = row[fieldName];
      if (id && resolvedMaps[fieldName][id]) {
        resolvedRow[`${fieldName}_resolved`] = resolvedMaps[fieldName][id];
      }
    });
    
    return resolvedRow;
  });
  
  return resolvedData;
}

// Get options for a foreign key dropdown
export async function getForeignKeyOptions(fieldName) {
  if (!isForeignKeyField(fieldName)) {
    return [];
  }
  
  const config = getForeignKeyConfig(fieldName);
  
  try {
    // Try business lookup API first (most efficient)
    let response;
    try {
      response = await api.get(`/api/admin/business/tables/${config.table}/lookup?limit=1000`);
      
      if (response.data?.success && response.data.data) {
        const items = response.data.data;
        
        const options = items.map(item => ({
          value: item.id,
          label: item.display_name || item[config.displayField] || item.name || item.id
        })).sort((a, b) => a.label.localeCompare(b.label));
        
        return options;
      }
    } catch (lookupApiError) {
      console.warn(`Lookup API failed for ${fieldName} options:`, lookupApiError.response?.status);
      
      try {
        // Fallback to business data API
        response = await api.get(`/api/admin/business/tables/${config.table}/data?pageSize=1000`);  
        
        if (response.data?.success && response.data.data) {
          const items = Array.isArray(response.data.data) ? response.data.data : 
                       response.data.data.items || [];
          
          const options = items.map(item => {
            let displayName = item[config.displayField] || item.name || item.id;
            
            // For addresses, create a more readable format
            if (config.table === 'addresses') {
              displayName = `${item.line1 || ''}${item.city ? `, ${item.city}` : ''}${item.state ? `, ${item.state}` : ''}`.trim();
            }
            
            return {
              value: item.id,
              label: displayName
            };
          }).sort((a, b) => a.label.localeCompare(b.label));
          
          return options;
        }
      } catch (businessApiError) {
        console.warn(`Business API failed for ${fieldName} options:`, businessApiError.response?.status);
        
        try {
          // Final fallback to generic admin API
          response = await api.get(`/api/admin/entities/${config.table}/rows?pageSize=1000`);
          
          if (response.data?.success && response.data.data) {
            const items = Array.isArray(response.data.data) ? response.data.data : 
                         response.data.data.items || [];
            
            const options = items.map(item => ({
              value: item.id,
              label: item[config.displayField] || item.name || item.id
            })).sort((a, b) => a.label.localeCompare(b.label));
            
            
            return options;
          }
        } catch (genericError) {
          console.error(`All APIs failed for ${fieldName} options:`, genericError);
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to fetch options for ${fieldName}:`, error);
  }
  
  return [];
}

// Clear the cache (useful for testing or after data updates)
export function clearResolverCache() {
  resolvedNamesCache.clear();
}

// Test function to verify foreign key resolution
export async function testLocationResolution() {  
  
  // Try to get location options
  try {
    const locationOptions = await getForeignKeyOptions('location_id');
    
  } catch (error) {
    console.error('Error getting location options:', error);
  }
  
  // Test direct API calls to see what endpoints exist
  
  
  try {
    const lookupResponse = await api.get('/api/admin/business/tables/locations/lookup?limit=10');
    
  } catch (lookupError) {
    console.warn('❌ Business lookup API failed:', lookupError.response?.status, lookupError.response?.data || lookupError.message);
    
    try {
      const businessResponse = await api.get('/api/admin/business/tables/locations/data?pageSize=10');
      
    } catch (businessError) {
      console.warn('❌ Business data API failed:', businessError.response?.status, businessError.response?.data || businessError.message);
      
      try {
        const genericResponse = await api.get('/api/admin/entities/locations/rows?pageSize=10');
        
      } catch (genericError) {
        console.error('❌ All location API endpoints failed!', genericError.response?.status, genericError.response?.data || genericError.message);
      }
    }
  }
}

const foreignKeyResolver = {
  isForeignKeyField,
  getForeignKeyConfig,
  resolveIdToName,
  resolveMultipleIds,
  resolveRowForeignKeys,
  resolveArrayForeignKeys,
  getForeignKeyOptions,
  clearResolverCache
};

export default foreignKeyResolver;
