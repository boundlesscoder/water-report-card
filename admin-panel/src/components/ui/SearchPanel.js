'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { PlusIcon, FunnelIcon, TrashIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';

// Component to handle async loading of dropdown options
function SearchBarWithOptions({
  search,
  selectedField,
  fieldConfig,
  getValueOptionsForField,
  onValueChange,
  onFocus,
  onRemove,
  isActive,
  activeSearches // Pass active searches to trigger reload when they change
}) {
  const [valueOptions, setValueOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load options when search bar is focused, when field changes, or when other searches change
  useEffect(() => {
    if (getValueOptionsForField && selectedField) {
      setLoadingOptions(true);
      const loadOptions = async () => {
        try {
          const options = await getValueOptionsForField(search.fieldId);
          setValueOptions(options);
        } catch (error) {
          console.error('Error loading dropdown options:', error);
          setValueOptions([]);
        } finally {
          setLoadingOptions(false);
        }
      };
      loadOptions();
    }
  }, [getValueOptionsForField, search.fieldId, selectedField, isActive, activeSearches]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SearchBar
          id={search.id}
          value={search.value}
          onChange={onValueChange}
          selectedField={selectedField}
          valueOptions={valueOptions}
          placeholder={fieldConfig?.placeholder || `Search by ${selectedField?.label || 'field'}...`}
          hasAllOption={fieldConfig?.hasAllOption || false}
          isActive={isActive}
          onFocus={onFocus}
        />
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Remove search bar"
      >
            <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

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
  schemaList = [],
  // Function to get valueOptions for a specific field (filtered by other searches)
  getValueOptionsForField = null,
  className = ''
}) {
  const [searches, setSearches] = useState(activeSearches);
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [showSchemaList, setShowSchemaList] = useState(false);

  // Update searches when activeSearches prop changes
  useEffect(() => {
    setSearches(activeSearches);
  }, [activeSearches]);

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

  // Handle adding a new search bar from schema
  const handleAddSearchFromSchema = useCallback((fieldId) => {
    if (searches.length >= maxSearches) return;
    
    // Check if this field is already in searches
    if (searches.some(s => s.fieldId === fieldId)) {
      setShowSchemaList(false);
      return;
    }
    
    const newSearch = {
      id: `search-${Date.now()}-${Math.random()}`,
      fieldId: fieldId,
      value: ''
    };
    
    const updatedSearches = [...searches, newSearch];
    setSearches(updatedSearches);
    onSearchChange?.(updatedSearches);
    setShowSchemaList(false);
  }, [searches, maxSearches, onSearchChange]);

  // Handle showing schema list
  const handleShowSchemaList = useCallback(() => {
    setShowSchemaList(true);
  }, []);

  // Handle removing a search bar
  const handleRemoveSearch = useCallback((searchId) => {
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
        </div>
      </div>

      {/* Search Bars */}
      <div className="p-4 space-y-3">
        {searches.length === 0 && !showSchemaList ? (
          // Show only plus button when no searches
          <div className="flex justify-center">
            <button
              onClick={handleShowSchemaList}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Search Field
            </button>
          </div>
        ) : showSchemaList ? (
          // Show schema list when plus button is clicked
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Select Field</h4>
              <button
                onClick={() => setShowSchemaList(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(schemaList.length > 0 ? schemaList : searchConfig).map((field) => {
                const isAlreadyAdded = searches.some(s => s.fieldId === field.id);
                return (
                  <button
                    key={field.id}
                    onClick={() => !isAlreadyAdded && handleAddSearchFromSchema(field.id)}
                    disabled={isAlreadyAdded}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      isAlreadyAdded
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700'
                    }`}
                  >
                    {field.name || field.label || field.id}
                    {isAlreadyAdded && <span className="ml-2 text-xs">(added)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Show search bars
          <>
            {searches.map((search, index) => {
              const selectedField = getSelectedField(search);
              const fieldConfig = searchConfig.find(f => f.id === search.fieldId);
              
              return (
                <SearchBarWithOptions
                  key={search.id}
                  search={search}
                  selectedField={selectedField}
                  fieldConfig={fieldConfig}
                  getValueOptionsForField={getValueOptionsForField}
                  onValueChange={(value) => handleValueChange(search.id, value)}
                  onFocus={() => handleSearchFocus(search.id)}
                  onRemove={() => handleRemoveSearch(search.id)}
                  isActive={lastActiveSearchId === search.id || activeSearchId === search.id}
                  activeSearches={searches}
                />
              );
            })}
            {showAddButton && searches.length < maxSearches && (
              <button
                onClick={handleShowSchemaList}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Search Field
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

