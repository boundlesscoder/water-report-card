'use client';

import { useState, useCallback, useMemo } from 'react';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';

/**
 * SearchPanel Component
 * A flexible, contextual search panel with multiple searchable search bars
 * 
 * @param {Object} props
 * @param {Array} props.searchConfig - Configuration for available search fields
 *   Format: [{id: string, label: string, value: string, type: 'text'|'number'|'date'|'select', options?: Array}]
 * @param {Array} props.activeSearches - Array of active search configurations
 *   Format: [{id: string, fieldId: string, value: string}]
 * @param {Function} props.onSearchChange - Callback when search conditions change
 *   Receives: (searches: Array) => void
 * @param {Function} props.onClear - Callback to clear all searches
 * @param {boolean} props.showAddButton - Whether to show add search bar button
 * @param {number} props.maxSearches - Maximum number of search bars allowed
 * @param {string} props.className - Additional CSS classes
 */
export default function SearchPanel({
  searchConfig = [],
  activeSearches = [],
  onSearchChange,
  onClear,
  onSearchFocus,
  lastActiveSearchId = null,
  showAddButton = true,
  maxSearches = 5,
  className = ''
}) {
  const [searches, setSearches] = useState(activeSearches.length > 0 
    ? activeSearches 
    : [{ id: `search-${Date.now()}`, fieldId: searchConfig[0]?.id || '', value: '' }]
  );
  const [activeSearchId, setActiveSearchId] = useState(null);

  // Generate field options from search config
  const fieldOptions = useMemo(() => {
    return searchConfig.map(field => ({
      id: field.id,
      label: field.label,
      value: field.value || field.id,
      type: field.type || 'text',
      options: field.options || []
    }));
  }, [searchConfig]);

  // Handle adding a new search bar
  const handleAddSearch = useCallback(() => {
    if (searches.length >= maxSearches) return;
    
    const newSearch = {
      id: `search-${Date.now()}-${Math.random()}`,
      fieldId: searchConfig[0]?.id || '',
      value: ''
    };
    
    const updatedSearches = [...searches, newSearch];
    setSearches(updatedSearches);
    onSearchChange?.(updatedSearches);
  }, [searches, maxSearches, searchConfig, onSearchChange]);

  // Handle removing a search bar
  const handleRemoveSearch = useCallback((searchId) => {
    if (searches.length <= 1) return; // Keep at least one search bar
    
    const updatedSearches = searches.filter(s => s.id !== searchId);
    setSearches(updatedSearches);
    onSearchChange?.(updatedSearches);
  }, [searches, onSearchChange]);

  // Handle field change in a search bar
  const handleFieldChange = useCallback((searchId, field) => {
    const updatedSearches = searches.map(search => 
      search.id === searchId 
        ? { ...search, fieldId: field.id, value: '' } // Clear value when field changes
        : search
    );
    setSearches(updatedSearches);
    onSearchChange?.(updatedSearches);
  }, [searches, onSearchChange]);

  // Handle value change in a search bar
  const handleValueChange = useCallback((searchId, value) => {
    const updatedSearches = searches.map(search => 
      search.id === searchId 
        ? { ...search, value }
        : search
    );
    setSearches(updatedSearches);
    onSearchChange?.(updatedSearches);
    // Set this searchbar as the last active one when a value is selected
    setActiveSearchId(searchId);
  }, [searches, onSearchChange]);

  // Handle search bar focus
  const handleSearchFocus = useCallback((searchId) => {
    setActiveSearchId(searchId);
    onSearchFocus?.(searchId);
  }, [onSearchFocus]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    const clearedSearches = searches.map(search => ({ ...search, value: '' }));
    setSearches(clearedSearches);
    onSearchChange?.(clearedSearches);
    onClear?.();
  }, [searches, onSearchChange, onClear]);

  // Get selected field for a search
  const getSelectedField = useCallback((search) => {
    return fieldOptions.find(opt => opt.id === search.fieldId) || fieldOptions[0];
  }, [fieldOptions]);

  // Count active searches (with values)
  const activeSearchCount = useMemo(() => {
    return searches.filter(s => s.value && s.value.trim() !== '').length;
  }, [searches]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Search</h3>
          {activeSearchCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {activeSearchCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeSearchCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded transition-colors"
            >
              Clear all
            </button>
          )}
          {showAddButton && searches.length < maxSearches && (
            <button
              onClick={handleAddSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Search
            </button>
          )}
        </div>
      </div>

      {/* Search Bars */}
      <div className="p-4 space-y-3">
        {searches.map((search, index) => {
          const selectedField = getSelectedField(search);
          const fieldConfig = searchConfig.find(f => f.id === search.fieldId);
          
          return (
            <div key={search.id}>
              <SearchBar
                id={search.id}
                value={search.value}
                onChange={(value) => handleValueChange(search.id, value)}
                selectedField={selectedField}
                valueOptions={fieldConfig?.valueOptions || []}
                placeholder={fieldConfig?.placeholder || `Search by ${selectedField?.label || 'field'}...`}
                hasAllOption={fieldConfig?.hasAllOption || false}
                isActive={lastActiveSearchId === search.id || activeSearchId === search.id}
                onFocus={handleSearchFocus}
              />
            </div>
          );
        })}
      </div>

      {/* Info Text */}
      {searches.length === 0 && (
        <div className="px-4 py-3 text-center text-sm text-gray-500">
          No search bars. Click "Add Search" to get started.
        </div>
      )}
    </div>
  );
}

