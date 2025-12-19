'use client';

import { useState, useCallback } from 'react';
import { BookmarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * TemplatePanel Component
 * A separate panel for managing search templates
 * 
 * @param {Object} props
 * @param {Array} props.templates - Array of template objects
 * @param {Object} props.selectedTemplate - Currently selected template
 * @param {Function} props.onTemplateSelect - Callback when template is selected
 * @param {Function} props.onSetDefault - Callback when default template is set via radio button
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @param {Function} props.onSave - Callback for save button
 * @param {Function} props.onSaveAs - Callback for save as button
 * @param {string} props.className - Additional CSS classes
 */
export default function TemplatePanel({
  templates = [],
  selectedTemplate = null,
  onTemplateSelect = null,
  onSetDefault = null,
  onEdit = null,
  onDelete = null,
  onSave = null,
  onSaveAs = null,
  className = ''
}) {
  // Handle radio button change
  const handleRadioChange = useCallback((templateId, e) => {
    e.stopPropagation(); // Prevent template selection when clicking radio
    if (onSetDefault) {
      onSetDefault(templateId);
    }
  }, [onSetDefault]);

  // Handle edit button click
  const handleEdit = useCallback((template, e) => {
    e.stopPropagation(); // Prevent template selection when clicking edit
    if (onEdit) {
      onEdit(template);
    }
  }, [onEdit]);

  // Handle delete button click
  const handleDelete = useCallback((template, e) => {
    e.stopPropagation(); // Prevent template selection when clicking delete
    if (onDelete) {
      onDelete(template);
    }
  }, [onDelete]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Templates</h3>
        </div>
      </div>

      {/* Template Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Template List */}
        {onTemplateSelect && (
          <div className="max-h-48 overflow-y-auto">
            {/* No Template Option - Only show when there are NO templates */}
            {templates.length === 0 ? (
              <button
                onClick={() => onTemplateSelect(null)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  !selectedTemplate
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-transparent'
                }`}
              >
                No Template
              </button>
            ) : (
              /* Template Table - Only show when there ARE templates */
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Name</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-700 w-20">Default</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-700 w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(template => (
                    <tr
                      key={template.id}
                      onClick={() => onTemplateSelect(template.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <span className={`${
                          selectedTemplate?.id === template.id
                            ? 'text-blue-700 font-medium'
                            : 'text-gray-700'
                        }`}>
                          {template.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="radio"
                          name="default-template"
                          checked={template.is_default === true}
                          onChange={(e) => handleRadioChange(template.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          title="Set as default template"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {onEdit && (
                            <button
                              onClick={(e) => handleEdit(template, e)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Edit template"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => handleDelete(template, e)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Delete template"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Save/Save As Buttons */}
        {(onSave || onSaveAs) && (
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Save
              </button>
            )}
            {onSaveAs && (
              <button
                onClick={onSaveAs}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
              >
                Save As
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

