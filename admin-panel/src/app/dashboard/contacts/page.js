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
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import SearchPanel from '../../../components/ui/SearchPanel';
import SortPanel from '../../../components/ui/SortPanel';
import SearchableDataTable from '../../../components/ui/SearchableDataTable';
import HierarchicalContactView from '../../../components/ui/HierarchicalContactView';
import ContactDetailModal from '../../../components/ui/ContactDetailModal';
import ContactMapView from '../../../components/mapview/ContactMapView';
import { contactConfig } from '../../../config/searchConfig';
import contactData from './contact-data.json';

export default function ContactManagement() {
  // Load data from JSON file
  const [allContacts, setAllContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'add' or 'edit'
  const [modalType, setModalType] = useState('parent'); // 'parent' or 'sub'

  // Search and Sort state - Initialize with all search bars from config
  const [activeSearches, setActiveSearches] = useState(() => {
    return contactConfig.map((config, index) => ({
      id: `search-${config.id}-${index}`,
      fieldId: config.id,
      value: ''
    }));
  });
  const [activeSorts, setActiveSorts] = useState([]);
  const [activeSortId, setActiveSortId] = useState(null); // Track which sort bar is currently active
  const [lastActiveSearchId, setLastActiveSearchId] = useState(null); // Track which searchbar was last selected
  const [expandAll, setExpandAll] = useState(false); // Track "Expand all" checkbox state

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasPrev: false,
    hasNext: false
  });

  // Initialize data from JSON
  useEffect(() => {
    setLoading(true);
    try {
      // Transform contact data to match the expected format
      const transformedData = contactData.map(contact => ({
        ...contact,
        // Map contact_status to status for consistency
        status: contact.contact_status || contact.status,
        // Map location_name to location
        location: contact.location_name || contact.location,
        // Map category_description to category
        category: contact.category_description || contact.category,
        // Map is_liquos_account to is_liquoslabs_account
        is_liquoslabs_account: contact.is_liquos_account || false
      }));
      setAllContacts(transformedData);
      setFilteredContacts(transformedData);
      setPagination(prev => ({
        ...prev,
        total: transformedData.length,
        totalPages: Math.ceil(transformedData.length / prev.limit),
        hasNext: transformedData.length > prev.limit
      }));
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Extract unique values for any field from contact data
  const getUniqueValues = useCallback((fieldId, dataSource = allContacts) => {
    const values = new Set();
    
    // For name field, only include contacts (parent_id is null), exclude sub-contacts
    const filteredDataSource = fieldId === 'name' 
      ? dataSource.filter(contact => contact.parent_id === null || contact.parent_id === undefined)
      : dataSource;
    
    filteredDataSource.forEach(contact => {
      let value = contact[fieldId];
      
      // Handle field mappings
      if (fieldId === 'category' && contact.category_description) {
        value = contact.category_description;
      } else if (fieldId === 'location' && contact.location_name) {
        value = contact.location_name;
      } else if (fieldId === 'is_liquoslabs_account' && contact.is_liquos_account !== undefined) {
        value = contact.is_liquos_account ? 'Yes' : 'No';
      }
      
      if (value !== null && value !== undefined && value !== '') {
        // For contact_type with '/', just add the full value (let SearchBar handle hierarchy)
        // Don't split it here - SearchBar will organize it hierarchically
        values.add(String(value));
      }
    });
    return Array.from(values).sort();
  }, [allContacts]);

  // Apply filtering based on search conditions (without sorting) to get filtered data for dropdowns
  const filteredDataForDropdowns = useMemo(() => {
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

  // Get search config from config file with dynamic valueOptions for all fields
  // valueOptions are updated based on filtered data (searched records)
  const searchConfig = useMemo(() => {
    return contactConfig.map(config => {
      // Get unique values for this field from filtered data (if searches exist) or all data
      const dataSource = filteredDataForDropdowns.length < allContacts.length 
        ? filteredDataForDropdowns 
        : allContacts;
      const uniqueValues = getUniqueValues(config.id, dataSource);
      
      return {
        id: config.id,
        name: config.name,
        label: config.label || config.id,
        type: config.type || 'text',
        placeholder: config.placeholder || `Search by ${config.id}...`,
        valueOptions: uniqueValues, // Unique values from filtered/searched records
        options: config.options || [],
        sortable: config.sortable !== undefined ? config.sortable : true, // Include sortable property
        hasAllOption: config.hasAllOption || false // Include hasAllOption property
      };
    });
  }, [contactConfig, getUniqueValues, filteredDataForDropdowns, allContacts]);

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

  // Calculate big LOCATION based on filtered data
  const bigLocationField = useMemo(() => {
    // Check if there are any active searches (excluding "Show all" and empty values)
    const hasActiveSearches = activeSearches.some(search => {
      if (!search.value) return false;
      const trimmedValue = search.value.trim();
      if (trimmedValue === '' || trimmedValue.toLowerCase() === 'show all') return false;
      return true;
    });

    if (!hasActiveSearches) {
      return null;
    }

    // Calculate filtered data for "big LOCATION" analysis
    const filteredData = allContacts.filter(row => {
      return activeSearches.every(condition => {
        if (!condition.value || condition.value.trim() === '' || condition.value.toLowerCase() === 'show all') {
          return true;
        }
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
        if (condition.fieldId === 'contact_type') {
          const parts = rowValue.split('/').map(p => p.trim());
          return parts.some(part => part === searchValue) || rowValue === searchValue;
        }
        
        return rowValue.includes(searchValue);
      });
    });

    return getBigLocationField(filteredData);
  }, [activeSearches, allContacts, getBigLocationField]);

  // Automatically add sort bars when searching in sortable fields
  // Only run when activeSearches or searchConfig changes, not when activeSorts changes
  useEffect(() => {
    // Get fields that have active searches (with values, including "Show all") AND are sortable
    const searchedSortableFields = activeSearches
      .filter(s => {
        if (!s.fieldId) return false;
        // Include searches with "Show all" or any non-empty value
        if (!s.value || s.value.trim() === '') return false;
        // Check if this field is sortable
        const config = searchConfig.find(c => c.id === s.fieldId);
        return config && config.sortable === true;
      })
      .map(s => s.fieldId);

    setActiveSorts(prev => {
      // Get current sorted fields
      const sortedFields = prev.map(s => s.fieldId);

      // Find sortable fields that are searched but not yet sorted
      const fieldsToAdd = searchedSortableFields.filter(fieldId => !sortedFields.includes(fieldId));

      // Automatically add sort bars for newly searched sortable fields
      let updatedSorts = [...prev];
      if (fieldsToAdd.length > 0) {
        const newSorts = fieldsToAdd.map(fieldId => {
          // Get sortOption from config if available
          const config = searchConfig.find(c => c.id === fieldId);
          const defaultDirection = config?.sortOption === 'desc' ? 'desc' : 'asc';
          
          return {
            id: `sort-${Date.now()}-${Math.random()}-${fieldId}`,
            fieldId: fieldId,
            direction: defaultDirection,
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
        if (searchedSortableFields.includes(sort.fieldId)) {
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
    // Simply update activeSorts - handleSortDirectionChange already handles direction changes
    setActiveSorts([...sorts]);
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
        console.warn('Sort not found:', sortId, 'in sorts:', prev.map(s => s.id));
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

    // Apply sorting: First by big LOCATION (alphabetically), then by active sortbars
    const hierarchicalFields = ['region', 'state', 'city', 'service_zone', 'route'];
    
    data = [...data].sort((a, b) => {
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

  // Check if there are any active search conditions (excluding "Show all" and empty values)
  const hasActiveSearches = useMemo(() => {
    return activeSearches.some(search => {
      if (!search.value) return false;
      const trimmedValue = search.value.trim();
      if (trimmedValue === '') return false;
      if (trimmedValue.toLowerCase() === 'show all') return false;
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

  // Render actions for each row
  const renderActions = useCallback((row) => {
    return (
      <div className="flex items-center gap-2">
        <button 
          onClick={() => {
            console.log('View contact:', row.id);
          }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="View contact"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={() => {
            console.log('Edit contact:', row.id);
          }}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
          title="Edit contact"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={() => {
            console.log('Delete contact:', row.id);
          }}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete contact"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }, []);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] -m-6">
        <div className="flex h-full">
          {/* Left Sidebar - SearchPanel */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Contact Management</h2>
              <p className="text-sm text-gray-500">Search and filter contacts</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <SearchPanel
                searchConfig={searchConfig}
                activeSearches={activeSearches}
                onSearchChange={handleSearchChange}
                onSearchFocus={handleSearchFocus}
                lastActiveSearchId={lastActiveSearchId}
                maxSearches={searchConfig.length} // Show all search bars from config
                showAddButton={false} // Hide add button since all search bars are shown
                className="border-0 shadow-none"
              />
            </div>
          </div>

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
                onSortDirectionChange={handleSortDirectionChange}
                maxSorts={searchConfig.length} // Allow sorting by all fields
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
                  parentContactName={parentContactName}
                  hasActiveSearches={hasActiveSearches}
                  bigLocationField={bigLocationField}
                  activeSearches={activeSearches}
                  activeSorts={activeSorts}
                  expandAll={expandAll}
                  onContactSelect={(contact) => {
                    setSelectedContactId(contact.id);
                    console.log('Selected contact:', contact);
                  }}
                  onContactDoubleClick={(contact) => {
                    setSelectedContact(contact);
                    setModalMode('edit');
                    setModalType(contact.parent_id !== null && contact.parent_id !== undefined ? 'sub' : 'parent');
                    setIsModalOpen(true);
                  }}
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
                      parentContactName={parentContactName}
                      hasActiveSearches={hasActiveSearches}
                      bigLocationField={bigLocationField}
                      activeSearches={activeSearches}
                      activeSorts={activeSorts}
                      expandAll={expandAll}
                      onContactSelect={(contact) => {
                        setSelectedContactId(contact.id);
                      }}
                      onContactDoubleClick={(contact) => {
                        setSelectedContact(contact);
                        setIsModalOpen(true);
                      }}
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
              parent_id: modalType === 'sub' ? (updatedContact.parent_id || null) : null
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
          // Close modal after save
          setIsModalOpen(false);
          setSelectedContact(null);
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
      />
    </DashboardLayout>
  );
}
