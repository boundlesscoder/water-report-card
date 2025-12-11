'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// HierarchicalContactView Component - Displays contacts in a dynamic hierarchical structure based on searched location fields. Only shows sub-contacts (parent_id is not null)
export default function HierarchicalContactView({ 
  contacts = [], 
  parentContactName = null,
  onContactSelect = null,
  hasActiveSearches = false,
  onContactDoubleClick = null,
  bigLocationField = null,
  activeSearches = [],
  activeSorts = [],
  expandAll = false
}) {
  // Single expanded state map: key is the path (e.g., "region|state|city"), value is boolean
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const prevExpandAllRef = useRef(expandAll);

  // Filter to only show sub-contacts (parent_id is not null)
  const subContacts = useMemo(() => {
    return contacts.filter(contact => contact.parent_id !== null && contact.parent_id !== undefined);
  }, [contacts]);

  // Hierarchical field order
  const hierarchicalFields = ['region', 'state', 'city', 'service_zone', 'route'];

  // Helper function to check if a field has "Show all" selected
  const hasShowAll = useCallback((fieldId) => {
    const search = activeSearches.find(s => s.fieldId === fieldId);
    return search && 
      search.value && 
      search.value.trim().toLowerCase() === 'show all';
  }, [activeSearches]);

  // Helper function to compare values for sorting
  const compareValues = useCallback((a, b, direction = 'asc') => {
    const aStr = String(a || '').trim();
    const bStr = String(b || '').trim();
    let comparison = aStr.localeCompare(bStr, undefined, { sensitivity: 'base' });
    return direction === 'desc' ? -comparison : comparison;
  }, []);

  // Get field label for display
  const getFieldLabel = useCallback((field) => {
    const labels = {
      region: 'Region',
      state: 'State',
      city: 'City',
      service_zone: 'Service Zone',
      route: 'Route'
    };
    return labels[field] || field;
  }, []);

  // Recursive function to build nested hierarchy structure
  const buildHierarchy = useCallback((contacts, levelFields, searchedFields, pathPrefix = '') => {
    if (levelFields.length === 0 || contacts.length === 0) {
      return { data: contacts, order: [], nestedOrders: {} };
    }

    const currentField = levelFields[0];
    const remainingFields = levelFields.slice(1);
    const currentSearch = searchedFields.find(f => f.fieldId === currentField);
    const isShowAll = currentSearch?.isShowAll;

    // Group contacts by current field
    const groups = {};
    const groupOrder = [];

    contacts.forEach(contact => {
      const fieldValue = contact[currentField] || 'Unknown';
      
      // Filter by search value if specific value is selected
      if (!isShowAll && currentSearch && !currentSearch.isShowAll) {
        const searchValue = currentSearch.value.toLowerCase().trim();
        const contactValue = String(fieldValue).toLowerCase().trim();
        if (contactValue !== searchValue && !contactValue.includes(searchValue)) {
          return; // Skip this contact if it doesn't match
        }
      }

      if (!groups[fieldValue]) {
        groups[fieldValue] = [];
        groupOrder.push(fieldValue);
      }
      groups[fieldValue].push(contact);
    });

    // Sort groups
    const sortConfig = activeSorts.find(s => s.fieldId === currentField);
    groupOrder.sort((a, b) => {
      if (sortConfig) {
        return compareValues(a, b, sortConfig.direction);
      }
      return compareValues(a, b, 'asc');
    });

    // Build nested structure for remaining levels
    const nestedGroups = {};
    const nestedOrders = {};

    if (remainingFields.length > 0) {
      groupOrder.forEach(groupKey => {
        const newPath = pathPrefix === '' ? groupKey : `${pathPrefix}|${groupKey}`;
        const nested = buildHierarchy(groups[groupKey], remainingFields, searchedFields, newPath);
        nestedGroups[groupKey] = nested.data;
        // Store the order for this path - ensure it's always an array
        nestedOrders[newPath] = Array.isArray(nested.order) ? nested.order : [];
        // Merge nested orders from deeper levels
        Object.assign(nestedOrders, nested.nestedOrders);
      });
    } else {
      // Leaf level - return contacts directly
      groupOrder.forEach(groupKey => {
        nestedGroups[groupKey] = groups[groupKey];
      });
    }

    return {
      data: nestedGroups,
      order: groupOrder,
      nestedOrders
    };
  }, [activeSorts, compareValues]);

  // Build the complete hierarchy structure
  const hierarchy = useMemo(() => {
    if (!bigLocationField) {
      return { data: {}, order: [], nestedOrders: {}, levelFields: [] };
    }

    // Find all location fields being searched (in hierarchical order)
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
        const indexA = hierarchicalFields.indexOf(a.fieldId);
        const indexB = hierarchicalFields.indexOf(b.fieldId);
        return indexA - indexB;
      });

    // Get all levels starting from bigLocationField
    const bigLocationIndex = hierarchicalFields.indexOf(bigLocationField);
    const subsequentFields = searchedLocationFields
      .filter(f => {
        const fieldIndex = hierarchicalFields.indexOf(f.fieldId);
        return fieldIndex > bigLocationIndex;
      })
      .map(f => f.fieldId);
    
    // Remove duplicates and ensure proper order
    const levelFields = [bigLocationField];
    subsequentFields.forEach(fieldId => {
      if (!levelFields.includes(fieldId)) {
        const fieldIndex = hierarchicalFields.indexOf(fieldId);
        // Insert in correct hierarchical order
        let insertIndex = levelFields.length;
        for (let i = 0; i < levelFields.length; i++) {
          if (hierarchicalFields.indexOf(levelFields[i]) > fieldIndex) {
            insertIndex = i;
            break;
          }
        }
        levelFields.splice(insertIndex, 0, fieldId);
      }
    });

    const result = buildHierarchy(subContacts, levelFields, searchedLocationFields);
    
    // Ensure nested orders are set for all paths in the data structure. This is essential when both region and state are selected
    const ensureNestedOrders = (data, orders, nestedOrders, path = '') => {
      if (typeof data !== 'object' || Array.isArray(data)) return;
      
      Object.keys(data).forEach(key => {
        const currentPath = path === '' ? key : `${path}|${key}`;
        const currentData = data[key];
        
        // If this level has nested data (object with keys), ensure order is set
        if (typeof currentData === 'object' && !Array.isArray(currentData)) {
          const dataKeys = Object.keys(currentData);
          // Always set the order, even if it already exists, to ensure it's correct
          nestedOrders[currentPath] = dataKeys;
          // Recursively check deeper levels
          ensureNestedOrders(currentData, orders, nestedOrders, currentPath);
        }
      });
    };
    
    // Ensure all nested orders are properly set
    ensureNestedOrders(result.data, result.order, result.nestedOrders);
    
    return {
      ...result,
      levelFields
    };
  }, [subContacts, bigLocationField, activeSearches, buildHierarchy, hierarchicalFields]);

  // Toggle path expansion
  const togglePath = useCallback((path) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Check if path is expanded
  const isPathExpanded = useCallback((path) => {
    return expandedPaths.has(path);
  }, [expandedPaths]);

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
    // Only run when expandAll changes, not on every hierarchy update
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
      
      // Get order for current level
      const currentOrder = currentPath === '' 
        ? (Array.isArray(topLevelOrder) ? topLevelOrder : [])
        : (Array.isArray(nestedOrders[currentPath]) ? nestedOrders[currentPath] : []);

      if (!Array.isArray(currentOrder) || currentOrder.length === 0) {
        return paths;
      }

      // Get data for current level from root using path
      let currentData = rootData;
      if (currentPath !== '') {
        const pathParts = currentPath.split('|');
        currentData = pathParts.reduce((obj, key) => obj?.[key], rootData);
      }

      if (!currentData || typeof currentData !== 'object' || Array.isArray(currentData)) {
        return paths;
      }

      // Collect all paths at this level and below
      currentOrder.forEach(key => {
        const newPath = currentPath === '' ? key : `${currentPath}|${key}`;
        const groupData = currentData[key];

        // If there are more hierarchy levels (remainingFields.length > 0)
        if (remainingFields.length > 0) {
          // Add path if groupData is an object (contains nested groups)
          if (typeof groupData === 'object' && !Array.isArray(groupData)) {
            paths.add(newPath);
            // Recursively collect nested paths
            const nestedPaths = collectAllPaths(rootData, topLevelOrder, nestedOrders, remainingFields, newPath);
            nestedPaths.forEach(p => paths.add(p));
          }
        } else {
          // This is the last hierarchy level - remainingFields.length === 0. We need to add this path so it expands to show contacts
          paths.add(newPath);
        }
      });

      return paths;
    };

    if (expandAll) {
      // Expand all: collect all paths and set them
      const allPaths = collectAllPaths(
        hierarchy.data, 
        hierarchy.order, 
        hierarchy.nestedOrders || {}, 
        hierarchy.levelFields
      );
      setExpandedPaths(allPaths);
    } else {
      // Collapse all: clear all expanded paths
      setExpandedPaths(new Set());
    }

    // Update the ref to track the current expandAll value
    prevExpandAllRef.current = expandAll;
  }, [expandAll, hierarchy.order, hierarchy.data, hierarchy.nestedOrders, hierarchy.levelFields]);

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
            return (
              <div
                key={contact.id}
                onClick={() => onContactSelect?.(contact)}
                onDoubleClick={() => onContactDoubleClick?.(contact)}
                className="bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors"
                style={{ marginLeft: `${depth * 16}px` }}
              >
                <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`} />
                <span className="text-sm text-gray-900 flex-1">
                  {contact.name + ' | ' + contact.location_name}
                </span>
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

    // Get order for current level - use topLevelOrder for root, nestedOrders for nested paths. Fallback to Object.keys if nestedOrders doesn't have the path
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

          return (
            <div key={key} className="space-y-2">
              {/* Group Header */}
              <div
                onClick={() => togglePath(newPath)}
                className="bg-white rounded-md shadow-sm border border-gray-200 flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ marginLeft: `${depth * 16}px` }}
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
  }, [isPathExpanded, togglePath, countContacts, getFieldLabel, onContactSelect, onContactDoubleClick, getStatusColor]);

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

  // If no hierarchical levels (e.g., only name searched), show flat list of sub-contacts
  if (!hierarchy?.levelFields || hierarchy.levelFields.length === 0) {
    const nameSort = activeSorts.find(s => s.fieldId === 'name');
    const sortedSubContacts = [...subContacts].sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      let comparison = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
      if (nameSort && nameSort.direction === 'desc') {
        comparison = -comparison;
      }
      return comparison;
    });

    return (
      <div className="bg-transparent rounded-lg p-4">
        {parentContactName && (
          <div className="mb-4 text-left">
            <h2 className="text-lg font-semibold text-gray-900">{parentContactName}</h2>
          </div>
        )}

        <div className="space-y-2">
          {sortedSubContacts.map(contact => {
            const statusColor = getStatusColor(contact.contact_status);
            
            return (
              <div
                key={contact.id}
                onClick={() => onContactSelect?.(contact)}
                onDoubleClick={() => onContactDoubleClick?.(contact)}
                className="bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`} />
                <span className="text-sm text-gray-900 flex-1">
                  {contact.name + ' | ' + contact.location_name}
                </span>
              </div>
            );
          })}
        </div>

        {sortedSubContacts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No sub-contacts found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-transparent rounded-lg p-4">
      {parentContactName && (
        <div className="mb-4 text-left">
          <h2 className="text-lg font-semibold text-gray-900">{parentContactName}</h2>
        </div>
      )}

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
