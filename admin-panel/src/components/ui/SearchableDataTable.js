'use client';

import { useState, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronRightIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import SearchPanel from './SearchPanel';
import SortPanel from './SortPanel';

/**
 * SearchableDataTable Component
 * A flexible table component that works with SearchPanel and SortPanel to display filtered and sorted results
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.columns - Column configuration
 *   Format: [{key: string, label: string, sortable?: boolean, render?: Function}]
 * @param {Array} props.searchConfig - Search field configuration for SearchPanel
 * @param {Function} props.onSearch - Callback when search conditions change
 *   Receives: (searchConditions: Array) => void
 * @param {Function} props.onSort - Callback when sort conditions change
 *   Receives: (sortConditions: Array) => void
 * @param {Function} props.renderActions - Function to render action buttons for each row
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.showSearchPanel - Whether to show the search panel
 * @param {boolean} props.showSortPanel - Whether to show the sort panel
 * @param {Object} props.pagination - Pagination configuration
 * @param {Function} props.onPageChange - Callback when page changes
 */
export default function SearchableDataTable({
  data = [],
  columns = [],
  searchConfig = [],
  onSearch,
  onSort,
  renderActions,
  loading = false,
  showSearchPanel = true,
  showSortPanel = true,
  pagination = null,
  onPageChange,
  // External search/sort conditions (when panels are hidden)
  externalSearches = null,
  externalSorts = null,
  // Active sort ID (the sort bar that was last clicked)
  activeSortId = null,
  // View mode: 'table' or 'list'
  viewMode = 'table'
}) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeSearches, setActiveSearches] = useState([]);
  const [activeSorts, setActiveSorts] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Use external conditions if provided, otherwise use internal state
  const currentSearches = externalSearches !== null ? externalSearches : activeSearches;
  const currentSorts = externalSorts !== null ? externalSorts : activeSorts;

  // Handle sorting
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Apply filtering based on search conditions
  // If external searches are provided, assume data is already filtered
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // If external searches are provided, data is already filtered by parent component
    if (externalSearches !== null) {
      return data;
    }
    
    if (currentSearches.length === 0) return data;

    // Get active search conditions (exclude "Show all" and empty values)
    const activeSearchConditions = currentSearches.filter(search => {
      if (!search.value) return false;
      const trimmedValue = search.value.trim();
      if (trimmedValue === '') return false;
      // Case-insensitive check for "Show all"
      if (trimmedValue.toLowerCase() === 'show all') return false;
      return true;
    });

    // If no active search conditions (all are "Show all" or empty), show all data
    if (activeSearchConditions.length === 0) return data;

    // Filter data based on search conditions (AND logic - all conditions must match)
    return data.filter(row => {
      return activeSearchConditions.every(condition => {
        const fieldValue = row[condition.fieldId];
        if (fieldValue === null || fieldValue === undefined) return false;
        
        const searchValue = condition.value.toLowerCase().trim();
        const rowValue = String(fieldValue).toLowerCase();
        
        return rowValue.includes(searchValue);
      });
    });
  }, [data, currentSearches, externalSearches]);

  // Apply multi-level sorting based on SortPanel conditions
  // Always apply sorting here to ensure it works correctly
  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return filteredData;

    // Use external sorts if provided, otherwise use internal sorts
    const sortsToUse = externalSorts !== null ? externalSorts : currentSorts;
    
    // If no sorts, return data as-is
    if (!sortsToUse || sortsToUse.length === 0) {
      return filteredData;
    }

    // Only sort by the active sort (the one that was last clicked)
    // If activeSortId is provided, use that; otherwise use the first sort
    const sortToApply = activeSortId 
      ? sortsToUse.find(sort => sort.id === activeSortId)
      : sortsToUse[0];
    
    if (!sortToApply) {
      return filteredData;
    }

    // Apply sorting by the active sort only
    return [...filteredData].sort((a, b) => {
      const sort = sortToApply;
      if (!sort || !sort.fieldId) return 0;
      
      let aValue = a[sort.fieldId];
      let bValue = b[sort.fieldId];

      // Handle field mappings (for contacts data structure)
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
      // City and other direct fields don't need mapping

      // Handle null/undefined/empty string values
      // Empty strings should be treated as null for sorting purposes
      if (aValue === null || aValue === undefined || aValue === '') {
        if (bValue === null || bValue === undefined || bValue === '') {
          return 0; // Both are null/empty, consider them equal
        }
        return 1; // Put null/empty values at the end
      }
      if (bValue === null || bValue === undefined || bValue === '') {
        return -1; // Put null/empty values at the end
      }

      let comparison = 0;

      // Compare based on type - use case-insensitive comparison for strings
      if (typeof aValue === 'string') {
        // Case-insensitive comparison for better alphabetical sorting
        comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
      } else if (typeof aValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      }

      // Apply sort direction
      if (sort.direction === 'desc') {
        comparison = -comparison;
      }

      return comparison;
    });

    // Fallback to column header sorting if no SortPanel sorts
    if (sortColumn) {
      return [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc' 
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        return 0;
      });
    }

    return filteredData;
  }, [filteredData, currentSorts, sortColumn, sortDirection, externalSorts, activeSortId]);

  // Apply pagination to sorted data
  const paginatedData = useMemo(() => {
    if (!pagination || !sortedData) return sortedData;
    
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, pagination]);

  // Use paginated data for display
  const displayData = pagination ? paginatedData : sortedData;

  // Handle search change
  const handleSearchChange = (searches) => {
    setActiveSearches(searches);
    onSearch?.(searches);
  };

  // Handle sort change
  const handleSortChange = (sorts) => {
    setActiveSorts(sorts);
    // Clear column header sort when using SortPanel
    if (sorts.length > 0) {
      setSortColumn(null);
      setSortDirection('asc');
    }
    onSort?.(sorts);
  };

  // Render cell content
  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    return row[column.key] || '-';
  };

  // Toggle row expansion
  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  // Render contact details for expanded view
  const renderContactDetails = (contact) => {
    return (
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Contact Information</h4>
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="text-gray-900">{contact.phone}</span>
                </div>
              )}
              {contact.contact_type && (
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900 ml-2">{contact.contact_type}</span>
                </div>
              )}
              {contact.contact_status && (
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    contact.contact_status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.contact_status}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Location Details</h4>
            <div className="space-y-2">
              {contact.location_name && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Location:</span>
                  <span className="text-gray-900">{contact.location_name}</span>
                </div>
              )}
              {contact.physical_address && (
                <div>
                  <span className="text-gray-600">Address:</span>
                  <span className="text-gray-900 ml-2">{contact.physical_address}</span>
                </div>
              )}
              {(contact.city || contact.state || contact.zip) && (
                <div>
                  <span className="text-gray-600">City/State/Zip:</span>
                  <span className="text-gray-900 ml-2">
                    {[contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {contact.category_description && (
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="text-gray-900 ml-2">{contact.category_description}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {(contact.service_zone || contact.route) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">Additional Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {contact.service_zone && (
                <div>
                  <span className="text-gray-600">Service Zone:</span>
                  <span className="text-gray-900 ml-2">{contact.service_zone}</span>
                </div>
              )}
              {contact.route && (
                <div>
                  <span className="text-gray-600">Route:</span>
                  <span className="text-gray-900 ml-2">{contact.route}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {renderActions && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {renderActions(contact)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Panel */}
      {showSearchPanel && searchConfig.length > 0 && (
        <SearchPanel
          searchConfig={searchConfig}
          activeSearches={activeSearches}
          onSearchChange={handleSearchChange}
        />
      )}

      {/* Sort Panel */}
      {showSortPanel && searchConfig.length > 0 && (
        <SortPanel
          searchConfig={searchConfig}
          activeSearches={activeSearches}
          activeSorts={activeSorts}
          onSortChange={handleSortChange}
        />
      )}

      {/* Table or List View */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {sortedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">No data available</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="divide-y divide-gray-200">
            {displayData.map((row, rowIndex) => {
              const rowId = row.id || rowIndex;
              const isExpanded = expandedRows.has(rowId);
              const primaryColumn = columns.find(col => col.key !== 'actions') || columns[0];
              
              return (
                <div key={rowId} className="bg-white">
                  {/* List Item Header */}
                  <div
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isExpanded ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => toggleRowExpansion(rowId)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Chevron Icon */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      
                      {/* Primary Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {primaryColumn ? renderCell(row, primaryColumn) : row.name || 'Contact'}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                              {row.email && (
                                <div className="flex items-center gap-1">
                                  <EnvelopeIcon className="w-3 h-3" />
                                  <span>{row.email}</span>
                                </div>
                              )}
                              {row.phone && (
                                <div className="flex items-center gap-1">
                                  <PhoneIcon className="w-3 h-3" />
                                  <span>{row.phone}</span>
                                </div>
                              )}
                              {row.location_name && (
                                <div className="flex items-center gap-1">
                                  <MapPinIcon className="w-3 h-3" />
                                  <span>{row.location_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Additional Info Badges */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {row.contact_type && (
                              <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                                {row.contact_type}
                              </span>
                            )}
                            {row.contact_status && (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                row.contact_status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {row.contact_status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && renderContactDetails(row)}
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable && activeSorts.length === 0 ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                      }`}
                      onClick={() => column.sortable && currentSorts.length === 0 && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column.label}</span>
                        {column.sortable && currentSorts.length === 0 && sortColumn === column.key && (
                          <span className="text-gray-400">
                            {sortDirection === 'asc' ? (
                              <ChevronUpIcon className="w-4 h-4" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4" />
                            )}
                          </span>
                        )}
                        {/* Show sort indicator from SortPanel */}
                        {currentSorts.length > 0 && currentSorts.some(s => s.fieldId === column.key) && (
                          <span className="text-blue-500 text-xs">
                            {currentSorts.findIndex(s => s.fieldId === column.key) + 1}
                            {currentSorts.find(s => s.fieldId === column.key)?.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((row, rowIndex) => (
                  <tr 
                    key={row.id || rowIndex} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, sortedData?.length || pagination.total)} of{' '}
              {sortedData?.length || pagination.total} results
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={!pagination.hasPrev || pagination.page === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange?.(pageNum)}
                      className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={!pagination.hasNext || pagination.page === pagination.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

