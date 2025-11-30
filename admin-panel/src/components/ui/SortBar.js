'use client';

import { ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SortBar Component
 * A single button that shows field name, search condition, and sort direction
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for this sort bar
 * @param {Object} props.selectedField - Currently selected field {id, label, value}
 * @param {string} props.searchValue - The search condition value for this field
 * @param {string} props.sortDirection - Current sort direction ('asc' or 'desc')
 * @param {Function} props.onSortDirectionChange - Callback when sort direction changes
 * @param {Function} props.onRemove - Callback to remove this sort bar
 * @param {boolean} props.removable - Whether this sort bar can be removed
 */
export default function SortBar({
  id,
  selectedField = null,
  searchValue = '',
  sortDirection = 'asc',
  onSortDirectionChange,
  onRemove,
  removable = true
}) {
  // Handle button click - toggle sort direction
  const handleClick = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    onSortDirectionChange(newDirection);
  };

  // Handle remove
  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(id);
    }
  };

  const fieldName = selectedField?.name;
  const displayValue = searchValue === 'Show all' ? 'All' : (searchValue || '');

  return (
    <div className="flex items-center gap-2">
      {/* Single Sort Button */}
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      >
        <span className="font-medium">{fieldName}</span>
        {displayValue && (
          <>
            <span className="text-gray-400">:</span>
            <span className="text-gray-600">{displayValue}</span>
          </>
        )}
        {sortDirection === 'asc' ? (
          <ArrowUpIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Remove Button */}
      {removable && onRemove && (
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
