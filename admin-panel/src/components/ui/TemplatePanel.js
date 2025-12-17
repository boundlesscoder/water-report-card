'use client';

import { useState, useCallback } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';

/**
 * TemplatePanel Component
 * A separate panel for managing search templates
 * 
 * @param {Object} props
 * @param {Array} props.templates - Array of template objects
 * @param {Object} props.selectedTemplate - Currently selected template
 * @param {Function} props.onTemplateSelect - Callback when template is selected
 * @param {Function} props.onSave - Callback for save button
 * @param {Function} props.onSaveAs - Callback for save as button
 * @param {string} props.className - Additional CSS classes
 */
export default function TemplatePanel({
  templates = [],
  selectedTemplate = null,
  onTemplateSelect = null,
  onSave = null,
  onSaveAs = null,
  className = ''
}) {
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
          <div className="space-y-1 max-h-48 overflow-y-auto">
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
              /* Template Items - Only show when there ARE templates */
              templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onTemplateSelect(template.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-transparent'
                  }`}
                >
                  {template.name}
                </button>
              ))
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

