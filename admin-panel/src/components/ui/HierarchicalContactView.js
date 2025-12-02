'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * HierarchicalContactView Component
 * Displays contacts in a dynamic hierarchical structure based on "big LOCATION"
 * Only shows sub-contacts (parent_id is not null)
 */
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
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedSubGroups, setExpandedSubGroups] = useState(new Set());
  const [expandedSubSubGroups, setExpandedSubSubGroups] = useState(new Set());

  // Filter to only show sub-contacts (parent_id is not null)
  const subContacts = useMemo(() => {
    return contacts.filter(contact => contact.parent_id !== null && contact.parent_id !== undefined);
  }, [contacts]);

  // Hierarchical field order
  const hierarchicalFields = ['region', 'state', 'city', 'service_zone', 'route'];

  // Determine which level to show next (if any) after big LOCATION
  const getNextLevel = useCallback((bigLocation) => {
    if (!bigLocation) return null;
    const index = hierarchicalFields.indexOf(bigLocation);
    if (index === -1 || index >= hierarchicalFields.length - 1) return null;
    return hierarchicalFields[index + 1];
  }, []);

  // Helper function to check if a field has "Show all" selected
  const hasShowAll = useCallback((fieldId) => {
    const search = activeSearches.find(s => s.fieldId === fieldId);
    return search && 
      search.value && 
      search.value.trim().toLowerCase() === 'show all';
  }, [activeSearches]);

  // Helper function to check if a level has multiple values in a group
  const hasMultipleValues = useCallback((contacts, fieldId) => {
    const values = new Set();
    contacts.forEach(contact => {
      const value = contact[fieldId];
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value).trim());
      }
    });
    return values.size > 1;
  }, []);

  // Helper function to compare values for sorting
  const compareValues = useCallback((a, b, direction = 'asc') => {
    const aStr = String(a || '').trim();
    const bStr = String(b || '').trim();
    let comparison = aStr.localeCompare(bStr, undefined, { sensitivity: 'base' });
    return direction === 'desc' ? -comparison : comparison;
  }, []);

  // Group sub-contacts dynamically based on big LOCATION
  // Supports multiple levels of nesting when "Show all" is selected
  const { groupedData, groupOrder, subGroupOrder, subSubGroupOrder, needsSubGrouping, needsSubSubGrouping, nextLevel, nextNextLevel } = useMemo(() => {
    if (!bigLocationField) {
      // No big LOCATION, return empty structure
      return { groupedData: {}, groupOrder: [], subGroupOrder: {}, subSubGroupOrder: {}, needsSubGrouping: false, needsSubSubGrouping: false, nextLevel: null, nextNextLevel: null };
    }

    const nextLevel = getNextLevel(bigLocationField);
    const nextNextLevel = nextLevel ? getNextLevel(nextLevel) : null;
    const groups = {};
    const groupOrderMap = new Map();
    const subGroupOrderMap = new Map();
    const subSubGroupOrderMap = new Map();

    // First pass: Group by big LOCATION
    subContacts.forEach((contact) => {
      const bigLocationValue = contact[bigLocationField] || 'Unknown';
      
      if (!groups[bigLocationValue]) {
        groups[bigLocationValue] = [];
        if (!groupOrderMap.has(bigLocationValue)) {
          groupOrderMap.set(bigLocationValue, groupOrderMap.size);
        }
      }
      groups[bigLocationValue].push(contact);
    });

    // Second pass: Check if we need next level grouping
    let needsSubGrouping = false;
    if (nextLevel && hasShowAll(nextLevel)) {
      // Check each big LOCATION group to see if it has multiple next level values
      for (const groupKey in groups) {
        if (hasMultipleValues(groups[groupKey], nextLevel)) {
          needsSubGrouping = true;
          break;
        }
      }
    }

    // Third pass: Create nested structure for next level
    let finalGroups = groups;
    if (needsSubGrouping && nextLevel) {
      const nestedGroups = {};
      
      for (const groupKey in groups) {
        nestedGroups[groupKey] = {};
        const contactsInGroup = groups[groupKey];
        
        contactsInGroup.forEach((contact) => {
          const nextLevelValue = contact[nextLevel] || 'Unknown';
          
          if (!nestedGroups[groupKey][nextLevelValue]) {
            nestedGroups[groupKey][nextLevelValue] = [];
            if (!subGroupOrderMap.has(groupKey)) {
              subGroupOrderMap.set(groupKey, new Map());
            }
            if (!subGroupOrderMap.get(groupKey).has(nextLevelValue)) {
              subGroupOrderMap.get(groupKey).set(nextLevelValue, subGroupOrderMap.get(groupKey).size);
            }
          }
          nestedGroups[groupKey][nextLevelValue].push(contact);
        });
      }
      
      finalGroups = nestedGroups;
    }

    // Fourth pass: Check if we need next-next level grouping (e.g., route after service_zone)
    let needsSubSubGrouping = false;
    if (needsSubGrouping && nextNextLevel && hasShowAll(nextNextLevel)) {
      // Check each sub-group to see if it has multiple next-next level values
      for (const groupKey in finalGroups) {
        if (typeof finalGroups[groupKey] === 'object' && !Array.isArray(finalGroups[groupKey])) {
          for (const subGroupKey in finalGroups[groupKey]) {
            if (hasMultipleValues(finalGroups[groupKey][subGroupKey], nextNextLevel)) {
              needsSubSubGrouping = true;
              break;
            }
          }
          if (needsSubSubGrouping) break;
        }
      }
    }

    // Fifth pass: Create nested structure for next-next level
    if (needsSubSubGrouping && nextNextLevel) {
      const deeperNestedGroups = {};
      
      for (const groupKey in finalGroups) {
        deeperNestedGroups[groupKey] = {};
        const subGroups = finalGroups[groupKey];
        
        if (typeof subGroups === 'object' && !Array.isArray(subGroups)) {
          for (const subGroupKey in subGroups) {
            deeperNestedGroups[groupKey][subGroupKey] = {};
            const contactsInSubGroup = subGroups[subGroupKey];
            
            contactsInSubGroup.forEach((contact) => {
              const nextNextLevelValue = contact[nextNextLevel] || 'Unknown';
              
              if (!deeperNestedGroups[groupKey][subGroupKey][nextNextLevelValue]) {
                deeperNestedGroups[groupKey][subGroupKey][nextNextLevelValue] = [];
                const subSubKey = `${groupKey}|${subGroupKey}`;
                if (!subSubGroupOrderMap.has(subSubKey)) {
                  subSubGroupOrderMap.set(subSubKey, new Map());
                }
                if (!subSubGroupOrderMap.get(subSubKey).has(nextNextLevelValue)) {
                  subSubGroupOrderMap.get(subSubKey).set(nextNextLevelValue, subSubGroupOrderMap.get(subSubKey).size);
                }
              }
              deeperNestedGroups[groupKey][subGroupKey][nextNextLevelValue].push(contact);
            });
          }
        } else {
          // If it's still a flat array, keep it as is
          deeperNestedGroups[groupKey] = subGroups;
        }
      }
      
      finalGroups = deeperNestedGroups;
    }

    // Convert maps to arrays and sort based on sortbars
    // Sort big LOCATION groups
    const bigLocationSort = activeSorts.find(s => s.fieldId === bigLocationField);
    const groupOrderArray = Array.from(groupOrderMap.entries())
      .map(([group]) => group)
      .sort((a, b) => {
        if (bigLocationSort) {
          return compareValues(a, b, bigLocationSort.direction);
        }
        // Default alphabetical if no sortbar
        return compareValues(a, b, 'asc');
      });
    
    // Sort sub-groups (next level) within each big LOCATION group
    const subGroupOrderObj = {};
    subGroupOrderMap.forEach((szMap, group) => {
      const nextLevelSort = activeSorts.find(s => s.fieldId === nextLevel);
      subGroupOrderObj[group] = Array.from(szMap.entries())
        .map(([sz]) => sz)
        .sort((a, b) => {
          if (nextLevelSort) {
            return compareValues(a, b, nextLevelSort.direction);
          }
          // Default alphabetical if no sortbar
          return compareValues(a, b, 'asc');
        });
    });

    // Sort sub-sub-groups (next-next level) within each sub-group
    const subSubGroupOrderObj = {};
    subSubGroupOrderMap.forEach((szMap, key) => {
      const nextNextLevelSort = activeSorts.find(s => s.fieldId === nextNextLevel);
      subSubGroupOrderObj[key] = Array.from(szMap.entries())
        .map(([sz]) => sz)
        .sort((a, b) => {
          if (nextNextLevelSort) {
            return compareValues(a, b, nextNextLevelSort.direction);
          }
          // Default alphabetical if no sortbar
          return compareValues(a, b, 'asc');
        });
    });

    return {
      groupedData: finalGroups,
      groupOrder: groupOrderArray,
      subGroupOrder: subGroupOrderObj,
      subSubGroupOrder: subSubGroupOrderObj,
      needsSubGrouping,
      needsSubSubGrouping,
      nextLevel,
      nextNextLevel
    };
  }, [subContacts, bigLocationField, getNextLevel, activeSearches, hasShowAll, hasMultipleValues, activeSorts, compareValues]);

  // Get field label for display
  const getFieldLabel = (field) => {
    const labels = {
      region: 'Region',
      state: 'State',
      city: 'City',
      service_zone: 'Service Zone',
      route: 'Route'
    };
    return labels[field] || field;
  };

  // Toggle group expansion
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Toggle sub-group expansion
  const toggleSubGroup = (groupKey, subGroupKey) => {
    const key = `${groupKey}|${subGroupKey}`;
    setExpandedSubGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Toggle sub-sub-group expansion
  const toggleSubSubGroup = (groupKey, subGroupKey, subSubGroupKey) => {
    const key = `${groupKey}|${subGroupKey}|${subSubGroupKey}`;
    setExpandedSubSubGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Get status indicator color
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-400';
    
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'active') {
      return 'bg-green-500';
    } else if (statusLower === 'inactive') {
      return 'bg-red-500';
    }
    // Default to gray if status is unknown
    return 'bg-gray-400';
  };

  // Count sub-contacts in a group
  const countSubContactsInGroup = (groupKey) => {
    const group = groupedData[groupKey];
    if (Array.isArray(group)) {
      return group.length;
    } else if (typeof group === 'object') {
      return Object.values(group).reduce((sum, subGroup) => {
        if (Array.isArray(subGroup)) {
          return sum + subGroup.length;
        } else if (typeof subGroup === 'object') {
          // It's a nested object (has sub-sub-groups)
          return sum + Object.values(subGroup).reduce((subSum, subSubGroup) => {
            return subSum + (Array.isArray(subSubGroup) ? subSubGroup.length : 0);
          }, 0);
        }
        return sum;
      }, 0);
    }
    return 0;
  };

  // Count sub-contacts in a sub-group
  const countSubContactsInSubGroup = (groupKey, subGroupKey) => {
    const group = groupedData[groupKey];
    if (typeof group === 'object' && !Array.isArray(group)) {
      const subGroup = group[subGroupKey];
      if (Array.isArray(subGroup)) {
        return subGroup.length;
      } else if (typeof subGroup === 'object') {
        // It's a nested object (has sub-sub-groups)
        return Object.values(subGroup).reduce((sum, subSubGroup) => {
          return sum + (Array.isArray(subSubGroup) ? subSubGroup.length : 0);
        }, 0);
      }
    }
    return 0;
  };

  // Count sub-contacts in a sub-sub-group
  const countSubContactsInSubSubGroup = (groupKey, subGroupKey, subSubGroupKey) => {
    const group = groupedData[groupKey];
    if (typeof group === 'object' && !Array.isArray(group)) {
      const subGroup = group[subGroupKey];
      if (typeof subGroup === 'object' && !Array.isArray(subGroup)) {
        const subSubGroup = subGroup[subSubGroupKey];
        return Array.isArray(subSubGroup) ? subSubGroup.length : 0;
      }
    }
    return 0;
  };

  // Auto-expand all groups when expandAll is checked, collapse all when unchecked
  // Users can always manually expand/collapse groups
  useEffect(() => {
    if (groupOrder.length > 0 && Object.keys(groupedData).length > 0) {
      if (expandAll) {
        // Expand all groups
        const allGroups = new Set(groupOrder);
        setExpandedGroups(allGroups);

        // Expand all sub-groups
        if (needsSubGrouping) {
          const allSubGroups = new Set();
          groupOrder.forEach(groupKey => {
            const group = groupedData[groupKey];
            if (typeof group === 'object' && !Array.isArray(group)) {
              const subGroups = subGroupOrder[groupKey] || Object.keys(group);
              subGroups.forEach(subGroupKey => {
                allSubGroups.add(`${groupKey}|${subGroupKey}`);
              });
            }
          });
          setExpandedSubGroups(allSubGroups);

          // Expand all sub-sub-groups
          if (needsSubSubGrouping) {
            const allSubSubGroups = new Set();
            groupOrder.forEach(groupKey => {
              const group = groupedData[groupKey];
              if (typeof group === 'object' && !Array.isArray(group)) {
                const subGroups = subGroupOrder[groupKey] || Object.keys(group);
                subGroups.forEach(subGroupKey => {
                  const subGroup = group[subGroupKey];
                  if (typeof subGroup === 'object' && !Array.isArray(subGroup)) {
                    const subSubGroups = subSubGroupOrder[`${groupKey}|${subGroupKey}`] || Object.keys(subGroup);
                    subSubGroups.forEach(subSubGroupKey => {
                      allSubSubGroups.add(`${groupKey}|${subGroupKey}|${subSubGroupKey}`);
                    });
                  }
                });
              }
            });
            setExpandedSubSubGroups(allSubSubGroups);
          }
        }
      } else {
        // Collapse all groups when expandAll is unchecked
        setExpandedGroups(new Set());
        setExpandedSubGroups(new Set());
        setExpandedSubSubGroups(new Set());
      }
    }
  }, [expandAll, groupOrder, needsSubGrouping, needsSubSubGrouping, subGroupOrder, subSubGroupOrder, groupedData]);

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

  return (
    <div className="bg-transparent rounded-lg p-4">
      {/* Parent Line Section - Show if parentContactName is provided */}
      {parentContactName && (
        <div className="mb-4 text-left">
          <h2 className="text-lg font-semibold text-gray-900">{parentContactName}</h2>
        </div>
      )}

      {/* Hierarchical List */}
      <div className="space-y-2">
        {groupOrder.map(groupKey => {
          const isGroupExpanded = expandedGroups.has(groupKey);
          const group = groupedData[groupKey];
          const groupCount = countSubContactsInGroup(groupKey);
          const hasSubGroups = needsSubGrouping && typeof group === 'object' && !Array.isArray(group);

          return (
            <div key={groupKey} className="space-y-2">
              {/* Big LOCATION Group Row */}
              <div
                onClick={() => toggleGroup(groupKey)}
                className="bg-white rounded-md shadow-sm flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {isGroupExpanded ? (
                  <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-blue-500" />
                )}
                <span className="font-medium text-gray-900">
                  {getFieldLabel(bigLocationField)} - {groupKey} ({groupCount})
                </span>
              </div>

              {/* Sub-groups or Sub-contacts */}
              {isGroupExpanded && (
                <>
                  {hasSubGroups ? (
                    // Show next level groups
                    <>
                      {(subGroupOrder[groupKey] || Object.keys(group).sort()).map(subGroupKey => {
                        const key = `${groupKey}|${subGroupKey}`;
                        const isSubGroupExpanded = expandedSubGroups.has(key);
                        const subGroupCount = countSubContactsInSubGroup(groupKey, subGroupKey);
                        const subGroup = group[subGroupKey];

                        return (
                          <div key={subGroupKey} className="space-y-2">
                            {/* Next Level Group Row */}
                            <div
                              onClick={() => toggleSubGroup(groupKey, subGroupKey)}
                              className="bg-white rounded-md shadow-sm border border-gray-200 flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors ml-6"
                            >
                              {isSubGroupExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-blue-500" />
                              )}
                              <span className="text-sm font-medium text-gray-800">
                                {getFieldLabel(nextLevel)} | {subGroupKey} ({subGroupCount})
                              </span>
                            </div>

                            {/* Sub-sub-groups or Sub-contacts */}
                            {isSubGroupExpanded && (
                              <>
                                {needsSubSubGrouping && typeof subGroup === 'object' && !Array.isArray(subGroup) ? (
                                  // Show sub-sub-groups (e.g., route level)
                                  <>
                                    {(subSubGroupOrder[key] || Object.keys(subGroup).sort()).map(subSubGroupKey => {
                                      const subSubKey = `${groupKey}|${subGroupKey}|${subSubGroupKey}`;
                                      const isSubSubGroupExpanded = expandedSubSubGroups.has(subSubKey);
                                      const subSubGroupCount = countSubContactsInSubSubGroup(groupKey, subGroupKey, subSubGroupKey);
                                      const subSubGroup = subGroup[subSubGroupKey];

                                      return (
                                        <div key={subSubGroupKey} className="space-y-2">
                                          {/* Sub-Sub Level Group Row (e.g., Route) */}
                                          <div
                                            onClick={() => toggleSubSubGroup(groupKey, subGroupKey, subSubGroupKey)}
                                            className="bg-white rounded-md shadow-sm border border-gray-200 flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors ml-12"
                                          >
                                            {isSubSubGroupExpanded ? (
                                              <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                                            ) : (
                                              <ChevronRightIcon className="w-5 h-5 text-blue-500" />
                                            )}
                                            <span className="text-sm font-medium text-gray-800">
                                              {getFieldLabel(nextNextLevel)} | {subSubGroupKey} ({subSubGroupCount})
                                            </span>
                                          </div>

                                          {/* Sub-contacts */}
                                          {isSubSubGroupExpanded && Array.isArray(subSubGroup) && (
                                            <>
                                              {subSubGroup.map(contact => {
                                                const statusColor = getStatusColor(contact.contact_status);
                                                
                                                return (
                                                  <div
                                                    key={contact.id}
                                                    onClick={() => onContactSelect?.(contact)}
                                                    onDoubleClick={() => onContactDoubleClick?.(contact)}
                                                    className="bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ml-16"
                                                  >
                                                    {/* Status Alarm Indicator */}
                                                    <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`} />
                                                    
                                                    {/* Contact Label */}
                                                    <span className="text-sm text-gray-900 flex-1">
                                                      {contact.name + ' | ' + contact.location_name }
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </>
                                ) : (
                                  // Show sub-contacts directly
                                  <>
                                    {Array.isArray(subGroup) && subGroup.map(contact => {
                                      const statusColor = getStatusColor(contact.contact_status);
                                      
                                      return (
                                        <div
                                          key={contact.id}
                                          onClick={() => onContactSelect?.(contact)}
                                          onDoubleClick={() => onContactDoubleClick?.(contact)}
                                          className="bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ml-12"
                                        >
                                          {/* Status Alarm Indicator */}
                                          <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`} />
                                          
                                          {/* Contact Label */}
                                          <span className="text-sm text-gray-900 flex-1">
                                            {contact.name + ' | ' + contact.location_name }
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    // Show sub-contacts directly (no next level grouping)
                    <>
                      {Array.isArray(group) && group.map(contact => {
                        const statusColor = getStatusColor(contact.contact_status);
                        
                        return (
                          <div
                            key={contact.id}
                            onClick={() => onContactSelect?.(contact)}
                            onDoubleClick={() => onContactDoubleClick?.(contact)}
                            className="bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ml-6"
                          >
                            {/* Status Alarm Indicator */}
                            <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`} />
                            
                            {/* Contact Label */}
                            <span className="text-sm text-gray-900 flex-1">
                              {contact.name + ' | ' + contact.location_name }
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {groupOrder.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No sub-contacts found</p>
        </div>
      )}
    </div>
  );
}

