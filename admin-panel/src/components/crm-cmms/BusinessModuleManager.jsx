'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
  BUSINESS_MODULE_MAPPINGS, 
  getTableFields, 
  getTableDisplayName, 
  getTableSearchFields,
  formatFieldName,
  getFieldType 
} from '../../services/complete-schema-mapping';
import {
  isForeignKeyField,
  getForeignKeyConfig,
  resolveArrayForeignKeys,
  getForeignKeyOptions,
  testLocationResolution
} from '../../services/foreign-key-resolver';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
} from '@heroicons/react/24/outline';

const BusinessModuleManager = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shared pagination state (matching existing CRM style)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  
  // Field-specific filters state
  const [fieldFilters, setFieldFilters] = useState({});
  const [filterValues, setFilterValues] = useState({});
  const [columnOrder, setColumnOrder] = useState([]);
  const [draggedColumn, setDraggedColumn] = useState(null);

  // Data state per module
  const [modulesData, setModulesData] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ items: [], total: 0 });
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Foreign key options for dropdowns
  const [foreignKeyOptions, setForeignKeyOptions] = useState({});

  // Form state for create/edit
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState({});
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [dependencyInfo, setDependencyInfo] = useState(null);

  // Use the complete business modules configuration from schema mapping
  const businessModules = BUSINESS_MODULE_MAPPINGS;

  // Load data when table selection changes
  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, page, itemsPerPage);
    }
  }, [selectedTable]);

  // Load filters immediately when table is selected (don't wait for data)
  useEffect(() => {
    if (selectedTable) {
      loadFieldFilterOptions(selectedTable, false);
    }
  }, [selectedTable]);

  // Update filters when data is loaded
  useEffect(() => {
    if (selectedTable && tableData.items && tableData.items.length > 0) {
      loadFieldFilterOptions(selectedTable, true);
    }
  }, [selectedTable, tableData.items]);

  // Reload data when page or itemsPerPage changes
  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, page, itemsPerPage);
    }
  }, [page, itemsPerPage]);

  // Reload data when filters change (debounced)
  useEffect(() => {
    if (selectedTable && Object.keys(filterValues).length > 0) {
      const timeoutId = setTimeout(() => {
        loadTableData(selectedTable, 1, itemsPerPage); // Reset to page 1 when filtering
        setPage(1);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [filterValues]);

  // Load table data from API
  const loadTableData = async (tableName, page = 1, itemsPerPage = 50) => {
    if (!tableName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      // Try business API first, fallback to existing admin API
      let url = `/api/admin/business/tables/${tableName}/data?${params.toString()}`;
      let res;
      
      try {
        res = await api.get(url);
      } catch (businessApiError) {
        // Fallback to existing admin CRUD API
        url = `/api/admin/entities/${tableName}/rows?${params.toString()}`;
        res = await api.get(url);
      }
      
      if (res.data?.success) {
        const data = res.data.data;
        const items = data.items || data;
        const itemsArray = Array.isArray(items) ? items : [items];
        
        // Resolve foreign keys to human-readable names
        const resolvedItems = await resolveArrayForeignKeys(itemsArray);
        
        const tableDataToSet = { 
          items: resolvedItems, 
          total: data.total || (data.items ? data.items.length : (Array.isArray(data) ? data.length : 0))
        };
        setTableData(tableDataToSet);
      } else {
        throw new Error(res.data?.error || res.data?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  // Load business-focused field filter options based on actual database schema
  const loadFieldFilterOptions = async (tableName, hasData = false) => {
    if (!tableName) return;
    
    const fields = getTableFields(tableName);
    
    // Define business-relevant filterable fields based on actual database schema
    const getBusinessFilterableFields = (table) => {
      const businessFieldPatterns = {
        // Status and categorical fields
        status: ['status', 'work_type', 'priority', 'project_type', 'installation_type', 'leak_type', 'leak_severity', 'measurement_method', 'recommended_action'],
        // Location and geographical fields
        location: ['region', 'location_type', 'route_code', 'city', 'state', 'country', 'cached_city', 'cached_state'],
        // Foreign keys (relationships)
        foreign_keys: fields.filter(isForeignKeyField),
        // Business identifiers
        identifiers: ['account_number', 'project_code', 'work_order_number', 'serial_number', 'code'],
        // Names and labels
        names: ['name', 'project_name', 'location_name', 'position_label', 'title'],
        // Business dates (not system dates)
        business_dates: ['start_date', 'target_completion_date', 'installation_date', 'measurement_date', 'detection_date', 'scheduled_date', 'warranty_expiry_date'],
        // Numeric business values
        business_numbers: ['budget_amount', 'actual_cost', 'stage_position', 'expected_lifespan_months', 'current_usage_gallons', 'tds_reduction_percent', 'performance_rating']
      };
      
      const relevantFields = new Set();
      
      // Add all business field patterns
      Object.values(businessFieldPatterns).forEach(fieldList => {
        if (Array.isArray(fieldList)) {
          fieldList.forEach(field => {
            if (fields.includes(field)) {
              relevantFields.add(field);
            }
          });
        }
      });
      
      // Add fields that match business patterns
      fields.forEach(field => {
        // Skip system fields
        if (['id', 'created_at', 'updated_at', 'geom', 'search_vector'].includes(field)) return;
        
        // Include if matches business patterns
        const isBusinessRelevant = 
          field.includes('status') || 
          field.includes('type') || 
          field.includes('priority') || 
          field.includes('code') || 
          field.includes('number') || 
          field.includes('name') || 
          field.includes('region') || 
          field.includes('city') || 
          field.includes('state') || 
          field.includes('country') ||
          isForeignKeyField(field);
          
        if (isBusinessRelevant) {
          relevantFields.add(field);
        }
      });
      
      return Array.from(relevantFields);
    };
    
    const filterableFields = getBusinessFilterableFields(tableName);
    const fieldOptions = {};
    
    filterableFields.forEach(field => {
      const fieldType = getFieldType(field);
      const isForeignKey = isForeignKeyField(field);
      
      // Get all values for this field (only if we have data)
      let allValues = [];
      let uniqueValues = [];
      
      if (hasData && tableData.items && tableData.items.length > 0) {
        allValues = tableData.items
          .map(item => item[field])
          .filter(value => value !== null && value !== undefined && value !== '');
        uniqueValues = [...new Set(allValues)].sort();
      }
      
      // Determine filter type based on field characteristics
      let filterType = 'dropdown'; // default
      let options = [];
      
      if (isForeignKey) {
        // Foreign key fields - use resolved names if available
        filterType = 'foreign_key';
        if (hasData && tableData.items && tableData.items.length > 0) {
          const resolvedValues = [...new Set(
            tableData.items
              .map(item => item[`${field}_resolved`] || item[field])
              .filter(value => value !== null && value !== undefined && value !== '')
          )].sort();
          
          options = resolvedValues.map(value => ({
            value: tableData.items.find(item => 
              (item[`${field}_resolved`] || item[field]) === value
            )?.[field] || value,
            label: String(value).length > 60 ? String(value).substring(0, 60) + '...' : String(value),
            displayValue: value
          }));
        } else {
          // Create empty foreign key filter for now
          options = [];
        }
      } else if (field.includes('date') && !field.includes('_at')) {
        // Business date fields (not system timestamps)
        filterType = 'date_range';
        if (hasData && allValues.length > 0) {
          const dates = allValues.filter(v => v && !isNaN(Date.parse(v))).map(v => new Date(v));
          if (dates.length > 0) {
            options = {
              min: new Date(Math.min(...dates)).toISOString().split('T')[0],
              max: new Date(Math.max(...dates)).toISOString().split('T')[0]
            };
          }
        } else {
          options = [];
        }
      } else if ((fieldType === 'number' || (hasData && uniqueValues.length > 0 && uniqueValues.every(v => !isNaN(parseFloat(v)) && isFinite(v)))) && 
                 (field.includes('amount') || field.includes('cost') || field.includes('gallons') || field.includes('percent') || field.includes('rating'))) {
        // Business numeric fields with range filtering
        filterType = 'number_range';
        if (hasData && allValues.length > 0) {
          const numbers = allValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
          if (numbers.length > 0) {
            options = {
              min: Math.min(...numbers),
              max: Math.max(...numbers)
            };
          }
        } else {
          options = [];
        }
      } else if (hasData && uniqueValues.length > 0 && uniqueValues.length <= 50) {
        // Categorical fields with reasonable number of options - dropdown
        filterType = 'dropdown';
        options = uniqueValues.map(value => ({
          value: value,
          label: String(value).length > 50 ? String(value).substring(0, 50) + '...' : String(value)
        }));
      } else if (field.includes('name') || field.includes('title') || field.includes('description')) {
        // Text fields for names/descriptions - searchable
        filterType = 'text_search';
        if (hasData && uniqueValues.length > 0) {
          options = uniqueValues.slice(0, 5).map(value => ({ // Show top 5 as suggestions
            value: value,
            label: String(value).length > 50 ? String(value).substring(0, 50) + '...' : String(value)
          }));
        } else {
          options = [];
        }
      } else {
        // Default to text search for unknown fields
        filterType = 'text_search';
        options = [];
      }
      
      // Always add the filter (even with empty options initially)
      fieldOptions[field] = {
        type: filterType,
        options: options,
        fieldType: fieldType,
        isForeignKey: isForeignKey
      };
    });
    
    setFieldFilters(fieldOptions);
  };

  // Load foreign key options for form dropdowns
  const loadForeignKeyOptions = async (tableName) => {
    const fields = getTableFields(tableName);
    const foreignKeyFields = fields.filter(isForeignKeyField);
    
    if (foreignKeyFields.length === 0) return;
    
    const options = {};
    const promises = foreignKeyFields.map(async (fieldName) => {
      const fieldOptions = await getForeignKeyOptions(fieldName);
      options[fieldName] = fieldOptions;
    });
    
    await Promise.all(promises);
    setForeignKeyOptions(prev => ({ ...prev, [tableName]: options }));
  };

  const fetchTableData = async (tableName) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ 
        page: String(page), 
        pageSize: String(pageSize)
      });
      if (search) params.append('search', search);
      
      // Try business API first, fallback to existing admin API
      let url = `/api/admin/business/tables/${tableName}/data?${params.toString()}`;
      let res;
      
      try {
        res = await api.get(url);
      } catch (businessApiError) {
        // Fallback to existing admin CRUD API
        url = `/api/admin/entities/${tableName}/rows?${params.toString()}`;
        res = await api.get(url);
      }
      
      if (res.data?.success) {
        const data = res.data.data;
        const items = data.items || data;
        const itemsArray = Array.isArray(items) ? items : [items];
        
        // Resolve foreign keys to human-readable names
        const resolvedItems = await resolveArrayForeignKeys(itemsArray);
        
        const tableDataToSet = { 
          items: resolvedItems, 
          total: data.total || (data.items ? data.items.length : (Array.isArray(data) ? data.length : 0))
        };
        setTableData(tableDataToSet);
      } else {
        throw new Error(res.data?.error || res.data?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Function to apply business-focused field filters to the data
  const applyFieldFilters = (items) => {
    if (Object.keys(filterValues).length === 0) {
      return items;
    }
    
    if (Object.keys(fieldFilters).length === 0) {
      return items;
    }
    
    const filteredItems = items.filter(item => {
      const matches = Object.entries(filterValues).every(([field, filterConfig]) => {
        if (!filterConfig || (typeof filterConfig === 'string' && !filterConfig)) {
          return true;
        }
        
        const fieldInfo = fieldFilters[field];
        const itemValue = item[field];
        
        if (!fieldInfo) {
          return true;
        }
        
        let matches = false;
        
        switch (fieldInfo.type) {
          case 'dropdown':
          case 'foreign_key':
            matches = String(itemValue) === String(filterConfig);
            break;
            
          case 'date_range':
            if (!filterConfig.from && !filterConfig.to) {
              matches = true;
            } else {
              const itemDate = new Date(itemValue);
              if (isNaN(itemDate)) {
                matches = true;
              } else {
                const fromMatch = !filterConfig.from || itemDate >= new Date(filterConfig.from);
                const toMatch = !filterConfig.to || itemDate <= new Date(filterConfig.to);
                matches = fromMatch && toMatch;
              }
            }
            break;
            
          case 'number_range':
            if (!filterConfig.min && !filterConfig.max) {
              matches = true;
            } else {
              const numValue = parseFloat(itemValue);
              if (isNaN(numValue)) {
                matches = true;
              } else {
                const minMatch = filterConfig.min === '' || filterConfig.min === null || numValue >= parseFloat(filterConfig.min);
                const maxMatch = filterConfig.max === '' || filterConfig.max === null || numValue <= parseFloat(filterConfig.max);
                matches = minMatch && maxMatch;
              }
            }
            break;
            
          case 'text_search':
            matches = String(itemValue).toLowerCase().includes(String(filterConfig).toLowerCase());
            break;
            
          default:
            matches = String(itemValue) === String(filterConfig);
            break;
        }
        
        return matches;
      });
      
      return matches;
    });
    
    return filteredItems;
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
      loadForeignKeyOptions(selectedTable);
      
      // Test location resolution for debugging
      if (selectedTable === 'assets' || selectedTable === 'buildings' || selectedTable === 'service_alerts') {
        testLocationResolution();
      }
    } else {
    }
  }, [selectedTable, page, pageSize, search]);

  // Clear field filters when table changes
  useEffect(() => {
    setFilterValues({});
    setFieldFilters({});
    // Reset column order when table changes
    if (selectedTable) {
      const defaultOrder = getColumnsForTable(selectedTable);
      setColumnOrder(defaultOrder);
      // Try to load saved column order from localStorage
      const savedOrder = localStorage.getItem(`columnOrder_${selectedTable}`);
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          // Validate that saved columns still exist in current table
          const currentColumns = defaultOrder;
          const validSavedColumns = parsedOrder.filter(col => 
            currentColumns.some(c => c === col)
          );
          // Add any new columns that weren't in saved order
          const newColumns = currentColumns.filter(col => 
            !validSavedColumns.includes(col)
          );
          setColumnOrder([...validSavedColumns, ...newColumns]);
        } catch (e) {
          console.warn('Failed to parse saved column order:', e);
          setColumnOrder(defaultOrder);
        }
      }
    }
  }, [selectedTable]);

  // Debug effect to monitor filter changes
  useEffect(() => {
  }, [filterValues, fieldFilters]);

  // Set default table when module changes
  useEffect(() => {
    const module = businessModules[activeTab];
    if (module && module.tables.length > 0) {
      setSelectedTable(module.tables[0]);
      setPage(1);
    } else {
    }
  }, [activeTab]);

  const resetForm = () => { 
    setEditingRow(null); 
    setForm({}); 
  };

  const onEdit = (row) => { 
    setEditingRow(row); 
    setForm(row); 
    setModalOpen(true); 
  };

  const onDelete = (row) => {
    setItemToDelete(row);
    setCascadeDelete(false);
    setDependencyInfo(null);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Build API URL with cascade parameter if needed
      const cascadeParam = cascadeDelete ? '?cascade=true' : '';
      const deleteUrl = `/api/admin/business/tables/${selectedTable}/records/${itemToDelete.id}${cascadeParam}`;
      
      // Try business API first, fallback to existing admin API
      try {
        const response = await api.delete(deleteUrl);
        
        // Show success message with cascade info if available
        if (response.data.cascadeDeleted) {
          const totalDeleted = response.data.totalDeleted || 1;
        } else {
        }
        
      } catch (businessApiError) {
        console.error('Business API delete failed:', businessApiError);
        
        // Check if it's a foreign key constraint error
        if (businessApiError.response?.status === 409) {
          const errorData = businessApiError.response.data;
          
          // If cascade option is available and we haven't tried cascade yet, offer cascade delete
          if (errorData.cascadeOption && !cascadeDelete) {
            setDependencyInfo(errorData);
            return; // Don't close modal, let user choose cascade option
          }
          
          // Show detailed error with dependency information
          let errorMessage = errorData.error || 'Cannot delete record because it is referenced by other records';
          if (errorData.details && Array.isArray(errorData.details)) {
            const dependencyList = errorData.details.map(dep => `${dep.count} records in ${dep.table}`).join(', ');
            errorMessage = `Cannot delete this ${getTableDisplayName(selectedTable).toLowerCase().slice(0, -1)} because it has dependent records: ${dependencyList}.`;
          }
          
          throw new Error(errorMessage);
        }
        
        // Try fallback to existing admin CRUD API
        try {
          await api.delete(`/api/admin/entities/${selectedTable}/rows/${itemToDelete.id}`);
        } catch (fallbackError) {
          console.error('Fallback API delete failed:', fallbackError);
          
          // Handle fallback API errors
          if (fallbackError.response?.status === 409) {
            throw new Error('Cannot delete record because it is referenced by other records');
          } else if (fallbackError.response?.status === 500) {
            throw new Error('Server error occurred while deleting record');
          }
          
          throw fallbackError;
        }
      }
      
      // Success - refresh data and close modal
      loadTableData(selectedTable, page, itemsPerPage);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setCascadeDelete(false);
      setDependencyInfo(null);
      
    } catch (err) {
      console.error('Delete operation failed:', err);
      
      // Set user-friendly error message
      let errorMessage = 'Delete failed';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 409) {
        errorMessage = 'Cannot delete this record because other records depend on it';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred while deleting record';
      }
      
      setError(errorMessage);
      
      // Close modal
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setCascadeDelete(false);
      setDependencyInfo(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    setCascadeDelete(false);
    setDependencyInfo(null);
  };

  // Column drag and drop handlers
  const handleDragStart = (e, columnIndex) => {
    setDraggedColumn(columnIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedColumn === null || draggedColumn === targetIndex) {
      return;
    }

    const newColumnOrder = [...displayColumns];
    const draggedItem = newColumnOrder[draggedColumn];
    
    // Remove dragged item
    newColumnOrder.splice(draggedColumn, 1);
    
    // Insert at target position
    const insertIndex = draggedColumn < targetIndex ? targetIndex - 1 : targetIndex;
    newColumnOrder.splice(insertIndex, 0, draggedItem);
    
    setColumnOrder(newColumnOrder);
    
    // Save to localStorage
    if (selectedTable) {
      localStorage.setItem(`columnOrder_${selectedTable}`, JSON.stringify(newColumnOrder));
    }
  };

  const resetColumnOrder = () => {
    if (selectedTable) {
      const defaultOrder = getColumnsForTable(selectedTable);
      setColumnOrder(defaultOrder);
      localStorage.removeItem(`columnOrder_${selectedTable}`);  
    }
  };

  const onSave = async () => {
    try {
      // Try business API first, fallback to existing admin API
      try {
        if (editingRow?.id) {
          await api.put(`/api/admin/business/tables/${selectedTable}/records/${editingRow.id}`, form);
        } else {
          await api.post(`/api/admin/business/tables/${selectedTable}/records`, form);
        }
      } catch (businessApiError) {
        // Fallback to existing admin CRUD API
        if (editingRow?.id) {
          await api.put(`/api/admin/entities/${selectedTable}/rows/${editingRow.id}`, form);
        } else {
          await api.post(`/api/admin/entities/${selectedTable}/rows`, form);
        }
      }
      
      resetForm();
      setModalOpen(false);
      fetchTableData(selectedTable);
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  // Get columns for current table using the complete schema mapping
  const getColumnsForTable = (tableName) => {
    const allFields = getTableFields(tableName);
    
    // Filter out only technical/system fields that aren't useful for users
    const systemFields = ['id', 'created_at', 'updated_at', 'geom', 'search_vector'];
    let displayFields = allFields.filter(field => !systemFields.includes(field));
    
    // Custom column ordering for specific tables
    if (tableName === 'work_orders') {
      // Move work_order_type_id to the very front (this is the "Work Order Type" dropdown)
      const workOrderTypeIndex = displayFields.indexOf('work_order_type_id');
      if (workOrderTypeIndex > -1) {
        const workOrderTypeField = displayFields.splice(workOrderTypeIndex, 1)[0];
        displayFields = [workOrderTypeField, ...displayFields];
      }
      
      // Also move work_type to second position
      const workTypeIndex = displayFields.indexOf('work_type');
      if (workTypeIndex > -1) {
        const workTypeField = displayFields.splice(workTypeIndex, 1)[0];
        displayFields = [displayFields[0], workTypeField, ...displayFields.slice(1)];
      }
    }
    
    // Show ALL fields since we have horizontal scrolling
    return displayFields;
  };

  const columns = selectedTable ? getColumnsForTable(selectedTable) : [];
  const currentModule = businessModules[activeTab];
  
  // Use columnOrder if available, otherwise fallback to columns
  const displayColumns = columnOrder.length > 0 ? columnOrder : columns;

  // Helper functions for business filters
  const getBusinessFilterTitle = (tableName) => {
    const titles = {
      'accounts': 'Customer Account',
      'locations': 'Location & Geography',
      'buildings': 'Building & Facility',
      'floors': 'Floor & Space',
      'building_rooms': 'Room & Area',
      'assets': 'Equipment & Asset',
      'parts_listing': 'Parts Catalog',
      'manufacturers': 'Manufacturer',
      'work_orders': 'Work Order & Service',
      'service_alerts': 'Alert & Notification',
      'water_quality_metrics': 'Water Quality',
      'filter_installations': 'Filter Installation',
      'installed_cartridges': 'Cartridge Management',
      'contacts_enhanced': 'Contact Management',
      'vendors': 'Vendor & Supplier',
      'customer_tier1': 'Customer Category',
      'customer_tier2': 'Customer Type',
      'customer_tier3': 'Customer Subtype',
      'pou_points': 'Point of Use',
      'telemetry_readings': 'Sensor Data',
      'addresses': 'Address & Geography',
      'floors': 'Floor Management',
      'building_rooms': 'Room Management',
      'public_access_points': 'Public Access & QR'
    };
    return titles[tableName] || 'Data';
  };

  const getActiveFilterCount = () => {
    return Object.keys(filterValues).filter(key => {
      const val = filterValues[key];
      if (!val) return false;
      if (typeof val === 'string') return val.trim() !== '';
      if (typeof val === 'object') return Object.values(val).some(v => v);
      return true;
    }).length;
  };

  // Business filter configurations based on CRM/CMMS needs
  const getBusinessFilters = (tableName) => {
    const businessFilters = {
      'accounts': [
        { category: 'Customer Classification', filters: ['tier1_id', 'tier2_id', 'tier3_id', 'status'] },
        { category: 'Location', filters: ['billing_state', 'billing_city'] },
        { category: 'Business Info', filters: ['account_number'] }
      ],
      'locations': [
        { category: 'Geographic Location', filters: ['cached_state', 'cached_city', 'region'] },
        { category: 'Service Area', filters: ['route_code', 'location_type'] },
        { category: 'Status & Operations', filters: ['status', 'account_id'] }
      ],
      'buildings': [
        { category: 'Building Details', filters: ['building_type', 'year_built'] },
        { category: 'Water System', filters: ['water_system_type', 'primary_pwsid'] },
        { category: 'Location', filters: ['location_id'] }
      ],
      'assets': [
        { category: 'Asset Status', filters: ['asset_status', 'condition_rating'] },
        { category: 'Equipment Type', filters: ['part_id'] },
        { category: 'Location', filters: ['account_id', 'location_id', 'building_id'] },
        { category: 'Maintenance', filters: ['maintenance_interval_months', 'next_maintenance_date'] }
      ],
      'work_orders': [
        { category: 'Work Order Status', filters: ['status', 'priority', 'work_type'] },
        { category: 'Assignment', filters: ['assigned_to', 'vendor_id'] },
        { category: 'Scheduling', filters: ['scheduled_date', 'requested_date'] },
        { category: 'Location', filters: ['project_id', 'filter_installation_id'] }
      ],
      'service_alerts': [
        { category: 'Alert Priority', filters: ['alert_severity', 'priority', 'status'] },
        { category: 'Alert Type', filters: ['alert_type', 'alert_category'] },
        { category: 'Response', filters: ['acknowledged', 'acknowledged_by'] },
        { category: 'Location', filters: ['asset_id', 'location_id'] }
      ],
      'water_quality_metrics': [
        { category: 'Water Quality', filters: ['tds_reduction_percent', 'ph_inlet', 'ph_outlet'] },
        { category: 'System Performance', filters: ['flow_rate_gpm', 'ro_psi_inlet', 'ro_psi_outlet'] },
        { category: 'Testing', filters: ['measurement_method', 'measured_by', 'measurement_date'] },
        { category: 'Location', filters: ['filter_installation_id'] }
      ],
      'parts_listing': [
        { category: 'Part Classification', filters: ['category_id', 'part_type'] },
        { category: 'Specifications', filters: ['purifier_type', 'has_ro', 'nsf_certified'] },
        { category: 'Status', filters: ['status', 'warranty_months'] }
      ],
      'contacts_enhanced': [
        { category: 'Contact Type', filters: ['contact_type', 'account_id', 'vendor_id'] },
        { category: 'Role & Access', filters: ['is_primary', 'can_login', 'status'] },
        { category: 'Communication', filters: ['preferred_contact_method', 'department'] }
      ],
      'addresses': [
        { category: 'Geographic Location', filters: ['state', 'city', 'postal_code', 'country'] },
        { category: 'Address Details', filters: ['line1', 'line2'] },
        { category: 'Water System', filters: ['pwsid'] }
      ],
      'floors': [
        { category: 'Floor Details', filters: ['floor_number', 'floor_name', 'floor_type'] },
        { category: 'Capacity & Usage', filters: ['square_footage', 'occupancy_count', 'water_usage_level'] },
        { category: 'Building', filters: ['building_id'] }
      ],
      'building_rooms': [
        { category: 'Room Details', filters: ['room_name', 'room_type', 'room_number'] },
        { category: 'Water Access', filters: ['has_water_access', 'has_drainage', 'water_usage_level'] },
        { category: 'Capacity', filters: ['square_footage', 'occupancy_count'] },
        { category: 'Location', filters: ['floor_id'] }
      ],
      'pou_points': [
        { category: 'POU Details', filters: ['pou_name', 'equipment_group', 'barcode_format'] },
        { category: 'Status & Type', filters: ['is_active', 'pou_id'] },
        { category: 'Location', filters: ['room_id'] }
      ],
      'public_access_points': [
        { category: 'Access Type', filters: ['access_type', 'qr_code'] },
        { category: 'Display Settings', filters: ['show_water_quality', 'show_filter_status', 'show_sustainability', 'show_maintenance_schedule'] },
        { category: 'Status', filters: ['is_active', 'display_name'] },
        { category: 'Location', filters: ['room_id', 'asset_id'] }
      ]
    };
    
    return businessFilters[tableName] || [];
  };

  // Business-friendly labels for fields
  const getBusinessFriendlyLabel = (field) => {
    const businessLabels = {
      // Customer & Account fields
      'account_id': 'Customer',
      'account_number': 'Account #',
      'tier1_id': 'Customer Type',
      'tier2_id': 'Business Category',
      'tier3_id': 'Specialty',
      'status': 'Status',
      
      // Location fields
      'cached_state': 'State',
      'cached_city': 'City',
      'region': 'Region',
      'route_code': 'Service Route',
      'location_type': 'Location Type',
      'billing_state': 'Billing State',
      'billing_city': 'Billing City',
      
      // Building fields
      'building_type': 'Building Type',
      'year_built': 'Year Built',
      'water_system_type': 'Water System',
      'primary_pwsid': 'Water System ID',
      'location_id': 'Location',
      'building_id': 'Building',
      
      // Asset fields
      'asset_status': 'Asset Status',
      'condition_rating': 'Condition',
      'part_id': 'Equipment Model',
      'maintenance_interval_months': 'Service Interval',
      'next_maintenance_date': 'Next Service',
      
      // Work Order fields
      'priority': 'Priority',
      'work_type': 'Work Type',
      'assigned_to': 'Assigned To',
      'vendor_id': 'Service Provider',
      'scheduled_date': 'Scheduled Date',
      'requested_date': 'Requested Date',
      
      // Alert fields
      'alert_severity': 'Severity',
      'alert_type': 'Alert Type',
      'alert_category': 'Category',
      'acknowledged': 'Acknowledged',
      'acknowledged_by': 'Acknowledged By',
      
      // Water Quality fields
      'tds_reduction_percent': 'TDS Reduction %',
      'ph_inlet': 'pH In',
      'ph_outlet': 'pH Out',
      'flow_rate_gpm': 'Flow Rate',
      'ro_psi_inlet': 'Pressure In',
      'ro_psi_outlet': 'Pressure Out',
      'measurement_method': 'Test Method',
      'measured_by': 'Tested By',
      'measurement_date': 'Test Date',
      
      // Parts fields
      'category_id': 'Category',
      'part_type': 'Part Type',
      'purifier_type': 'Filter Type',
      'has_ro': 'Has RO',
      'nsf_certified': 'NSF Certified',
      'warranty_months': 'Warranty',
      
      // Contact fields
      'contact_type': 'Contact Type',
      'is_primary': 'Primary Contact',
      'can_login': 'System Access',
      'preferred_contact_method': 'Preferred Contact',
      'department': 'Department',
      
      // Address fields
      'line1': 'Street Address',
      'line2': 'Address Line 2',
      'postal_code': 'ZIP Code',
      'country': 'Country',
      'pwsid': 'Water System ID',
      
      // Floor fields
      'floor_number': 'Floor Number',
      'floor_name': 'Floor Name',
      'floor_type': 'Floor Type',
      'square_footage': 'Square Footage',
      'occupancy_count': 'Occupancy',
      'water_usage_level': 'Water Usage Level',
      'floor_id': 'Floor',
      
      // Building Room fields
      'room_name': 'Room Name',
      'room_type': 'Room Type',
      'room_number': 'Room Number',
      'has_water_access': 'Has Water Access',
      'has_drainage': 'Has Drainage',
      'room_id': 'Room',
      
      // POU Point fields
      'pou_name': 'POU Name',
      'equipment_group': 'Equipment Group',
      'barcode_format': 'Barcode Format',
      'is_active': 'Active',
      'pou_id': 'POU ID',
      
      // Public Access Point fields
      'access_type': 'Access Type',
      'qr_code': 'QR Code',
      'show_water_quality': 'Show Water Quality',
      'show_filter_status': 'Show Filter Status',
      'show_sustainability': 'Show Sustainability',
      'show_maintenance_schedule': 'Show Maintenance',
      'display_name': 'Display Name',
      'asset_id': 'Asset'
    };
    
    return businessLabels[field] || formatFieldName(field);
  };

  // Render business-organized filters
  const renderBusinessFilters = () => {
    const businessFilters = getBusinessFilters(selectedTable);
    
    if (businessFilters.length === 0) {
      // Fallback to simple filter display for tables without specific business logic
      return renderSimpleFilters();
    }

    return (
      <div className="space-y-6">
        {businessFilters.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              <h5 className="text-sm font-semibold text-gray-800 tracking-wide">
                {section.category}
              </h5>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {section.filters
                .filter(field => fieldFilters[field]) // Only show filters that exist in the data
                .map(field => renderFilterControl(field, fieldFilters[field]))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render simple filters for tables without specific business organization
  const renderSimpleFilters = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {Object.entries(fieldFilters).map(([field, fieldConfig]) => 
          renderFilterControl(field, fieldConfig)
        )}
      </div>
    );
  };

  // Render individual filter control
  const renderFilterControl = (field, fieldConfig) => {
    const currentValue = filterValues[field];
    const hasValue = currentValue && (
      typeof currentValue === 'string' ? currentValue.trim() !== '' :
      typeof currentValue === 'object' ? Object.values(currentValue).some(v => v) :
      currentValue
    );

    const businessLabel = getBusinessFriendlyLabel(field);

    return (
      <div key={field} className={`group relative bg-white/60 backdrop-blur-sm rounded-xl border transition-all duration-200 hover:shadow-lg hover:shadow-blue-100/50 ${
        hasValue 
          ? 'border-blue-300 shadow-md shadow-blue-100/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/40' 
          : 'border-gray-200/70 hover:border-blue-200'
      }`}>
        <div className="p-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2 group-hover:text-gray-900 transition-colors">
            {businessLabel}
            {hasValue && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></span>
            )}
          </label>
        
          {/* Boolean Filters */}
          {fieldConfig.type === 'boolean' && (
            <select
              value={currentValue || ''}
              onChange={(e) => {
                setFilterValues(prev => ({
                  ...prev,
                  [field]: e.target.value
                }));
                setPage(1);
              }}
              className="w-full text-sm px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 hover:bg-white"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          )}

          {/* Dropdown/Select Filters */}
          {(fieldConfig.type === 'dropdown' || fieldConfig.type === 'foreign_key') && (
            <select
              value={currentValue || ''}
              onChange={(e) => {
                setFilterValues(prev => ({
                  ...prev,
                  [field]: e.target.value
                }));
                setPage(1);
              }}
              className="w-full text-sm px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 hover:bg-white"
            >
              <option value="">All</option>
              {fieldConfig.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.displayValue || option.label}
                </option>
              ))}
            </select>
          )}
        
          {/* Text Search Filters */}
          {fieldConfig.type === 'text_search' && (
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${businessLabel.toLowerCase()}...`}
                value={currentValue || ''}
                onChange={(e) => {
                  setFilterValues(prev => ({
                    ...prev,
                    [field]: e.target.value
                  }));
                  setPage(1);
                }}
                className="w-full text-sm px-3 py-2 pr-8 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 hover:bg-white placeholder-gray-400"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {hasValue && (
                <button
                  onClick={() => {
                    setFilterValues(prev => {
                      const newValues = { ...prev };
                      delete newValues[field];
                      return newValues;
                    });
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  ×
                </button>
              )}
            </div>
          )}
        
          {/* Date Range Filters */}
          {fieldConfig.type === 'date_range' && (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="date"
                  value={currentValue?.from || ''}
                  onChange={(e) => {
                    setFilterValues(prev => ({
                      ...prev,
                      [field]: { ...prev[field], from: e.target.value }
                    }));
                    setPage(1);
                  }}
                  className="w-full text-sm px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 hover:bg-white"
                />
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-white px-2">From</span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={currentValue?.to || ''}
                  onChange={(e) => {
                    setFilterValues(prev => ({
                      ...prev,
                      [field]: { ...prev[field], to: e.target.value }
                    }));
                    setPage(1);
                  }}
                  className="w-full text-sm px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 hover:bg-white"
                />
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-white px-2">To</span>
              </div>
            </div>
          )}
          
          {/* Number Range Filters */}
          {fieldConfig.type === 'number_range' && (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  placeholder="Minimum value"
                  value={currentValue?.min || ''}
                  onChange={(e) => {
                    setFilterValues(prev => ({
                      ...prev,
                      [field]: { ...prev[field], min: e.target.value }
                    }));
                    setPage(1);
                  }}
                  className="w-full text-sm px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 hover:bg-white placeholder-gray-400"
                />
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-white px-2">Min</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Maximum value"
                  value={currentValue?.max || ''}
                  onChange={(e) => {
                    setFilterValues(prev => ({
                      ...prev,
                      [field]: { ...prev[field], max: e.target.value }
                    }));
                    setPage(1);
                  }}
                  className="w-full text-sm px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 hover:bg-white placeholder-gray-400"
                />
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-white px-2">Max</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Apply field filters to the table data
  const filteredTableData = {
    ...tableData,
    items: applyFieldFilters(tableData.items)
  };
  
  if (loading && !selectedTable) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom CSS for enhanced drag feedback */}
      <style jsx>{`
        .dragging-column {
          background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: scale(1.02);
        }
        .drag-over {
          border-left: 3px solid #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }
        .cursor-move:hover {
          background: rgba(59, 130, 246, 0.05);
        }
      `}</style>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {/* Module Navigation (matching existing CRM grid style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Object.entries(businessModules).map(([moduleKey, module]) => (
          <button 
            key={moduleKey}
            onClick={() => setActiveTab(moduleKey)} 
            className={`text-sm px-3 py-2 rounded ${
              activeTab === moduleKey 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {module.label}
          </button>
        ))}
      </div>

      {/* Table Navigation */}
      {currentModule && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-3">{currentModule.label}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {currentModule.tables.map((tableName) => (
              <button
                key={tableName}
                onClick={() => {
                  setSelectedTable(tableName);
                }}
                className={`text-sm px-3 py-2 rounded ${
                  selectedTable === tableName
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {getTableDisplayName(tableName)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modern Business Filters - Always Visible */}
      {selectedTable && (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg shadow-blue-100/50 mb-6 overflow-hidden">
          {/* Modern Filter Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base">
                    {getBusinessFilterTitle(selectedTable)} Filters
                  </h4>
                  <p className="text-blue-100 text-xs">
                    Filter and organize your data efficiently
                  </p>
                </div>
                {getActiveFilterCount() > 0 && (
                  <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
                    {getActiveFilterCount()} active
                  </div>
                )}
              </div>
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={() => {
                    setFilterValues({});
                    setPage(1);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Modern Filter Content */}
          <div className="p-6 bg-white/80 backdrop-blur-sm">
            {Object.keys(fieldFilters).length > 0 ? (
              renderBusinessFilters()
            ) : (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600">Loading filters...</p>
                  <p className="text-xs text-gray-500 mt-1">Analyzing table structure</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls (matching existing CRM style) */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Global search..."
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(parseInt(e.target.value))} 
            className="p-3 border border-gray-300 rounded-lg"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingRow({}); setForm({}); setModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          disabled={!selectedTable}
        >
          <PlusIcon className="w-4 h-4 mr-2" /> Add
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Data Table (matching existing CRM style) */}
      {selectedTable && (
        loading ? (
          <div className="flex items-center justify-center h-64">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with scroll indicator */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{getTableDisplayName(selectedTable)}</h3>
                </div>
              </div>
            </div>
            {/* Add horizontal scroll container with improved styling */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {displayColumns.map((col, index) => (
                    <th 
                      key={col} 
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] cursor-move select-none transition-all duration-200 ${
                        draggedColumn === index ? 'opacity-50 bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                      title={`Drag to reorder • ${formatFieldName(col)}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">⋮⋮</span>
                        <span>{formatFieldName(col)}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 min-w-[120px] sticky right-0 bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTableData.items.map(row => (
                  <tr key={row.id}>
                    {displayColumns.map(col => (
                      <td key={col} className="px-6 py-4 text-sm text-gray-900 min-w-[150px] max-w-[300px]">
                        <div className="truncate" title={isForeignKeyField(col) && row[`${col}_resolved`] 
                          ? formatCellValue(row[`${col}_resolved`])
                          : formatCellValue(row[col])
                        }>
                          {isForeignKeyField(col) && row[`${col}_resolved`] 
                            ? formatCellValue(row[`${col}_resolved`])
                            : formatCellValue(row[col])
                          }
                        </div>
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[120px] sticky right-0 bg-white">
                      <button 
                        onClick={() => onEdit(row)} 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <PencilIcon className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => onDelete(row)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            
            {/* Pagination (matching existing CRM style) */}
            <div className="flex items-center justify-between p-4 border-t">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm text-gray-600">
                Page {page} of {Math.max(1, Math.ceil((tableData.total || 0) / pageSize))}
              </div>
              <button 
                disabled={(page * pageSize) >= (tableData.total || 0)} 
                onClick={() => setPage(p => p + 1)} 
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )
      )}

      {/* Modal (matching existing CRM style) */}
      {modalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingRow?.id ? 'Edit' : 'Add'} {getTableDisplayName(selectedTable)}
              </h3>
              <button 
                onClick={() => { setModalOpen(false); resetForm(); }} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  // Get all fields and filter out system fields
                  let fields = getTableFields(selectedTable).filter(field => !['id', 'created_at', 'updated_at'].includes(field));
                  
                  // Custom field ordering for specific tables
                  if (selectedTable === 'work_orders') {
                    // Move work_order_type_id to the very front (this is the "Work Order Type" dropdown)
                    const workOrderTypeIndex = fields.indexOf('work_order_type_id');
                    if (workOrderTypeIndex > -1) {
                      const workOrderTypeField = fields.splice(workOrderTypeIndex, 1)[0];
                      fields = [workOrderTypeField, ...fields];
                    }
                    
                    // Also move work_type to second position
                    const workTypeIndex = fields.indexOf('work_type');
                    if (workTypeIndex > -1) {
                      const workTypeField = fields.splice(workTypeIndex, 1)[0];
                      fields = [fields[0], workTypeField, ...fields.slice(1)];
                    }
                  }
                  
                  return fields;
                })().map(col => {
                  const fieldType = getFieldType(col);
                  const isTextarea = fieldType === 'textarea';
                  const isCheckbox = fieldType === 'checkbox';
                  const isForeignKey = isForeignKeyField(col);
                  const foreignKeyOpts = foreignKeyOptions[selectedTable]?.[col] || [];
                  
                  return (
                    <div key={col} className={isTextarea ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formatFieldName(col)}
                        {isForeignKey && <span className="text-xs text-gray-500 ml-1">(select from list)</span>}
                      </label>
                      {isForeignKey && foreignKeyOpts.length > 0 ? (
                        <select
                          value={form[col] ?? ''}
                          onChange={(e) => setForm(prev => ({ ...prev, [col]: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select {formatFieldName(col)} --</option>
                          {foreignKeyOpts.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : isTextarea ? (
                        <textarea
                          value={form[col] ?? ''}
                          onChange={(e) => setForm(prev => ({ ...prev, [col]: e.target.value }))}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : isCheckbox ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={form[col] ?? false}
                            onChange={(e) => setForm(prev => ({ ...prev, [col]: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {formatFieldName(col)}
                          </span>
                        </div>
                      ) : (
                        <input
                          type={fieldType}
                          value={form[col] ?? ''}
                          onChange={(e) => setForm(prev => ({ ...prev, [col]: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={isForeignKey ? 'Enter ID manually if not in dropdown' : ''}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => { setModalOpen(false); resetForm(); }} 
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={onSave} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {dependencyInfo ? 'Delete with Related Data' : 'Confirm Delete'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                {dependencyInfo ? (
                  <div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">Related Data Found</h4>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>{dependencyInfo.error}</p>
                            {dependencyInfo.details && dependencyInfo.details.length > 0 && (
                              <ul className="mt-2 list-disc list-inside">
                                {dependencyInfo.details.map((dep, index) => (
                                  <li key={index}>{dep.count} records in {dep.table}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">
                      You can delete this {getTableDisplayName(selectedTable).toLowerCase().slice(0, -1)} and all its related data, or cancel to manage the related data first.
                    </p>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={cascadeDelete}
                          onChange={(e) => setCascadeDelete(e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Yes, delete this record and all related data
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700">
                      Are you sure you want to delete this {getTableDisplayName(selectedTable).toLowerCase().slice(0, -1)}?
                    </p>
                    {itemToDelete.name && (
                      <p className="mt-2 text-sm text-gray-600 font-medium">
                        "{itemToDelete.name}"
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={dependencyInfo && !cascadeDelete}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    dependencyInfo && !cascadeDelete
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {cascadeDelete ? 'Delete All' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format cell values
const formatCellValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '...';
  return String(value);
};

export default BusinessModuleManager;