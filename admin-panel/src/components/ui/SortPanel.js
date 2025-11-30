'use client';

import { useState, useCallback, useMemo, useEffect, Fragment } from 'react';
import { PlusIcon, ArrowsUpDownIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import SortBar from './SortBar';

/**
 * SortPanel Component
 * A flexible sort panel that syncs with SearchPanel fields
 * 
 * @param {Object} props
 * @param {Array} props.searchConfig - Search field configuration (from SearchPanel)
 * @param {Array} props.activeSearches - Active search conditions (from SearchPanel)
 * @param {Array} props.activeSorts - Array of active sort configurations
 *   Format: [{id: string, fieldId: string, direction: 'asc'|'desc'}]
 * @param {Function} props.onSortChange - Callback when sort conditions change
 *   Receives: (sorts: Array) => void
 * @param {Function} props.onSortDirectionChange - Callback when sort direction changes for a specific sort
 *   Receives: (sortId: string, direction: 'asc'|'desc') => void
 * @param {Function} props.onClear - Callback to clear all sorts
 * @param {boolean} props.showAddButton - Whether to show add sort bar button
 * @param {number} props.maxSorts - Maximum number of sort bars allowed
 * @param {string} props.className - Additional CSS classes
 */
export default function SortPanel({
  searchConfig = [],
  activeSearches = [],
  activeSorts = [],
  onSortChange,
  onSortDirectionChange,
  onClear,
  showAddButton = true,
  maxSorts = 5,
  className = ''
}) {
  const [sorts, setSorts] = useState(activeSorts.length > 0 
    ? activeSorts 
    : []
  );
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);

  // Sync internal state with external activeSorts
  useEffect(() => {
    setSorts(activeSorts);
  }, [activeSorts]);

  // Generate field options from search config (only fields that are being searched)
  const availableFields = useMemo(() => {
    // Get unique field IDs from active searches
    const searchedFieldIds = new Set(
      activeSearches
        .filter(s => s.fieldId && s.value && s.value.trim() !== '')
        .map(s => s.fieldId)
    );

    // Return fields that are being searched
    return searchConfig
      .filter(field => searchedFieldIds.has(field.id))
      .map(field => ({
        id: field.id,
        name: field.name,
        label: field.label || field.id,
        value: field.value || field.id,
        type: field.type || 'text'
      }));
  }, [searchConfig, activeSearches]);

  // All fields from searchConfig for the "Add Sort" dropdown (only sortable fields)
  const allConfigFields = useMemo(() => {
    return searchConfig
      .filter(field => field.sortable === true)
      .map(field => ({
        id: field.id,
        name: field.name,
        label: field.label || field.id,
        value: field.value || field.id,
        type: field.type || 'text'
      }));
  }, [searchConfig]);

  // Get fields that can be added (not already sorted)
  const addableFields = useMemo(() => {
    const sortedFieldIds = new Set(sorts.map(s => s.fieldId));
    return allConfigFields.filter(f => !sortedFieldIds.has(f.id));
  }, [allConfigFields, sorts]);

  // Handle adding a new sort bar from dropdown
  const handleAddSortFromField = useCallback((field) => {
    if (sorts.length >= maxSorts) return;
    
    const newSort = {
      id: `sort-${Date.now()}-${Math.random()}`,
      fieldId: field.id,
      direction: 'asc',
      isAutoAdded: false // Mark as manually added
    };
    
    const updatedSorts = [...sorts, newSort];
    setSorts(updatedSorts);
    onSortChange?.(updatedSorts);
    setIsAddDropdownOpen(false);
  }, [sorts, maxSorts, onSortChange]);

  // Handle removing a sort bar
  const handleRemoveSort = useCallback((sortId) => {
    const updatedSorts = sorts.filter(s => s.id !== sortId);
    setSorts(updatedSorts);
    onSortChange?.(updatedSorts);
  }, [sorts, onSortChange]);

  // Handle field change in a sort bar
  const handleFieldChange = useCallback((sortId, field) => {
    const updatedSorts = sorts.map(sort => 
      sort.id === sortId 
        ? { ...sort, fieldId: field.id }
        : sort
    );
    setSorts(updatedSorts);
    onSortChange?.(updatedSorts);
  }, [sorts, onSortChange]);

  // Handle sort direction change
  const handleSortDirectionChange = useCallback((sortId, direction) => {
    // Update internal state first
    const updatedSorts = sorts.map(sort => 
      sort.id === sortId 
        ? { ...sort, direction }
        : sort
    );
    setSorts(updatedSorts);
    // Call the specific callback to set active sort and update parent state
    // This should update activeSortId and activeSorts in the parent
    onSortDirectionChange?.(sortId, direction);
    // Don't call onSortChange here - it's only for add/remove operations
    // The parent's handleSortDirectionChange already updates activeSorts
  }, [sorts, onSortDirectionChange]);

  // Get selected field for a sort
  const getSelectedField = useCallback((sort) => {
    return availableFields.find(opt => opt.id === sort.fieldId) || 
           allConfigFields.find(opt => opt.id === sort.fieldId) ||
           allConfigFields[0];
  }, [availableFields, allConfigFields]);

  // Count active sorts
  const activeSortCount = useMemo(() => {
    return sorts.length;
  }, [sorts]);

  // Get available fields for a specific sort (excluding already sorted fields)
  const getAvailableFieldsForSort = useCallback((currentSortId) => {
    const sortedFieldIds = new Set(
      sorts
        .filter(s => s.id !== currentSortId)
        .map(s => s.fieldId)
    );
    
    return allConfigFields.filter(f => !sortedFieldIds.has(f.id));
  }, [sorts, allConfigFields]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowsUpDownIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Sort</h3>
          {activeSortCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {activeSortCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeSortCount > 0 && (
            <button
              onClick={() => {
                setSorts([]);
                onSortChange?.([]);
                onClear?.();
              }}
              className="text-xs text-gray-600 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded transition-colors"
            >
              Clear all
            </button>
          )}
          {showAddButton && sorts.length < maxSorts && addableFields.length > 0 && (
            <div className="relative">
              <Listbox value={null} onChange={handleAddSortFromField}>
                {({ open }) => (
                  <>
                    <Listbox.Button
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Sort
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options
                        static
                        className="absolute right-0 mt-1 w-48 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg focus:outline-none z-50"
                      >
                        {addableFields.map((field) => (
                          <Listbox.Option
                            key={field.id}
                            value={field}
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 text-sm ${
                                active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            {field.name}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </>
                )}
              </Listbox>
            </div>
          )}
        </div>
      </div>

      {/* Sort Bars */}
      <div className="p-4">
        {sorts.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No sort conditions. Click "Add Sort" to get started.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {sorts.map((sort, index) => {
              const selectedField = getSelectedField(sort);
              // Get the search value for this field from active searches
              const searchForThisField = activeSearches.find(s => s.fieldId === sort.fieldId);
              const searchValue = searchForThisField?.value || '';
              
              return (
                <SortBar
                  key={sort.id}
                  id={sort.id}
                  selectedField={selectedField}
                  searchValue={searchValue}
                  sortDirection={sort.direction}
                  onSortDirectionChange={(direction) => handleSortDirectionChange(sort.id, direction)}
                  onRemove={handleRemoveSort}
                  removable={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
