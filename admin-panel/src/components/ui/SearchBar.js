'use client';

import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SearchBar Component
 * A searchable input field with a dropdown menu showing unique values from records
 * Supports hierarchical display for values with '/' separator
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for this search bar
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Callback when search value changes
 * @param {Object} props.selectedField - Currently selected field {id, label, placeholder}
 * @param {Array} props.valueOptions - Array of unique values for this field from records
 * @param {string} props.placeholder - Placeholder text for the input
 */
export default function SearchBar({
  id,
  value = '',
  onChange,
  selectedField = null,
  valueOptions = [],
  placeholder = 'Search...',
  hasAllOption = false,
  isActive = false,
  onFocus = null
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Organize options hierarchically for values with '/'
  const organizeOptions = (options) => {
    const flatOptions = [];
    const hierarchicalMap = new Map(); // parent -> Map of unique children (normalized key -> child data)
    
    options.forEach(option => {
      const optionValue = typeof option === 'string' ? option : (option.value || option.label || option);
      
      if (typeof optionValue === 'string' && optionValue.includes('/')) {
        const parts = optionValue.split('/').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          const parent = parts[0];
          // Normalize child - take everything after the first '/' and join, normalize case
          const child = parts.slice(1).join('/');
          const childKey = child.toLowerCase(); // Use lowercase as key for uniqueness
          
          if (!hierarchicalMap.has(parent)) {
            hierarchicalMap.set(parent, new Map());
          }
          // Use Map with normalized key to ensure unique children (case-insensitive)
          if (!hierarchicalMap.get(parent).has(childKey)) {
            hierarchicalMap.get(parent).set(childKey, {
              child: child,
              fullValue: optionValue,
              originalOption: option
            });
          }
        } else {
          flatOptions.push({ value: optionValue, originalOption: option, isHierarchical: false });
        }
      } else {
        flatOptions.push({ value: optionValue, originalOption: option, isHierarchical: false });
      }
    });
    
    // Build hierarchical structure - only show unique parent-child pairs
    const hierarchicalOptions = [];
    hierarchicalMap.forEach((childrenMap, parent) => {
      // Add parent only once
      hierarchicalOptions.push({
        type: 'parent',
        value: parent,
        label: parent,
        originalOption: { value: parent, label: parent }
      });
      
      // Add unique children under parent (sorted)
      const uniqueChildren = Array.from(childrenMap.values()).sort((a, b) => 
        a.child.localeCompare(b.child)
      );
      uniqueChildren.forEach(({ child, fullValue, originalOption }) => {
        hierarchicalOptions.push({
          type: 'child',
          value: fullValue,
          label: child,
          parent: parent,
          originalOption: originalOption
        });
      });
    });
    
    // Combine flat and hierarchical, sort them
    const allOptions = [...flatOptions, ...hierarchicalOptions].sort((a, b) => {
      // Sort parents first, then children under their parents
      if (a.type === 'parent' && b.type === 'child') {
        if (b.parent === a.value) return -1; // Child goes after its parent
        return a.value.localeCompare(b.parent);
      }
      if (a.type === 'child' && b.type === 'parent') {
        if (a.parent === b.value) return 1; // Child goes after its parent
        return a.parent.localeCompare(b.value);
      }
      if (a.type === 'child' && b.type === 'child') {
        // If same parent, sort by child name
        if (a.parent === b.parent) {
          return a.label.localeCompare(b.label);
        }
        // Otherwise sort by parent
        return a.parent.localeCompare(b.parent);
      }
      const aVal = a.value || a.label || '';
      const bVal = b.value || b.label || '';
      return aVal.localeCompare(bVal);
    });
    
    return allOptions;
  };

  const organizedOptions = organizeOptions(valueOptions);

  // Filter organized options based on search query
  // Note: "Show all" option is always shown separately, not filtered
  const filteredOptions = organizedOptions.filter(option => {
    const optionValue = option.value || option.label || '';
    const searchLower = searchQuery.toLowerCase();
    
    // For hierarchical items, search in both parent and child
    if (option.type === 'child') {
      return option.parent.toLowerCase().includes(searchLower) || 
             option.label.toLowerCase().includes(searchLower) ||
             option.value.toLowerCase().includes(searchLower);
    }
    
    return String(optionValue).toLowerCase().includes(searchLower);
  });

  // Handle input change - update both search query and value
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchQuery(inputValue);
    onChange(inputValue);
    setIsDropdownOpen(true);
  };

  // Handle input click/focus - open dropdown
  const handleInputClick = () => {
    setIsDropdownOpen(true);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
    onFocus?.(id);
  };

  const handleInputBlur = () => {
    // Delay clearing active state to allow dropdown clicks to register
    setTimeout(() => {
      if (!isDropdownOpen) {
        onFocus?.(null);
      }
    }, 200);
  };

  // Handle value option selection
  const handleValueSelect = (option) => {
    const valueToSet = option.value || option.label || '';
    onChange(valueToSet);
    setSearchQuery(valueToSet);
    setIsDropdownOpen(false);
    inputRef.current?.blur();
  };

  // Handle remove button click - clear search condition
  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        onFocus?.(null);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, onFocus]);

  // Sync searchQuery with value when value changes externally
  useEffect(() => {
    if (value && !isDropdownOpen) {
      setSearchQuery(value);
    } else if (!value) {
      setSearchQuery('');
    }
  }, [value]);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`w-full pl-8 pr-8 py-1.5 text-sm border rounded-md transition-all ${
            isActive
              ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50 shadow-sm'
              : (value && value.trim() !== '' && value.toLowerCase() !== 'show all')
              ? 'border-black ring-1 ring-black ring-opacity-40 shadow-sm'
              : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        {/* Remove Button (replaces arrow) - Show when there's a search value */}
        {(value || searchQuery) && (
          <button
            onClick={handleRemove}
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear search"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        {/* Show arrow when no value */}
        {!value && !searchQuery && (
          <ChevronDownIcon 
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </div>

      {/* Value Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg focus:outline-none">
          {/* Search input in dropdown */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onChange(e.target.value);
                }}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          {filteredOptions.length === 0 && !hasAllOption ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No options found
            </div>
          ) : (
            <div className="py-1">
              {/* Show all option */}
              {hasAllOption && (
                <div
                  onClick={() => handleValueSelect({ value: 'Show all', label: 'Show all' })}
                  className={`cursor-pointer select-none py-2 px-4 text-sm hover:bg-blue-50 ${
                    value === 'Show all' ? 'bg-yellow-100 text-yellow-900 font-medium' : 'text-gray-900 hover:text-blue-900'
                  }`}
                >
                  Show all
                </div>
              )}
              {filteredOptions.length > 0 && hasAllOption && (
                <div className="border-t border-gray-200 my-1"></div>
              )}
              {filteredOptions.map((option, index) => {
                const optionValue = option.value || option.label || '';
                const optionLabel = option.label || option.value || '';
                const isSelected = value === optionValue || String(value).toLowerCase() === String(optionValue).toLowerCase();
                const isParent = option.type === 'parent';
                const isChild = option.type === 'child';
                
                // Only child items are selectable
                if (isParent) {
                  return (
                    <div
                      key={index}
                      className="px-4 py-2 text-sm text-gray-600 font-medium select-none"
                    >
                      {optionLabel}
                    </div>
                  );
                }
                
                return (
                  <div
                    key={index}
                    onClick={() => handleValueSelect(option)}
                    className={`cursor-pointer select-none py-2 text-sm hover:bg-blue-50 ${
                      isSelected ? 'bg-yellow-100 text-yellow-900 font-medium' : 'text-gray-900 hover:text-blue-900'
                    } ${isChild ? 'pl-8' : 'px-4'}`}
                  >
                    {optionLabel}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
