'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// HierarchicalContactView Component - Groups contacts by sortbar order
export default function HierarchicalContactView({ 
  contacts = [], 
  onContactSelect = null,
  hasActiveSearches = false,
  onContactDoubleClick = null,
  onContactEdit = null, // Handler for edit button click
  onContactDelete = null, // Handler for delete button click
  activeSearches = [],
  activeSorts = [],
  expandAll = false,
  allContacts = [], // All contacts to find parent contacts
  expandedPaths = null, // External expanded paths state (optional)
  onExpandedPathsChange = null // Callback to update expanded paths (optional)
}) {
  // Use external expandedPaths if provided, otherwise use internal state
  const [internalExpandedPaths, setInternalExpandedPaths] = useState(new Set());
  const expandedPathsState = expandedPaths !== null ? expandedPaths : internalExpandedPaths;
  const setExpandedPathsState = onExpandedPathsChange || setInternalExpandedPaths;
  
  const prevExpandAllRef = useRef(expandAll);

  // Show all contacts (both parent and sub-contacts)
  // But when grouping by name, we need to show sub-contacts grouped by parent
  const displayContacts = useMemo(() => {
    return contacts;
  }, [contacts]);

  // Get parent contact name for a sub-contact
  const getParentContactName = useCallback((contact) => {
    if (contact.parent_id === null || contact.parent_id === undefined) {
      return null; // This is a parent contact
    }
    // Find parent contact - check both contacts (filtered) and allContacts (all data)
    const parent = contacts.find(c => c.id === contact.parent_id) || 
                   allContacts.find(c => c.id === contact.parent_id);
    return parent?.name || 'Unknown Parent';
  }, [contacts, allContacts]);

  // Helper function to compare values for sorting (always ascending)
  const compareValues = useCallback((a, b) => {
    const aStr = String(a || '').trim();
    const bStr = String(b || '').trim();
    return aStr.localeCompare(bStr, undefined, { sensitivity: 'base' });
  }, []);

  // Get field label for display
  const getFieldLabel = useCallback((field) => {
    const labels = {
      name: 'Contact Name',
      contact_type: 'Contact Type',
      category_description: 'Category Description',
      region: 'Region',
      state: 'State',
      city: 'City',
      location: 'Location',
      service_zone: 'Service Zone',
      route: 'Route',
      pwsid: 'Water District',
      is_liquoslabs_account: 'LiquosLabs™ Account'
    };
    return labels[field] || field;
  }, []);

  // Get field value from contact
  const getFieldValue = useCallback((contact, fieldId) => {
    let value = contact[fieldId];
    
    // Handle field mappings
    if (fieldId === 'category_description' && contact.category_description) {
      value = contact.category_description;
    } else if (fieldId === 'location' && contact.location_name) {
      value = contact.location_name;
    } else if (fieldId === 'is_liquoslabs_account') {
      value = contact.is_liquos_account !== undefined ? (contact.is_liquos_account ? 'Yes' : 'No') : 'Unknown';
    }
    
    // Use 'Unknown' for null/undefined/empty values
    if (value === null || value === undefined || value === '') {
      return 'Unknown';
    }
    return String(value).trim();
  }, []);

  // Build hierarchy based on sortbar order
  const hierarchy = useMemo(() => {
    // If no sort bars, return empty hierarchy
    if (!activeSorts || activeSorts.length === 0) {
      return { data: {}, order: [], nestedOrders: {}, levelFields: [] };
    }

    // Recursive function to build nested groups
    const buildGroups = (contacts, sortIndex, pathPrefix = '') => {
      if (sortIndex >= activeSorts.length || contacts.length === 0) {
        return { data: contacts, order: [], nestedOrders: {} };
      }

      const sort = activeSorts[sortIndex];
      const fieldId = sort.fieldId;
      const selectedValue = sort.selectedValue;

      // Special handling for "name" field (parent contact)
      // When grouping by name, group sub-contacts by their parent contact name
      if (fieldId === 'name') {
        const groups = {};
        const groupOrder = [];
        
        // Get the search value for name field
        const nameSearch = activeSearches.find(s => s.fieldId === 'name');
        const searchValue = nameSearch?.value?.toLowerCase().trim() || '';
        const isShowAll = searchValue === '' || searchValue === 'show all';

        contacts.forEach(contact => {
          // For name field, we want to group sub-contacts by parent contact name
          if (contact.parent_id !== null && contact.parent_id !== undefined) {
            // This is a sub-contact, get its parent's name
            const parentName = getParentContactName(contact);
            
            // Filter by search condition if not "Show all"
            if (!isShowAll && parentName) {
              const parentNameLower = String(parentName).toLowerCase();
              if (!parentNameLower.includes(searchValue)) {
                return; // Skip this sub-contact if parent doesn't match
              }
            }
            
            if (parentName) {
              if (!groups[parentName]) {
                groups[parentName] = [];
                groupOrder.push(parentName);
              }
              groups[parentName].push(contact);
            }
          }
          // Skip parent contacts when grouping by name (we only show sub-contacts)
        });

        // Sort groups: selectedValue at top, then others in ascending order
        groupOrder.sort((a, b) => {
          if (selectedValue !== null && selectedValue !== undefined) {
            if (a === String(selectedValue)) return -1;
            if (b === String(selectedValue)) return 1;
          }
          return compareValues(a, b);
        });

        // Build nested structure for remaining sort levels
        const nestedGroups = {};
        const nestedOrders = {};

        if (sortIndex + 1 < activeSorts.length) {
          groupOrder.forEach(groupKey => {
            const newPath = pathPrefix === '' ? groupKey : `${pathPrefix}|${groupKey}`;
            const nested = buildGroups(groups[groupKey], sortIndex + 1, newPath);
            nestedGroups[groupKey] = nested.data;
            nestedOrders[newPath] = Array.isArray(nested.order) ? nested.order : [];
            Object.assign(nestedOrders, nested.nestedOrders);
          });
        } else {
          // Leaf level - sort contacts within group by location_name
          groupOrder.forEach(groupKey => {
            const groupContacts = groups[groupKey];
            groupContacts.sort((a, b) => {
              const aLocation = (a.location_name || a.location || '').toLowerCase();
              const bLocation = (b.location_name || b.location || '').toLowerCase();
              return aLocation.localeCompare(bLocation, undefined, { sensitivity: 'base' });
            });
            nestedGroups[groupKey] = groupContacts;
          });
        }

        return {
          data: nestedGroups,
          order: groupOrder,
          nestedOrders
        };
      }

      // Regular grouping for other fields
      const groups = {};
      const groupOrder = [];

      contacts.forEach(contact => {
        const fieldValue = getFieldValue(contact, fieldId);
        
        if (!groups[fieldValue]) {
          groups[fieldValue] = [];
          groupOrder.push(fieldValue);
        }
        groups[fieldValue].push(contact);
      });

      // Sort groups: selectedValue at top, then others in ascending order
      groupOrder.sort((a, b) => {
        if (selectedValue !== null && selectedValue !== undefined) {
          if (a === String(selectedValue)) return -1;
          if (b === String(selectedValue)) return 1;
        }
        return compareValues(a, b);
      });

      // Build nested structure for remaining sort levels
      const nestedGroups = {};
      const nestedOrders = {};

      if (sortIndex + 1 < activeSorts.length) {
        groupOrder.forEach(groupKey => {
          const newPath = pathPrefix === '' ? groupKey : `${pathPrefix}|${groupKey}`;
          const nested = buildGroups(groups[groupKey], sortIndex + 1, newPath);
          nestedGroups[groupKey] = nested.data;
          nestedOrders[newPath] = Array.isArray(nested.order) ? nested.order : [];
          Object.assign(nestedOrders, nested.nestedOrders);
        });
      } else {
        // Leaf level - sort contacts within group by location_name
        groupOrder.forEach(groupKey => {
          const groupContacts = groups[groupKey];
          // Sort contacts by location_name as standard
          groupContacts.sort((a, b) => {
            const aLocation = (a.location_name || a.location || '').toLowerCase();
            const bLocation = (b.location_name || b.location || '').toLowerCase();
            return aLocation.localeCompare(bLocation, undefined, { sensitivity: 'base' });
          });
          nestedGroups[groupKey] = groupContacts;
        });
      }

      return {
        data: nestedGroups,
        order: groupOrder,
        nestedOrders
      };
    };

    const result = buildGroups(displayContacts, 0);
    
    // Ensure nested orders are set for all paths
    const ensureNestedOrders = (data, orders, nestedOrders, path = '') => {
      if (typeof data !== 'object' || Array.isArray(data)) return;
      
      Object.keys(data).forEach(key => {
        const currentPath = path === '' ? key : `${path}|${key}`;
        const currentData = data[key];
        
        if (typeof currentData === 'object' && !Array.isArray(currentData)) {
          const dataKeys = Object.keys(currentData);
          nestedOrders[currentPath] = dataKeys;
          ensureNestedOrders(currentData, orders, nestedOrders, currentPath);
        }
      });
    };
    
    ensureNestedOrders(result.data, result.order, result.nestedOrders);
    
    return {
      ...result,
      levelFields: activeSorts.map(s => s.fieldId)
    };
  }, [displayContacts, activeSorts, getFieldValue, compareValues, getParentContactName, activeSearches]);

  // Toggle path expansion
  const togglePath = useCallback((path) => {
    setExpandedPathsState(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, [setExpandedPathsState]);

  // Check if path is expanded
  const isPathExpanded = useCallback((path) => {
    return expandedPathsState.has(path);
  }, [expandedPathsState]);

  // Count contacts in a group (recursive)
  const countContacts = useCallback((data) => {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'object') {
      return Object.values(data).reduce((sum, group) => sum + countContacts(group), 0);
    }
    return 0;
  }, []);

  // Auto-expand/collapse all paths
  useEffect(() => {
    if (prevExpandAllRef.current === expandAll) {
      return;
    }

    if (hierarchy.order.length === 0 || !hierarchy.levelFields || hierarchy.levelFields.length === 0) {
      prevExpandAllRef.current = expandAll;
      return;
    }

    const collectAllPaths = (rootData, topLevelOrder, nestedOrders, levelFields, currentPath = '') => {
      const paths = new Set();
      
      if (levelFields.length === 0) {
        return paths;
      }

      const remainingFields = levelFields.slice(1);
      
      const currentOrder = currentPath === '' 
        ? (Array.isArray(topLevelOrder) ? topLevelOrder : [])
        : (Array.isArray(nestedOrders[currentPath]) ? nestedOrders[currentPath] : []);

      if (!Array.isArray(currentOrder) || currentOrder.length === 0) {
        return paths;
      }

      let currentData = rootData;
      if (currentPath !== '') {
        const pathParts = currentPath.split('|');
        currentData = pathParts.reduce((obj, key) => obj?.[key], rootData);
      }

      if (!currentData || typeof currentData !== 'object' || Array.isArray(currentData)) {
        return paths;
      }

      currentOrder.forEach(key => {
        const newPath = currentPath === '' ? key : `${currentPath}|${key}`;
        const groupData = currentData[key];

        if (remainingFields.length > 0) {
          if (typeof groupData === 'object' && !Array.isArray(groupData)) {
            paths.add(newPath);
            const nestedPaths = collectAllPaths(rootData, topLevelOrder, nestedOrders, remainingFields, newPath);
            nestedPaths.forEach(p => paths.add(p));
          }
        } else {
          paths.add(newPath);
        }
      });

      return paths;
    };

    if (expandAll) {
      const allPaths = collectAllPaths(
        hierarchy.data, 
        hierarchy.order, 
        hierarchy.nestedOrders || {}, 
        hierarchy.levelFields
      );
      setExpandedPathsState(allPaths);
    } else {
      setExpandedPathsState(new Set());
    }

    prevExpandAllRef.current = expandAll;
  }, [expandAll, hierarchy.order, hierarchy.data, hierarchy.nestedOrders, hierarchy.levelFields, setExpandedPathsState]);

  // Get status color
  const getStatusColor = useCallback((status) => {
    if (!status) return 'bg-gray-400';
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('green')) return 'bg-green-500';
    if (statusLower.includes('warning') || statusLower.includes('yellow')) return 'bg-yellow-500';
    if (statusLower.includes('error') || statusLower.includes('red')) return 'bg-red-500';
    return 'bg-gray-400';
  }, []);

  // Recursive rendering function
  const renderHierarchy = useCallback((rootData, topLevelOrder, nestedOrders, levelFields, currentPath = '', depth = 0) => {
    if (levelFields.length === 0) {
      // Leaf level - render contacts
      let leafData = rootData;
      if (currentPath !== '') {
        const pathParts = currentPath.split('|');
        leafData = pathParts.reduce((obj, key) => obj?.[key], rootData);
      }
      
      if (!Array.isArray(leafData)) return null;
      
      return (
        <>
          {leafData.map(contact => {
            const statusColor = getStatusColor(contact.contact_status);
            const isParent = contact.parent_id === null || contact.parent_id === undefined;
            return (
              <div
                key={contact.id}
                className="bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm flex items-center gap-3 px-4 py-2 transition-colors"
                style={{ marginLeft: `${depth * 16}px` }}
              >
                <div 
                  onClick={() => onContactSelect?.(contact)}
                  onDoubleClick={() => onContactDoubleClick?.(contact)}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`} />
                  <span className="text-sm text-gray-900">
                    {contact.name + ' | ' + (contact.location_name || contact.location || '')}
                  </span>
                </div>
                {/* Edit and Delete Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onContactEdit?.(contact)}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    title={`Edit ${isParent ? 'parent' : 'sub'}-contact`}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onContactDelete?.(contact)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title={`Delete ${isParent ? 'parent' : 'sub'}-contact`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </>
      );
    }

    const currentField = levelFields[0];
    const remainingFields = levelFields.slice(1);
    
    // Get data for current level from root using path
    let currentData = rootData;
    if (currentPath !== '') {
      const pathParts = currentPath.split('|');
      currentData = pathParts.reduce((obj, key) => obj?.[key], rootData);
    }

    if (!currentData || typeof currentData !== 'object' || Array.isArray(currentData)) {
      return null;
    }

    // Get order for current level
    let currentOrder;
    if (currentPath === '') {
      currentOrder = Array.isArray(topLevelOrder) ? topLevelOrder : [];
    } else {
      const nestedOrder = nestedOrders[currentPath];
      const dataKeys = typeof currentData === 'object' && !Array.isArray(currentData) ? Object.keys(currentData) : [];
      
      currentOrder = Array.isArray(nestedOrder) && nestedOrder.length > 0
        ? nestedOrder
        : dataKeys;
    }

    if (!Array.isArray(currentOrder) || currentOrder.length === 0) {
      return null;
    }

    return (
      <>
        {currentOrder.map(key => {
          const groupData = currentData[key];
          const newPath = currentPath === '' ? key : `${currentPath}|${key}`;
          const isExpanded = isPathExpanded(newPath);
          const contactCount = countContacts(groupData);
          
          // Find parent contact when grouping by "name" field (parent contact level)
          const isNameField = currentField === 'name';
          let parentContact = null;
          if (isNameField) {
            // Find the parent contact by name
            parentContact = allContacts.find(c => 
              (c.parent_id === null || c.parent_id === undefined) && 
              c.name === key
            );
          }

          return (
            <div key={key} className="space-y-2">
              {/* Group Header */}
              <div
                className="bg-white rounded-md shadow-sm border border-gray-200 flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                style={{ marginLeft: `${depth * 16}px` }}
              >
                <div 
                  onClick={() => togglePath(newPath)}
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="text-sm font-medium text-gray-800">
                    {getFieldLabel(currentField)} | {key} ({contactCount})
                  </span>
                </div>
                {/* Edit and Delete Buttons for Parent Contacts (name field level) */}
                {isNameField && parentContact && (
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onContactEdit?.(parentContact)}
                      className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      title="Edit parent contact"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onContactDelete?.(parentContact)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete parent contact"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Nested Content */}
              {isExpanded && (
                <div className="space-y-2">
                  {renderHierarchy(rootData, topLevelOrder, nestedOrders, remainingFields, newPath, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }, [isPathExpanded, togglePath, countContacts, getFieldLabel, onContactSelect, onContactDoubleClick, onContactEdit, onContactDelete, getStatusColor, allContacts]);

  // Don't show anything if there are no active searches
  if (!hasActiveSearches) {
    return (
      <div className="bg-transparent rounded-lg p-4">
        <div className="text-center py-8 text-gray-500">
          <p>Please search to view contacts</p>
        </div>
      </div>
    );
  }

  // If no hierarchical levels (no sort bars), show nothing
  if (!hierarchy?.levelFields || hierarchy.levelFields.length === 0) {
    return (
      <div className="bg-transparent rounded-lg p-4">
        <div className="text-center py-8 text-gray-500">
          <p>No sort conditions. Please add a sort bar to view contacts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent rounded-lg p-4">
      <div className="space-y-2">
        {renderHierarchy(hierarchy.data, hierarchy.order, hierarchy.nestedOrders || {}, hierarchy.levelFields)}
      </div>

      {hierarchy.order.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No contacts found</p>
        </div>
      )}
    </div>
  );
}
