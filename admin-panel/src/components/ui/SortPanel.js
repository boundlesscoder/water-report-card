'use client';

import { useState, useCallback, useMemo, useEffect, Fragment } from 'react';
import { PlusIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import SortBar from './SortBar';

/**
 * SortPanel Component
 * A flexible sort panel with drag-and-drop reordering
 * 
 * @param {Object} props
 * @param {Array} props.searchConfig - Search field configuration
 * @param {Array} props.activeSearches - Active search conditions
 * @param {Array} props.activeSorts - Array of active sort configurations
 * @param {Function} props.onSortChange - Callback when sort conditions change
 * @param {Function} props.onSortValueSelect - Callback when a value is selected from dropdown
 * @param {Function} props.getDropdownOptions - Function to get dropdown options for a field
 * @param {number} props.maxSorts - Maximum number of sort bars allowed
 * @param {string} props.className - Additional CSS classes
 */
export default function SortPanel({
  searchConfig = [],
  activeSearches = [],
  activeSorts = [],
  onSortChange,
  onSortValueSelect,
  getDropdownOptions,
  showAddButton = true,
  maxSorts = 5,
  className = ''
}) {
  const [sorts, setSorts] = useState(activeSorts.length > 0 ? activeSorts : []);
  const [draggedSortId, setDraggedSortId] = useState(null);
  const [invalidDropTarget, setInvalidDropTarget] = useState(null);

  // Sync internal state with external activeSorts
  useEffect(() => {
    setSorts(activeSorts);
  }, [activeSorts]);

  // All fields from searchConfig for the "Add Sort" dropdown (all fields are sortable)
  const allConfigFields = useMemo(() => {
    return searchConfig.map(field => ({
      id: field.id,
      name: field.name,
      label: field.name, // Use name as label
      value: field.id,
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
      selectedValue: null, // No value selected initially
      isAutoAdded: false // Mark as manually added
    };
    
    const updatedSorts = [...sorts, newSort];
    setSorts(updatedSorts);
    onSortChange?.(updatedSorts);
  }, [sorts, maxSorts, onSortChange]);

  // Handle removing a sort bar (only if not auto-generated)
  const handleRemoveSort = useCallback((sortId) => {
    const sortToRemove = sorts.find(s => s.id === sortId);
    // Don't allow removal of auto-generated sortbars
    if (sortToRemove && sortToRemove.isAutoAdded) {
      return;
    }
    const updatedSorts = sorts.filter(s => s.id !== sortId);
    setSorts(updatedSorts);
    onSortChange?.(updatedSorts);
  }, [sorts, onSortChange]);

  // Handle value selection from dropdown
  const handleValueSelect = useCallback((sortId, value) => {
    if (onSortValueSelect) {
      onSortValueSelect(sortId, value);
    }
  }, [onSortValueSelect]);

  // Hierarchical order rules: region -> state -> city/service_zone -> route
  // Lower index = higher in hierarchy (must come first)
  const hierarchicalOrder = ['region', 'state', 'city', 'service_zone', 'route'];
  
  // Get hierarchical index for a field (-1 if not hierarchical)
  const getHierarchicalIndex = useCallback((fieldId) => {
    return hierarchicalOrder.indexOf(fieldId);
  }, []);

  // Check if the entire sortbar order maintains hierarchical order
  const isValidOrder = useCallback((sortArray) => {
    // Extract only hierarchical fields with their positions
    const hierarchicalFields = [];
    sortArray.forEach((sort, index) => {
      const hIndex = getHierarchicalIndex(sort.fieldId);
      if (hIndex !== -1) {
        hierarchicalFields.push({ fieldId: sort.fieldId, hIndex, position: index });
      }
    });
    
    // Check if hierarchical fields are in correct order
    // Lower hIndex (higher in hierarchy) must come before higher hIndex
    for (let i = 0; i < hierarchicalFields.length; i++) {
      for (let j = i + 1; j < hierarchicalFields.length; j++) {
        // If a field with higher hIndex (lower in hierarchy) comes before one with lower hIndex (higher in hierarchy), it's invalid
        if (hierarchicalFields[i].hIndex > hierarchicalFields[j].hIndex) {
          return false;
        }
      }
    }
    
    return true;
  }, [getHierarchicalIndex]);

  // Check if placing draggedField at insertIndex would violate hierarchical order
  const isValidDropPosition = useCallback((draggedFieldId, insertIndex) => {
    // Create a temporary array to simulate the drop
    const tempSorts = [...sorts];
    const draggedSort = tempSorts.find(s => s.id === draggedSortId);
    if (!draggedSort) return false;
    
    // Remove dragged item from its current position
    const currentIndex = tempSorts.findIndex(s => s.id === draggedSortId);
    if (currentIndex !== -1) {
      tempSorts.splice(currentIndex, 1);
    }
    
    // Calculate final insert index (accounting for removal)
    const finalInsertIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    
    // Insert at new position
    tempSorts.splice(finalInsertIndex, 0, draggedSort);
    
    // Check if the entire order is valid
    return isValidOrder(tempSorts);
  }, [sorts, draggedSortId, isValidOrder]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, sortId) => {
    setDraggedSortId(sortId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback((e) => {
    setDraggedSortId(null);
    setInvalidDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e, targetSortId) => {
    e.preventDefault();
    
    if (draggedSortId === null || draggedSortId === targetSortId) {
      setInvalidDropTarget(null);
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    const draggedSort = sorts.find(s => s.id === draggedSortId);
    if (!draggedSort) {
      setInvalidDropTarget(null);
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    const draggedIndex = sorts.findIndex(s => s.id === draggedSortId);
    const targetIndex = sorts.findIndex(s => s.id === targetSortId);
    
    // Calculate insert index (before accounting for removal)
    // We'll insert at targetIndex position
    const insertIndex = targetIndex;

    // Check if drop position is valid
    const isValid = isValidDropPosition(draggedSort.fieldId, insertIndex);
    
    if (isValid) {
      e.dataTransfer.dropEffect = 'move';
      setInvalidDropTarget(null);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setInvalidDropTarget(targetSortId);
    }
  }, [draggedSortId, sorts, isValidDropPosition]);

  const handleDragLeave = useCallback(() => {
    setInvalidDropTarget(null);
  }, []);

  const handleDrop = useCallback((e, targetSortId) => {
    e.preventDefault();
    
    if (draggedSortId === null || draggedSortId === targetSortId) {
      setDraggedSortId(null);
      setInvalidDropTarget(null);
      return;
    }

    const draggedSort = sorts.find(s => s.id === draggedSortId);
    if (!draggedSort) {
      setDraggedSortId(null);
      setInvalidDropTarget(null);
      return;
    }

    const newSorts = [...sorts];
    const draggedIndex = newSorts.findIndex(s => s.id === draggedSortId);
    const targetIndex = newSorts.findIndex(s => s.id === targetSortId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSortId(null);
      setInvalidDropTarget(null);
      return;
    }

    // Calculate insert index
    const insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex;
    
    // Check if drop position is valid before proceeding
    const isValid = isValidDropPosition(draggedSort.fieldId, insertIndex);
    
    if (!isValid) {
      // Prevent invalid drop
      setDraggedSortId(null);
      setInvalidDropTarget(null);
      return;
    }

    // Remove dragged item
    const [draggedItem] = newSorts.splice(draggedIndex, 1);
    
    // Insert at calculated position
    // If dragging forward (draggedIndex < targetIndex), after removing, targetIndex shifts by -1
    // If dragging backward (draggedIndex > targetIndex), insert at targetIndex directly
    const finalInsertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    newSorts.splice(finalInsertIndex, 0, draggedItem);

    setSorts(newSorts);
    onSortChange?.(newSorts);
    setDraggedSortId(null);
    setInvalidDropTarget(null);
  }, [draggedSortId, sorts, onSortChange, isValidDropPosition]);

  // Get selected field for a sort
  const getSelectedField = useCallback((sort) => {
    return allConfigFields.find(opt => opt.id === sort.fieldId) || allConfigFields[0];
  }, [allConfigFields]);

  // Count active sorts
  const activeSortCount = useMemo(() => {
    return sorts.length;
  }, [sorts]);

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
      </div>

      {/* Sort Bars */}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Bars */}
          {sorts.map((sort, index) => {
            const selectedField = getSelectedField(sort);
            const searchForThisField = activeSearches.find(s => s.fieldId === sort.fieldId);
            const searchValue = searchForThisField?.value || '';
            const dropdownOptions = getDropdownOptions ? getDropdownOptions(sort.fieldId) : [];
            
            return (
              <SortBar
                key={sort.id}
                id={sort.id}
                selectedField={selectedField}
                searchValue={searchValue}
                dropdownOptions={dropdownOptions}
                selectedValue={sort.selectedValue}
                onValueSelect={handleValueSelect}
                onRemove={handleRemoveSort}
                removable={!sort.isAutoAdded}
                isAutoAdded={sort.isAutoAdded || false}
                draggable={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isDragging={draggedSortId === sort.id}
                isInvalidDropTarget={invalidDropTarget === sort.id}
              />
            );
          })}

          {/* Plus Button - Always at the end */}
          {showAddButton && sorts.length < maxSorts && addableFields.length > 0 && (
            <div className="relative">
              <Listbox value={null} onChange={handleAddSortFromField}>
                {({ open }) => (
                  <>
                    <Listbox.Button
                      className="flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                      title="Add sort"
                    >
                      <PlusIcon className="w-6 h-6" />
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
                        className="absolute left-0 mt-1 w-48 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg focus:outline-none z-50"
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
    </div>
  );
}
