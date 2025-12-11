'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

/**
 * SortBar Component
 * A sort bar with dropdown to select specific values
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for this sort bar
 * @param {Object} props.selectedField - Currently selected field {id, name, label}
 * @param {string} props.searchValue - The search condition value for this field
 * @param {Array} props.dropdownOptions - Options to show in dropdown
 * @param {string} props.selectedValue - Currently selected value from dropdown (for top item)
 * @param {Function} props.onValueSelect - Callback when a value is selected from dropdown
 * @param {Function} props.onRemove - Callback to remove this sort bar
 * @param {boolean} props.removable - Whether this sort bar can be removed
 * @param {boolean} props.isAutoAdded - Whether this sort bar was auto-generated
 * @param {boolean} props.draggable - Whether this sort bar can be dragged
 * @param {Function} props.onDragStart - Callback when drag starts
 * @param {Function} props.onDragEnd - Callback when drag ends
 * @param {Function} props.onDragOver - Callback when dragging over
 * @param {Function} props.onDrop - Callback when dropped
 * @param {Function} props.onDragLeave - Callback when drag leaves
 * @param {boolean} props.isDragging - Whether this item is currently being dragged
 * @param {boolean} props.isInvalidDropTarget - Whether this is an invalid drop target
 */
export default function SortBar({
  id,
  selectedField = null,
  searchValue = '',
  dropdownOptions = [],
  selectedValue = null,
  onValueSelect,
  onRemove,
  removable = true,
  isAutoAdded = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging = false,
  isInvalidDropTarget = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine dropdown options based on search value
  const getDropdownOptions = () => {
    if (!searchValue || searchValue.trim() === '' || searchValue.toLowerCase() === 'show all') {
      // If "Show all" or no search, show all options
      return dropdownOptions;
    } else {
      // If specific item searched, show only that item
      return dropdownOptions.filter(opt => 
        String(opt).toLowerCase().includes(searchValue.toLowerCase().trim())
      );
    }
  };

  const options = getDropdownOptions();
  const displayValue = selectedValue || (searchValue === 'Show all' ? 'All' : (searchValue || 'All'));

  // Handle remove
  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(id);
    }
  };

  // Handle value selection from dropdown
  const handleValueSelect = (value) => {
    if (onValueSelect) {
      onValueSelect(id, value);
    }
    setIsOpen(false);
  };

  const fieldName = selectedField?.name || '';

  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        if (onDragStart) onDragStart(e, id);
      } : undefined}
      onDragEnd={draggable ? (e) => {
        setDragOver(false);
        if (onDragEnd) onDragEnd(e);
      } : undefined}
      onDragOver={draggable ? (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
        if (onDragOver) onDragOver(e, id);
      } : undefined}
      onDragLeave={draggable ? (e) => {
        setDragOver(false);
        if (onDragLeave) onDragLeave(e);
      } : undefined}
      onDrop={draggable ? (e) => {
        e.preventDefault();
        setDragOver(false);
        if (onDrop) onDrop(e, id);
      } : undefined}
      className={`flex items-center gap-2 ${isDragging ? 'opacity-50 cursor-grabbing' : ''} ${draggable ? 'cursor-move' : ''} ${dragOver && !isDragging && !isInvalidDropTarget ? 'ring-2 ring-blue-500 rounded-md' : ''} ${isInvalidDropTarget ? 'ring-2 ring-red-500 rounded-md bg-red-50' : ''}`}
    >
      {/* Drag Handle */}
      {draggable && (
        <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
          <Bars3Icon className="w-5 h-5" />
        </div>
      )}
      
      <Listbox value={selectedValue} onChange={handleValueSelect}>
        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <span className="font-medium">{fieldName}</span>
              {displayValue && (
                <>
                  <span className="text-gray-400">:</span>
                  <span className="text-gray-600">{displayValue}</span>
                </>
              )}
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-1 w-48 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg focus:outline-none">
                {options.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No options available</div>
                ) : (
                  options.map((option, index) => (
                    <Listbox.Option
                      key={index}
                      value={option}
                      className={({ active }) =>
                        `cursor-pointer select-none px-4 py-2 text-sm ${
                          active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {String(option)}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>

      {/* Remove Button - Only show if removable and not auto-generated */}
      {removable && !isAutoAdded && onRemove && (
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Remove sort"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
