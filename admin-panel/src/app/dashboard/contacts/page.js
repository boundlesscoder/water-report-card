'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ListBulletIcon,
  MapIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import SearchPanel from '../../../components/ui/SearchPanel';
import TemplatePanel from '../../../components/ui/TemplatePanel';
import SortPanel from '../../../components/ui/SortPanel';
import SearchableDataTable from '../../../components/ui/SearchableDataTable';
import HierarchicalContactView from '../../../components/ui/HierarchicalContactView';
import ContactDetailModal from '../../../components/ui/ContactDetailModal';
import ContactMapView from '../../../components/mapview/ContactMapView';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
import { contactConfig } from '../../../config/searchConfig';
import api from '../../../services/api';
import { useUser } from '../../../context/UserContext';

export default function ContactManagement() {
  const { user } = useUser();
  
  // Load data from backend API
  const [allContacts, setAllContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'add' or 'edit'
  const [modalType, setModalType] = useState('parent'); // 'parent' or 'sub'
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search schema and template state
  const [searchSchema, setSearchSchema] = useState(null);
  const [searchSchemaList, setSearchSchemaList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // Template being edited
  const [templateName, setTemplateName] = useState('');
  const [isDefaultTemplate, setIsDefaultTemplate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  // Search and Sort state - Initialize empty, will be populated from schema or template
  const [activeSearches, setActiveSearches] = useState([]);
  const [activeSorts, setActiveSorts] = useState([]);
  const [activeSortId, setActiveSortId] = useState(null); // Track which sort bar is currently active
  const [lastActiveSearchId, setLastActiveSearchId] = useState(null); // Track which searchbar was last selected
  const [expandAll, setExpandAll] = useState(false); // Track "Expand all" checkbox state
  const [expandedPaths, setExpandedPaths] = useState(new Set()); // Track expanded paths (shared between list and map views)
  const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = useState(false); // Track search panel collapse state

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasPrev: false,
    hasNext: false
  });

  // Fetch contacts from backend API
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });

      const response = await api.get(`/api/contacts?${params}`);
      
      if (response.data?.success) {
        const contacts = response.data.data?.items || [];
        setAllContacts(contacts);
        setFilteredContacts(contacts);
        setPagination(prev => ({
          ...prev,
          total: response.data.data?.total || 0,
          totalPages: Math.ceil((response.data.data?.total || 0) / prev.limit),
          hasNext: (response.data.data?.page || 1) * prev.limit < (response.data.data?.total || 0)
        }));
      } else {
        throw new Error(response.data?.message || 'Failed to fetch contacts');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Fetch search schema
  const fetchSearchSchema = useCallback(async () => {
    try {
      const response = await api.get('/api/search/schemas/contacts');
      if (response.data?.success) {
        setSearchSchema(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching search schema:', err);
    }
  }, []);

  // Fetch search schema list (for showing available fields)
  const fetchSearchSchemaList = useCallback(async () => {
    try {
      const response = await api.get('/api/search/schemas/contacts/all');
      if (response.data?.success && response.data.data?.length > 0) {
        // Get the latest active schema
        const activeSchema = response.data.data.find(s => s.is_active) || response.data.data[0];
        if (activeSchema?.schema) {
          setSearchSchemaList(activeSchema.schema);
        }
      }
    } catch (err) {
      console.error('Error fetching search schema list:', err);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await api.get('/api/search/templates/contacts');
      if (response.data?.success) {
        // Sort templates by created_at (oldest first) - fixed order
        const sortedTemplates = (response.data.data || []).sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB; // Ascending order (oldest first)
        });
        setTemplates(sortedTemplates);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }, [user?.id]);

  // Initialize data
  useEffect(() => {
    fetchContacts();
    fetchSearchSchema();
    fetchSearchSchemaList();
    fetchTemplates();
  }, [fetchContacts, fetchSearchSchema, fetchSearchSchemaList, fetchTemplates]);

  // Extract unique values for any field from contact data
  const getUniqueValues = useCallback((fieldId, dataSource = allContacts) => {
    const values = new Set();
    
    // For name field, only include contacts (parent_id is null), exclude sub-contacts
    const filteredDataSource = fieldId === 'name' 
      ? dataSource.filter(contact => contact.parent_id === null || contact.parent_id === undefined)
      : dataSource;
    
    filteredDataSource.forEach(contact => {
      let value = null;
      
      // Handle field mappings first
      if (fieldId === 'category' || fieldId === 'category_description') {
        value = contact.category_description;
      } else if (fieldId === 'location') {
        value = contact.location_name || contact.location;
      } else if (fieldId === 'is_liquoslabs_account') {
        if (contact.is_liquos_account !== undefined && contact.is_liquos_account !== null) {
          value = contact.is_liquos_account ? 'Yes' : 'No';
        }
      } else {
        // Try direct field access
        value = contact[fieldId];
      }
      
      if (value !== null && value !== undefined && value !== '') {
        // For contact_type with '/', just add the full value (let SearchBar handle hierarchy)
        // Don't split it here - SearchBar will organize it hierarchically
        values.add(String(value));
      }
    });
    return Array.from(values).sort();
  }, [allContacts]);

  // Get filtered data for dropdowns, excluding a specific fieldId
  const getFilteredDataForDropdown = useCallback((excludeFieldId = null) => {
    let data = [...allContacts];

    // Apply filtering based on search conditions, excluding the specified fieldId
    // Exclude "Show all" and empty values from filtering conditions
    const activeSearchConditions = activeSearches.filter(search => {
      // Exclude the field we're getting dropdown options for
      if (excludeFieldId && search.fieldId === excludeFieldId) return false;
      if (!search.value) return false;
      const trimmedValue = search.value.trim();
      if (trimmedValue === '') return false;
      // Case-insensitive check for "Show all"
      if (trimmedValue.toLowerCase() === 'show all') return false;
      return true;
    });

    if (activeSearchConditions.length > 0) {
      data = data.filter(row => {
        return activeSearchConditions.every(condition => {
          let fieldValue = row[condition.fieldId];
          
          // Handle field mappings
          if (condition.fieldId === 'category' || condition.fieldId === 'category_description') {
            fieldValue = row.category_description;
          } else if (condition.fieldId === 'location') {
            fieldValue = row.location_name || row.location;
          } else if (condition.fieldId === 'is_liquoslabs_account') {
            fieldValue = row.is_liquos_account !== undefined && row.is_liquos_account !== null 
              ? (row.is_liquos_account ? 'Yes' : 'No')
              : null;
          } else {
            fieldValue = row[condition.fieldId];
          }
          
          if (fieldValue === null || fieldValue === undefined) return false;
          
          const searchValue = condition.value.toLowerCase().trim();
          const rowValue = String(fieldValue).toLowerCase();
          
          // For contact_type, check if search value matches any part of the field value
          if (condition.fieldId === 'contact_type') {
            const parts = rowValue.split('/').map(p => p.trim());
            return parts.some(part => part === searchValue) || rowValue === searchValue;
          }
          
          return rowValue.includes(searchValue);
        });
      });
    }

    return data;
  }, [allContacts, activeSearches]);

  // Get search config from backend schema or fallback to contactConfig
  // Base config without valueOptions (valueOptions will be computed per search bar)
  const searchConfig = useMemo(() => {
    // Use schema from backend if available, otherwise use contactConfig
    const baseConfig = searchSchemaList && searchSchemaList.length > 0 
      ? searchSchemaList 
      : contactConfig;
    
    return baseConfig.map(config => {
      return {
        id: config.id,
        name: config.name || config.label,
        label: config.name || config.label, // Use name as label
        type: config.type || 'text',
        placeholder: config.placeholder || `Search by ${config.name || config.label}...`,
        valueOptions: [], // Will be computed per search bar
        options: config.options || [],
        sortable: config.sortable !== false, // All fields are sortable by default
        hasAllOption: config.hasAllOption !== false // All fields have "Show all" option by default
      };
    });
  }, [searchSchemaList, contactConfig]);

  // Get valueOptions for a specific field from backend, filtered by other search bars
  const getValueOptionsForField = useCallback(async (fieldId) => {
    try {
      // Prepare search conditions (exclude empty values and "Show all")
      const searchConditions = activeSearches
        .filter(search => {
          if (!search.value) return false;
          const trimmedValue = String(search.value).trim();
          if (trimmedValue === '') return false;
          if (trimmedValue.toLowerCase() === 'show all') return false;
          // Exclude the field we're getting options for
          if (search.fieldId === fieldId) return false;
          return true;
        })
        .map(search => ({
          fieldId: search.fieldId,
          value: String(search.value).trim()
        }));

      const response = await api.post('/api/contacts/dropdown-options', {
        searches: searchConditions,
        fieldId: fieldId
      });

      if (response.data?.success) {
        return response.data.data || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      // Fallback to frontend computation if backend fails
      const filteredData = getFilteredDataForDropdown(fieldId);
      return getUniqueValues(fieldId, filteredData);
    }
  }, [activeSearches, getFilteredDataForDropdown, getUniqueValues]);

  // Field name mapping: template field names -> frontend field IDs
  const mapTemplateFieldToFrontend = useCallback((templateField) => {
    const fieldMap = {
      'contact_name': 'name',
      'location_name': 'location',
      'category_description': 'category_description', // Keep as is
      'region': 'region',
      'state': 'state',
      'city': 'city',
      'service_zone': 'service_zone',
      'route': 'route',
      'water_district': 'pwsid',
      'is_liquoslabs_account': 'is_liquoslabs_account'
    };
    return fieldMap[templateField] || templateField;
  }, []);

  // Field name mapping: frontend field IDs -> template field names
  const mapFrontendFieldToTemplate = useCallback((frontendField) => {
    const fieldMap = {
      'name': 'contact_name',
      'location': 'location_name',
      'category_description': 'category_description',
      'region': 'region',
      'state': 'state',
      'city': 'city',
      'service_zone': 'service_zone',
      'route': 'route',
      'pwsid': 'water_district',
      'is_liquoslabs_account': 'is_liquoslabs_account'
    };
    return fieldMap[frontendField] || frontendField;
  }, []);

  // Load template
  const loadTemplate = useCallback(async (templateId) => {
    try {
      const response = await api.get(`/api/search/template/${templateId}`);
      if (response.data?.success && response.data.data) {
        const template = response.data.data;
        if (template.search_payload) {
          // Parse search_payload
          const payload = typeof template.search_payload === 'string' 
            ? JSON.parse(template.search_payload) 
            : template.search_payload;
          
          // Transform filters to activeSearches
          // Support both new array format: filters: [{field, value}] and legacy object format: filters: { fieldName: [values] }
          const searches = [];
          if (payload.filters) {
            if (Array.isArray(payload.filters)) {
              // New array format - preserves order
              payload.filters.forEach((filterItem, index) => {
                if (filterItem.field && filterItem.value) {
                  const fieldId = mapTemplateFieldToFrontend(filterItem.field);
                  searches.push({
                    id: `search-${Date.now()}-${Math.random()}-${fieldId}-${index}`,
                    fieldId: fieldId,
                    value: String(filterItem.value)
                  });
                }
              });
            } else if (typeof payload.filters === 'object') {
              // Legacy object format
              Object.entries(payload.filters).forEach(([templateField, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                  const fieldId = mapTemplateFieldToFrontend(templateField);
                  const value = values[0];
                  searches.push({
                    id: `search-${Date.now()}-${Math.random()}-${fieldId}`,
                    fieldId: fieldId,
                    value: String(value)
                  });
                }
              });
            }
          }
          // Also check for legacy format (payload.searches)
          if (payload.searches && Array.isArray(payload.searches) && searches.length === 0) {
            searches.push(...payload.searches);
          }
          
          setActiveSearches(searches);
          
          // Transform sort to activeSorts
          // Format: sort: [{field, direction, value?}] -> activeSorts: [{id, fieldId, direction, selectedValue}]
          const sorts = [];
          if (payload.sort && Array.isArray(payload.sort)) {
            payload.sort.forEach((sortItem, index) => {
              if (sortItem.field && sortItem.direction) {
                // Map template field name to frontend field ID
                const fieldId = mapTemplateFieldToFrontend(sortItem.field);
                // Check if there's a corresponding search bar with the same fieldId
                const hasMatchingSearch = searches.some(search => search.fieldId === fieldId);
                sorts.push({
                  id: `sort-${Date.now()}-${Math.random()}-${fieldId}-${index}`,
                  fieldId: fieldId,
                  direction: sortItem.direction, // 'asc' or 'desc'
                  selectedValue: sortItem.value || null, // Load value from template as selectedValue
                  isAutoAdded: hasMatchingSearch // Mark as auto-added if matching search exists
                });
              }
            });
          }
          // Also check for legacy format (payload.sorts)
          else if (payload.sorts && Array.isArray(payload.sorts)) {
            // For legacy format, also check for matching searches
            payload.sorts.forEach(sort => {
              const hasMatchingSearch = searches.some(search => search.fieldId === sort.fieldId);
              sort.isAutoAdded = hasMatchingSearch;
            });
            sorts.push(...payload.sorts);
          }
          setActiveSorts(sorts);
          
          // Handle groupBy if needed (store separately for future use)
          // For now, groupBy is handled by the hierarchical view logic
          
          // Set selected template
          setSelectedTemplate(template);
        }
      }
    } catch (err) {
      console.error('Error loading template:', err);
    }
  }, [mapTemplateFieldToFrontend]);

  // Show toast message
  const showToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Handle edit template
  const handleEditTemplate = useCallback((template) => {
    setEditingTemplate(template);
    setTemplateName(template.name || '');
    setIsDefaultTemplate(template.is_default === true);
    setShowTemplateModal(true);
  }, []);

  // Handle delete template
  const handleDeleteTemplate = useCallback((template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete template
  const confirmDeleteTemplate = useCallback(async () => {
    if (!templateToDelete || !user?.id) return;
    
    try {
      const response = await api.delete(`/api/search/templates/${templateToDelete.id}`);
      
      if (response.data?.success) {
        showToast('Template deleted successfully', 'success');
        
        // If deleted template was selected, clear selection
        if (selectedTemplate?.id === templateToDelete.id) {
          setSelectedTemplate(null);
          setActiveSearches([]);
          setActiveSorts([]);
        }
        
        // Refresh templates
        await fetchTemplates();
      } else {
        showToast(response.data?.message || 'Failed to delete template', 'error');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      showToast(err.response?.data?.message || 'Failed to delete template', 'error');
    } finally {
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  }, [templateToDelete, user?.id, selectedTemplate, fetchTemplates, showToast]);

  // Save template
  const saveTemplate = useCallback(async (name, isUpdate = false, isDefault = false) => {
    if (!user?.id) return;
    
    try {
      // Transform activeSearches to filters format preserving order
      // Format: activeSearches: [{id, fieldId, value}] -> filters: [{field, value}] (array to preserve order)
      const filters = activeSearches
        .filter(search => search.fieldId && search.value && search.value.trim() !== '' && search.value.toLowerCase() !== 'show all')
        .map(search => ({
          field: mapFrontendFieldToTemplate(search.fieldId),
          value: search.value.trim()
        }));
      
      // Transform activeSorts to sort format preserving order and status
      // Format: activeSorts: [{id, fieldId, direction, selectedValue}] -> sort: [{field, direction, value?}]
      const sort = activeSorts
        .filter(s => s.fieldId) // Only require fieldId, direction will default to 'asc' if missing
        .map(s => {
          const sortItem = {
            field: mapFrontendFieldToTemplate(s.fieldId), // Map to template field name
            direction: s.direction || 'asc' // Default to 'asc' if direction is missing
          };
          // Only include value if selectedValue exists and is not empty or "All"
          if (s.selectedValue && 
              s.selectedValue !== null && 
              s.selectedValue !== undefined && 
              s.selectedValue !== '' && 
              s.selectedValue !== 'All' && 
              s.selectedValue !== 'Show all') {
            sortItem.value = s.selectedValue;
          }
          return sortItem;
        });
      
      // Extract groupBy from activeSorts (fields that are sorted)
      // Map frontend field IDs to template field names
      const groupBy = activeSorts
        .filter(s => s.fieldId)
        .map(s => mapFrontendFieldToTemplate(s.fieldId));
      
      const payload = {
        filters,
        sort,
        groupBy
      };

      console.log('saveTemplate - activeSorts:', activeSorts);
      console.log('saveTemplate - sort payload:', sort);
      console.log('saveTemplate - full payload:', JSON.stringify(payload, null, 2));

      // For "Save As", always create new template (ignore isUpdate if editingTemplate is null)
      const templateToUpdate = editingTemplate || selectedTemplate;
      const shouldUpdate = isUpdate && templateToUpdate && editingTemplate !== null;
      
      if (shouldUpdate) {
        // Update existing template
        const response = await api.put(`/api/search/templates/${templateToUpdate.id}`, {
          name: name || templateToUpdate.name,
          search_payload: payload,
          is_default: isDefault
        });
        if (response.data?.success) {
          showToast('Template updated successfully', 'success');
          await fetchTemplates();
          setShowTemplateModal(false);
          setTemplateName('');
          setIsDefaultTemplate(false);
          setEditingTemplate(null);
        } else {
          showToast(response.data?.message || 'Failed to update template', 'error');
        }
      } else {
        // Create new template
        const response = await api.post('/api/search/templates', {
          module: 'contacts',
          name,
          search_payload: payload,
          is_default: isDefault,
          is_shared: false
        });
        if (response.data?.success) {
          showToast('Template created successfully', 'success');
          await fetchTemplates();
          setSelectedTemplate(response.data.data);
          setShowTemplateModal(false);
          setTemplateName('');
          setIsDefaultTemplate(false);
          setEditingTemplate(null);
        } else {
          showToast(response.data?.message || 'Failed to create template', 'error');
        }
      }
    } catch (err) {
      console.error('Error saving template:', err);
      showToast(err.response?.data?.message || 'Failed to save template', 'error');
    }
  }, [user?.id, activeSearches, activeSorts, selectedTemplate, editingTemplate, fetchTemplates, mapFrontendFieldToTemplate, showToast]);

  // Handle save button click
  const handleSave = useCallback(async () => {
    if (selectedTemplate) {
      // Update existing template directly without showing modal
      try {
        // Transform activeSearches to filters format preserving order
        const filters = activeSearches
          .filter(search => search.fieldId && search.value && search.value.trim() !== '' && search.value.toLowerCase() !== 'show all')
          .map(search => ({
            field: mapFrontendFieldToTemplate(search.fieldId),
            value: search.value.trim()
          }));
        
        // Transform activeSorts to sort format preserving order and status
        const sort = activeSorts
          .filter(s => s.fieldId) // Only require fieldId, direction will default to 'asc' if missing
          .map(s => {
            const sortItem = {
              field: mapFrontendFieldToTemplate(s.fieldId),
              direction: s.direction || 'asc' // Default to 'asc' if direction is missing
            };
            // Only include value if selectedValue exists and is not empty or "All"
            if (s.selectedValue && 
                s.selectedValue !== null && 
                s.selectedValue !== undefined && 
                s.selectedValue !== '' && 
                s.selectedValue !== 'All' && 
                s.selectedValue !== 'Show all') {
              sortItem.value = s.selectedValue;
            }
            return sortItem;
          });
        
        const groupBy = activeSorts
          .filter(s => s.fieldId)
          .map(s => mapFrontendFieldToTemplate(s.fieldId));
        
        const payload = {
          filters,
          sort,
          groupBy
        };

        console.log('handleSave - activeSorts:', activeSorts);
        console.log('handleSave - sort payload:', sort);
        console.log('handleSave - full payload:', JSON.stringify(payload, null, 2));

        const response = await api.put(`/api/search/templates/${selectedTemplate.id}`, {
          name: selectedTemplate.name,
          search_payload: payload,
          is_default: selectedTemplate.is_default || false
        });
        
        if (response.data?.success) {
          showToast('Template updated successfully', 'success');
          await fetchTemplates();
        } else {
          showToast(response.data?.message || 'Failed to update template', 'error');
        }
      } catch (err) {
        console.error('Error saving template:', err);
        showToast(err.response?.data?.message || 'Failed to save template', 'error');
      }
    } else {
      // Show create template modal
      setTemplateName('');
      setIsDefaultTemplate(false);
      setEditingTemplate(null);
      setShowTemplateModal(true);
    }
  }, [selectedTemplate, activeSearches, activeSorts, mapFrontendFieldToTemplate, fetchTemplates, showToast]);

  // Handle save as button click
  const handleSaveAs = useCallback(() => {
    // Clear selected template and editing template to ensure we create a new one
    setEditingTemplate(null);
    setTemplateName('');
    setIsDefaultTemplate(false);
    setShowTemplateModal(true);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((templateId) => {
    if (templateId) {
      loadTemplate(templateId);
    } else {
      setSelectedTemplate(null);
      setActiveSearches([]);
      setActiveSorts([]);
    }
  }, [loadTemplate]);

  // Handle setting default template
  const handleSetDefault = useCallback(async (templateId) => {
    if (!user?.id || !templateId) return;
    
    try {
      const response = await api.put(`/api/search/templates/${templateId}`, {
        is_default: true
      });
      
      if (response.data?.success) {
        showToast('Default template updated successfully', 'success');
        // Refresh templates to get updated default status
        await fetchTemplates();
      } else {
        showToast(response.data?.message || 'Failed to set default template', 'error');
      }
    } catch (err) {
      console.error('Error setting default template:', err);
      showToast(err.response?.data?.message || 'Failed to set default template', 'error');
    }
  }, [user?.id, fetchTemplates, showToast]);

  // Table columns configuration based on contact data structure
  const columns = useMemo(() => [
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true 
    },
    { 
      key: 'email', 
      label: 'Email', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
          <span>{value || '-'}</span>
        </div>
      )
    },
    { 
      key: 'phone', 
      label: 'Phone', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <PhoneIcon className="w-4 h-4 text-gray-400" />
          <span>{value || '-'}</span>
        </div>
      )
    },
    { 
      key: 'location', 
      label: 'Location', 
      sortable: true 
    },
    
    { 
      key: 'actions', 
      label: 'Actions', 
      sortable: false 
    }
  ], []);

  // Helper function to determine the "big LOCATION" - the first hierarchical field with multiple values
  const getBigLocationField = useCallback((filteredData) => {
    const hierarchicalFields = ['region', 'state', 'city', 'service_zone', 'route'];
    
    // Check each hierarchical field in order
    for (let i = 0; i < hierarchicalFields.length; i++) {
      const field = hierarchicalFields[i];
      const uniqueValues = new Set();
      
      // Collect unique non-empty values for this field
      filteredData.forEach(row => {
        const value = row[field];
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(String(value).trim());
        }
      });
      
      // If we have multiple values for this field, this is the "big LOCATION"
      if (uniqueValues.size > 1) {
        return field;
      }
      // If all records have the same value (or empty), continue to next level
    }
    
    // If all hierarchical fields have single values, return null (no grouping needed)
    return null;
  }, []);

  // Calculate hierarchical location structure based on what's actually searched
  // Logic: Show only the location fields that are in the search, in hierarchical order
  // Examples:
  // - Name only → null (flat list)
  // - Name + specific region → region (Region → States → Sub-contacts)
  // - Name + "Show all regions" → region (Regions → Sub-contacts, skip states)
  // - Name + specific region + specific state → region (Region → State → Sub-contacts)
  // - Name + specific region + "Show all states" → region (Region → All States → Sub-contacts)
  // - Name + specific region + specific city → region (Region → City → Sub-contacts, skip state)
  const bigLocationField = useMemo(() => {
    // Define hierarchical location fields in order
    const hierarchicalFields = ['region', 'state', 'city', 'service_zone', 'route'];
    
    // Find all location fields being searched (both specific values and "Show all")
    const searchedLocationFields = activeSearches
      .filter(search => {
      if (!search.value) return false;
      const trimmedValue = search.value.trim();
        return trimmedValue !== '' && hierarchicalFields.includes(search.fieldId);
      })
      .map(search => ({
        fieldId: search.fieldId,
        value: search.value.trim(),
        isShowAll: search.value.trim().toLowerCase() === 'show all'
      }))
      .sort((a, b) => {
        // Sort by hierarchical order
        const indexA = hierarchicalFields.indexOf(a.fieldId);
        const indexB = hierarchicalFields.indexOf(b.fieldId);
        return indexA - indexB;
    });

    // Rule 1: If no location fields are searched → return null (flat list)
    if (searchedLocationFields.length === 0) {
      return null;
    }

    // Rule 2: Return the FIRST (lowest/highest) hierarchical location field being searched
    // This becomes the root level of the hierarchy
    return searchedLocationFields[0].fieldId;
  }, [activeSearches]);

  // Automatically add sort bars when searching in any field
  // All fields are sortable by default
  useEffect(() => {
    // Get fields that have active searches (with values, including "Show all")
    // All fields are sortable, so no need to check sortable property
    const searchedFields = activeSearches
      .filter(s => {
        if (!s.fieldId) return false;
        // Include searches with "Show all" or any non-empty value
        if (!s.value || s.value.trim() === '') return false;
        return true; // All fields are sortable
      })
      .map(s => s.fieldId);

    setActiveSorts(prev => {
      // Get current sorted fields
      const sortedFields = prev.map(s => s.fieldId);

      // Find fields that are searched but not yet sorted
      const fieldsToAdd = searchedFields.filter(fieldId => !sortedFields.includes(fieldId));

      // Automatically add sort bars for newly searched fields
      let updatedSorts = [...prev];
      if (fieldsToAdd.length > 0) {
        const newSorts = fieldsToAdd.map(fieldId => {
          return {
            id: `sort-${Date.now()}-${Math.random()}-${fieldId}`,
            fieldId: fieldId,
            selectedValue: null, // No value selected initially
            isAutoAdded: true // Mark as auto-added
          };
        });

        // Combine existing sorts with new ones, avoiding duplicates
        const existingFieldIds = new Set(prev.map(s => s.fieldId));
        const uniqueNewSorts = newSorts.filter(s => !existingFieldIds.has(s.fieldId));
        updatedSorts = [...prev, ...uniqueNewSorts];
      }

      // Remove sort bars ONLY if they were auto-added AND the field is no longer being searched
      // Keep manually added sort bars even if the field is not being searched
      const sortsToKeep = updatedSorts.filter(sort => {
        // Keep if field is still being searched
        if (searchedFields.includes(sort.fieldId)) {
          return true;
        }
        // Keep if it was manually added (not auto-added)
        if (!sort.isAutoAdded) {
          return true;
        }
        // Remove only auto-added sorts for fields that are no longer being searched
        return false;
      });

      return sortsToKeep;
    });
  }, [activeSearches, searchConfig]); // Removed activeSorts from dependencies

  // Handle search change
  const handleSearchChange = useCallback((searches) => {
    setActiveSearches(searches);
    // Reset to page 1 when search changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle search focus - track last active searchbar
  const handleSearchFocus = useCallback((searchId) => {
    if (searchId) {
      setLastActiveSearchId(searchId);
    }
  }, []);

  // Handle sort change (when sorts are added/removed)
  // This is called when sorts are added/removed, NOT when direction changes
  const handleSortChange = useCallback((sorts) => {
    // Ensure all sorts have a direction (default to 'asc' if missing)
    const sortsWithDirection = sorts.map(s => ({
      ...s,
      direction: s.direction || 'asc'
    }));
    setActiveSorts(sortsWithDirection);
    // Only update activeSortId if the current active sort was removed
    setActiveSortId(prevActiveId => {
      if (prevActiveId && sorts.find(s => s.id === prevActiveId)) {
        // Active sort still exists, keep it
        return prevActiveId;
      } else if (prevActiveId && !sorts.find(s => s.id === prevActiveId)) {
        // Active sort was removed, set first sort as active
        return sorts.length > 0 ? sorts[0].id : null;
      } else if (!prevActiveId && sorts.length > 0) {
        // No active sort but we have sorts, set the first one as active (initial state)
        return sorts[0].id;
      }
      // No sorts, clear active sort
      return null;
    });
  }, []);

  // Handle sort direction change - make this sort the active one
  const handleSortDirectionChange = useCallback((sortId, direction) => {
    // Use functional updates to ensure we're working with the latest state
    // Update both activeSortId and activeSorts together
    setActiveSortId(sortId);
    setActiveSorts(prev => {
      // Find the sort being updated to ensure it exists
      const sortExists = prev.find(s => s.id === sortId);
      if (!sortExists) {
        // Sort not found - return previous state
        return prev;
      }
      // Update the sort direction
      return prev.map(sort => 
        sort.id === sortId 
          ? { ...sort, direction }
          : sort
      );
    });
  }, []);

  // Handle sort value selection from dropdown
  const handleSortValueSelect = useCallback((sortId, value) => {
    setActiveSorts(prev => {
      return prev.map(sort => 
        sort.id === sortId 
          ? { ...sort, selectedValue: value }
          : sort
      );
    });
  }, []);

  // Get dropdown options for a field
  const getDropdownOptions = useCallback((fieldId) => {
    // Get unique values for this field from all contacts
    return getUniqueValues(fieldId, allContacts);
  }, [getUniqueValues, allContacts]);

  // Apply filtering and sorting to data
  const processedData = useMemo(() => {
    let data = [...allContacts];

    // Apply filtering based on search conditions
    // Exclude "Show all" and empty values from filtering conditions
    const activeSearchConditions = activeSearches.filter(search => {
      if (!search.value) return false;
      const trimmedValue = search.value.trim();
      if (trimmedValue === '') return false;
      // Case-insensitive check for "Show all"
      if (trimmedValue.toLowerCase() === 'show all') return false;
      return true;
    });

    // Only apply filtering if there are actual search conditions (not "Show all" or empty)
    if (activeSearchConditions.length > 0) {
      data = data.filter(row => {
        return activeSearchConditions.every(condition => {
          let fieldValue = row[condition.fieldId];
          
          // Handle field mappings
          if (condition.fieldId === 'category' && row.category_description) {
            fieldValue = row.category_description;
          } else if (condition.fieldId === 'location' && row.location_name) {
            fieldValue = row.location_name;
          } else if (condition.fieldId === 'is_liquoslabs_account') {
            fieldValue = row.is_liquos_account ? 'Yes' : 'No';
          }
          
          if (fieldValue === null || fieldValue === undefined) return false;
          
          const searchValue = condition.value.toLowerCase().trim();
          const rowValue = String(fieldValue).toLowerCase();
          
          // For contact_type, check if search value matches any part of the field value
          // (e.g., "Customer" should match "Customer/Business")
          if (condition.fieldId === 'contact_type') {
            // Split by "/" and check each part
            const parts = rowValue.split('/').map(p => p.trim());
            return parts.some(part => part === searchValue) || rowValue === searchValue;
          }
          
          return rowValue.includes(searchValue);
        });
      });
    }
    // If no active search conditions (all are "Show all" or empty), show all data

    // Apply sorting
    // If no bigLocationField (only name searched), sort by name sortbar only
    // If bigLocationField exists, sort by big LOCATION first, then by active sortbars
    const hierarchicalFields = ['region', 'state', 'city', 'service_zone', 'route'];
    
    data = [...data].sort((a, b) => {
      // If no bigLocationField, skip location sorting and go straight to sortbars
      if (!bigLocationField) {
        // Sort only by active sortbars (name sortbar should be present)
        for (const sort of activeSorts) {
          let aValue = a[sort.fieldId];
          let bValue = b[sort.fieldId];

          // Handle field mappings
          if (sort.fieldId === 'category') {
            aValue = a.category_description || a.category || aValue;
            bValue = b.category_description || b.category || bValue;
          } else if (sort.fieldId === 'location') {
            aValue = a.location_name || a.location || aValue;
            bValue = b.location_name || b.location || bValue;
          } else if (sort.fieldId === 'is_liquoslabs_account') {
            aValue = a.is_liquos_account !== undefined ? (a.is_liquos_account ? 'Yes' : 'No') : aValue;
            bValue = b.is_liquos_account !== undefined ? (b.is_liquos_account ? 'Yes' : 'No') : bValue;
          }

          // Handle null/undefined/empty string values
          if (aValue === null || aValue === undefined || aValue === '') {
            if (bValue === null || bValue === undefined || bValue === '') {
              continue;
            }
            return 1;
          }
          if (bValue === null || bValue === undefined || bValue === '') {
            return -1;
          }

          let comparison = 0;
          if (typeof aValue === 'string') {
            comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
          } else if (typeof aValue === 'number') {
            comparison = aValue - bValue;
          } else {
            comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
          }

          if (sort.direction === 'desc') {
            comparison = -comparison;
          }

          if (comparison !== 0) {
            return comparison;
          }
        }
        return 0;
      }

      // First: Sort by big LOCATION (always alphabetical, ascending)
      if (bigLocationField) {
        let aBigLocation = a[bigLocationField];
        let bBigLocation = b[bigLocationField];

        // Handle null/undefined/empty string values
        if (aBigLocation === null || aBigLocation === undefined || aBigLocation === '') {
          if (bBigLocation === null || bBigLocation === undefined || bBigLocation === '') {
            // Both are null, continue to next sort criteria
          } else {
            return 1; // Put null/empty values at the end
          }
        } else if (bBigLocation === null || bBigLocation === undefined || bBigLocation === '') {
          return -1; // Put null/empty values at the end
        } else {
          // Both have values, compare alphabetically
          const aStr = String(aBigLocation).trim();
          const bStr = String(bBigLocation).trim();
          const bigLocationComparison = aStr.localeCompare(bStr, undefined, { sensitivity: 'base' });
          
          if (bigLocationComparison !== 0) {
            return bigLocationComparison; // Return if different, otherwise continue to next sort
          }
        }
      }

      // Second: Sort by active sortbars (in order of activeSorts array)
      for (const sort of activeSorts) {
        // Skip if this is the big LOCATION field (already sorted above)
        if (sort.fieldId === bigLocationField) {
          continue;
        }

        let aValue = a[sort.fieldId];
        let bValue = b[sort.fieldId];

        // Handle field mappings (same as in filtering)
        if (sort.fieldId === 'category') {
          aValue = a.category_description || a.category || aValue;
          bValue = b.category_description || b.category || bValue;
        } else if (sort.fieldId === 'location') {
          aValue = a.location_name || a.location || aValue;
          bValue = b.location_name || b.location || bValue;
        } else if (sort.fieldId === 'is_liquoslabs_account') {
          aValue = a.is_liquos_account !== undefined ? (a.is_liquos_account ? 'Yes' : 'No') : aValue;
          bValue = b.is_liquos_account !== undefined ? (b.is_liquos_account ? 'Yes' : 'No') : bValue;
        }

        // Handle null/undefined/empty string values
        if (aValue === null || aValue === undefined || aValue === '') {
          if (bValue === null || bValue === undefined || bValue === '') {
            continue; // Both are null/empty, continue to next sort
          }
          return 1; // Put null/empty values at the end
        }
        if (bValue === null || bValue === undefined || bValue === '') {
          return -1; // Put null/empty values at the end
        }

        let comparison = 0;

        // Compare based on type - use case-insensitive comparison for strings
        if (typeof aValue === 'string') {
          comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
        } else if (typeof aValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
        }

        // Apply sort direction
        if (sort.direction === 'desc') {
          comparison = -comparison;
        }

        // If values are different, return the comparison
        if (comparison !== 0) {
          return comparison;
        }
        // If values are the same, continue to next sort criteria
      }

      return 0; // All sort criteria are equal
    });

    return data;
  }, [allContacts, activeSearches, activeSorts, activeSortId, bigLocationField]);

  // Find parent contact name if searching by customer name
  const parentContactName = useMemo(() => {
    const nameSearch = activeSearches.find(s => s.fieldId === 'name' && s.value && s.value.trim() !== '' && s.value.toLowerCase() !== 'show all');
    if (nameSearch) {
      // Find the parent contact (parent_id is null) that matches the search
      const parentContact = allContacts.find(contact => 
        contact.parent_id === null && 
        contact.name && 
        contact.name.toLowerCase().includes(nameSearch.value.toLowerCase().trim())
      );
      return parentContact?.name || null;
    }
    return null;
  }, [activeSearches, allContacts]);

  // Check if there are any active search conditions (including "Show all" - it's an active search but doesn't filter)
  const hasActiveSearches = useMemo(() => {
    return activeSearches.some(search => {
      if (!search.value) return false;
      const trimmedValue = search.value.trim();
      if (trimmedValue === '') return false;
      // "Show all" is considered an active search (so list shows), but it doesn't filter
      return true;
    });
  }, [activeSearches]);

  // Filter processedData to only include sub-contacts for map view
  // Only show sub-contacts when there are active searches
  const mapContacts = useMemo(() => {
    if (!hasActiveSearches) {
      return []; // Return empty array when no active searches
    }
    // Filter to only show sub-contacts (parent_id is not null)
    return processedData.filter(contact => 
      contact.parent_id !== null && contact.parent_id !== undefined
    );
  }, [processedData, hasActiveSearches]);

  // Update pagination when processed data changes
  useEffect(() => {
    const total = processedData.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const currentPage = Math.min(pagination.page, totalPages || 1);

    setPagination(prev => ({
      ...prev,
      total,
      totalPages,
      page: currentPage,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages
    }));
  }, [processedData, pagination.limit]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Note: Pagination is now handled by SearchableDataTable component

  // Handle edit contact
  const handleEditContact = useCallback((contact) => {
    setSelectedContact(contact);
    setModalMode('edit');
    setModalType(contact.parent_id !== null && contact.parent_id !== undefined ? 'sub' : 'parent');
    setIsModalOpen(true);
  }, []);

  // Handle delete contact - show confirmation modal
  const handleDeleteContact = useCallback((contact) => {
    setContactToDelete(contact);
    setShowDeleteContactModal(true);
  }, []);

  // Confirm delete contact - actually perform the delete
  const confirmDeleteContact = useCallback(async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    const isParent = contactToDelete.parent_id === null || contactToDelete.parent_id === undefined;
    const contactType = isParent ? 'parent contact' : 'sub-contact';

    try {
      // Both parent and sub-contacts use the same endpoint
      const response = await api.delete(`/api/contacts/${contactToDelete.id}`);
      
      if (response.data?.success) {
        // Remove contact from state
        setAllContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
        // Also remove any sub-contacts if this was a parent
        if (isParent) {
          setAllContacts(prev => prev.filter(c => c.parent_id !== contactToDelete.id));
        }
        showToast(`${contactType.charAt(0).toUpperCase() + contactType.slice(1)} deleted successfully`, 'success');
        // Refresh contacts from backend
        await fetchContacts();
        // Close modal and reset state
        setShowDeleteContactModal(false);
        setContactToDelete(null);
      } else {
        showToast(response.data?.message || 'Failed to delete contact', 'error');
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      showToast(err.response?.data?.message || 'Failed to delete contact', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [contactToDelete, showToast, fetchContacts]);

  // Render actions for each row
  const renderActions = useCallback((row) => {
    return (
      <div className="flex items-center gap-2">
        <button 
          onClick={() => {
            // View contact functionality
          }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="View contact"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleEditContact(row)}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
          title="Edit contact"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleDeleteContact(row)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete contact"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }, [handleEditContact, handleDeleteContact]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] -m-6">
        <div className="flex h-full">
          {/* Left Sidebar - SearchPanel */}
          {!isSearchPanelCollapsed ? (
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Contact Management</h2>
                  <p className="text-sm text-gray-500">Search and filter contacts</p>
                </div>
                <button
                  onClick={() => setIsSearchPanelCollapsed(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  title="Collapse search panel"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <SearchPanel
                  searchConfig={searchConfig}
                  activeSearches={activeSearches}
                  onSearchChange={handleSearchChange}
                  onSearchFocus={handleSearchFocus}
                  lastActiveSearchId={lastActiveSearchId}
                  maxSearches={searchConfig.length}
                  showAddButton={true} // Show add button to add search bars from schema
                  schemaList={searchSchemaList} // Pass schema list for plus button dropdown
                  getValueOptionsForField={getValueOptionsForField} // Function to get filtered valueOptions
                  className="border-0 shadow-none"
                />
                
                {/* Separate Template Panel */}
                <TemplatePanel
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                  onSetDefault={handleSetDefault}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onSave={handleSave}
                  onSaveAs={handleSaveAs}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          ) : (
            <div className="w-12 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300">
              <div className="px-2 py-3 border-b border-gray-200 flex items-center justify-center">
                <button
                  onClick={() => setIsSearchPanelCollapsed(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  title="Expand search panel"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header - SortPanel */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {pagination.total > 0 
                      ? `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} contacts`
                      : 'No contacts found'
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-2 divide-x divide-gray-200">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                        viewMode === 'list' 
                          ? 'bg-white shadow-sm text-gray-900' 
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <ListBulletIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">List view</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                        viewMode === 'map' 
                          ? 'bg-white shadow-sm text-gray-900' 
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <MapIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Map view</span>
                    </button>
                  </div>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors">
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Contact</span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  setModalMode('add');
                                  setModalType('parent');
                                  setSelectedContact(null);
                                  setIsModalOpen(true);
                                }}
                                className={`${
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                } group flex items-center w-full px-4 py-2 text-sm`}
                              >
                                Parent-Contact
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  setModalMode('add');
                                  setModalType('sub');
                                  setSelectedContact(null);
                                  setIsModalOpen(true);
                                }}
                                className={`${
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                } group flex items-center w-full px-4 py-2 text-sm`}
                              >
                                Sub-Contact
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>

              {/* SortPanel */}
              <SortPanel
                searchConfig={searchConfig}
                activeSearches={activeSearches}
                activeSorts={activeSorts}
                onSortChange={handleSortChange}
                onSortValueSelect={handleSortValueSelect}
                getDropdownOptions={getValueOptionsForField}
                maxSorts={searchConfig.length}
                className="border-0 shadow-none"
              />

              {/* Expand All Checkbox */}
              <div className="mt-3 flex items-center">
                <input
                  type="checkbox"
                  id="expand-all"
                  checked={expandAll}
                  onChange={(e) => setExpandAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="expand-all"
                  className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Expand all
                </label>
              </div>
            </div>

            {/* Content Area */}
            {viewMode === 'list' ? (
              <div className="flex-1 overflow-y-auto">
                <HierarchicalContactView
                  contacts={processedData}
                  allContacts={allContacts}
                  hasActiveSearches={hasActiveSearches}
                  activeSearches={activeSearches}
                  activeSorts={activeSorts}
                  expandAll={expandAll}
                  expandedPaths={expandedPaths}
                  onExpandedPathsChange={setExpandedPaths}
                  onContactSelect={(contact) => {
                    setSelectedContactId(contact.id);
                  }}
                  onContactDoubleClick={(contact) => {
                    setSelectedContact(contact);
                    setModalMode('edit');
                    setModalType(contact.parent_id !== null && contact.parent_id !== undefined ? 'sub' : 'parent');
                    setIsModalOpen(true);
                  }}
                  onContactEdit={handleEditContact}
                  onContactDelete={handleDeleteContact}
                />
              </div>
            ) : (
              <div className="flex-1 relative overflow-hidden w-full h-full">
                {/* Map - Full Width Container */}
                <ContactMapView
                  contacts={mapContacts}
                  onContactSelect={(contact) => setSelectedContactId(contact.id)}
                  selectedContactId={selectedContactId}
                />

                {/* Left Panel - Transparent Overlay (Shorter) */}
                <div className="absolute left-0 top-0 w-80 max-h-[80vh] overflow-y-auto bg-transparent/100 backdrop-blur-xs border-r border-gray-200/50 shadow-lg z-10 rounded-r-lg">
                    <HierarchicalContactView
                      contacts={processedData}
                      allContacts={allContacts}
                      hasActiveSearches={hasActiveSearches}
                      activeSearches={activeSearches}
                      activeSorts={activeSorts}
                      expandAll={expandAll}
                      expandedPaths={expandedPaths}
                      onExpandedPathsChange={setExpandedPaths}
                      onContactSelect={(contact) => {
                        setSelectedContactId(contact.id);
                      }}
                      onContactDoubleClick={(contact) => {
                        setSelectedContact(contact);
                        setModalMode('edit');
                        setModalType(contact.parent_id !== null && contact.parent_id !== undefined ? 'sub' : 'parent');
                        setIsModalOpen(true);
                      }}
                      onContactEdit={handleEditContact}
                      onContactDelete={handleDeleteContact}
                    />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contact={selectedContact ? {
          ...selectedContact,
          parentContactName: selectedContact.parent_id !== null && selectedContact.parent_id !== undefined
            ? allContacts.find(c => c.id === selectedContact.parent_id)?.name || ''
            : ''
        } : (modalMode === 'add' ? {} : null)}
        isOpen={isModalOpen}
        mode={modalMode}
        type={modalType}
        allContacts={allContacts}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContact(null);
        }}
        onSave={(updatedContact) => {
          if (modalMode === 'add') {
            // Add new contact
            const newContact = {
              ...updatedContact,
              id: `contact-${Date.now()}-${Math.random()}`,
              // parent_id is already set correctly in ContactDetailModal handleSave
              parent_id: updatedContact.parent_id !== undefined ? updatedContact.parent_id : (modalType === 'sub' ? null : null)
            };
            setAllContacts(prev => [...prev, newContact]);
          } else {
            // Update existing contact
            setAllContacts(prev => 
              prev.map(contact => 
                contact.id === updatedContact.id ? updatedContact : contact
              )
            );
            setSelectedContact(updatedContact);
          }
          // Refresh filtered contacts by updating state
          // The processedData will automatically update based on allContacts
          // Modal will handle closing itself after showing success message
        }}
        onEditSubContact={(subContact) => {
          setSelectedContact(subContact);
          setModalMode('edit');
          setModalType('sub');
          setIsModalOpen(true);
        }}
        onAddSubContact={(parentContact) => {
          // Create a new sub-contact with parent_id set
          const newSubContact = {
            parent_id: parentContact.id,
            name: '',
            email: '',
            phone: '',
            contact_type: '',
            category_description: '',
            location_name: '',
            physical_address: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            shipping_address: '',
            billing_address: '',
            hours_of_operation: '',
            days_of_operation: '',
            service_zone: '',
            route: '',
            pwsid: ''
          };
          setSelectedContact(newSubContact);
          setModalMode('add');
          setModalType('sub');
          setIsModalOpen(true);
        }}
        onImportSubContacts={(importedSubContacts) => {
          // Add all imported sub-contacts to allContacts
          const newSubContacts = importedSubContacts.map(subContact => ({
            ...subContact,
            id: subContact.id || `contact-${Date.now()}-${Math.random()}`
          }));
          setAllContacts(prev => [...prev, ...newSubContacts]);
          setIsModalOpen(false);
          setSelectedContact(null);
        }}
      />

      {/* Template Modal */}
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toastType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {toastType === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-[90vw]">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Save Template'}
              </h3>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultTemplate}
                    onChange={(e) => setIsDefaultTemplate(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Set as default template</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setTemplateName('');
                    setIsDefaultTemplate(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (templateName.trim()) {
                      // Only update if editingTemplate exists (not null)
                      // "Save As" clears editingTemplate, so it will always create new
                      const isUpdate = !!editingTemplate;
                      saveTemplate(templateName, isUpdate, isDefaultTemplate);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  {editingTemplate ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {showDeleteModal && templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-[90vw]">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Delete Template</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete the template &quot;{templateToDelete.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTemplateToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTemplate}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contact Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteContactModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteContactModal(false);
            setContactToDelete(null);
          }
        }}
        onConfirm={confirmDeleteContact}
        title={contactToDelete ? `Delete ${contactToDelete.parent_id === null || contactToDelete.parent_id === undefined ? 'Parent Contact' : 'Sub-Contact'}` : 'Delete Contact'}
        message={contactToDelete ? `Are you sure you want to delete ${contactToDelete.parent_id === null || contactToDelete.parent_id === undefined ? 'parent contact' : 'sub-contact'} "${contactToDelete.name}"? This action cannot be undone.${contactToDelete.parent_id === null || contactToDelete.parent_id === undefined ? ' All associated sub-contacts will also be deleted.' : ''}` : 'Are you sure you want to delete this contact? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
