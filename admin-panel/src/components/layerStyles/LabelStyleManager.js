"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './LabelStyleManager.module.css';
import { getLabelStylesAPI, saveLabelStylesAPI, resetLabelStylesAPI } from '../../services/labelStyles.api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapIcon,
  DocumentTextIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const PLACE_LABEL_LAYERS = [
  {
    id: 'place-country-label',
    name: 'Country Labels',
    description: 'Country names and boundaries',
    category: 'place',
    defaultStyles: {
      textColor: '#5a5757',
      textSize: { min: 13, max: 22, zoom: [1, 10] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(255,255,255,1)',
      textHaloWidth: 1.5,
      textOpacity: 1,
      minZoom: 1,
      maxZoom: 10
    }
  },
  {
    id: 'place-state-label',
    name: 'State/Province Labels',
    description: 'State and province names',
    category: 'place',
    defaultStyles: {
      textColor: '#627bc1',
      textSize: { min: 9, max: 16, zoom: [3, 9] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(255,255,255,1)',
      textHaloWidth: 1.2,
      textOpacity: 1,
      minZoom: 3,
      maxZoom: 9
    }
  },
  {
    id: 'place-capital-label',
    name: 'Capital Cities',
    description: 'State and national capitals',
    category: 'place',
    defaultStyles: {
      textColor: '#2d2d2d',
      textSize: { min: 14, max: 32, zoom: [2, 15] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(255,255,255,1)',
      textHaloWidth: 2,
      textOpacity: 1,
      minZoom: 2,
      maxZoom: 15
    }
  },
  {
    id: 'place-city-major-label',
    name: 'Major Cities',
    description: 'Large metropolitan areas',
    category: 'place',
    defaultStyles: {
      textColor: '#2d2d2d',
      textSize: { min: 12, max: 30, zoom: [3, 16] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(255,255,255,1)',
      textHaloWidth: 1.5,
      textOpacity: 1,
      minZoom: 3,
      maxZoom: 16
    }
  },
  {
    id: 'place-city-medium-label',
    name: 'Medium Cities',
    description: 'Medium-sized cities and towns',
    category: 'place',
    defaultStyles: {
      textColor: '#5a5757',
      textSize: { min: 10, max: 20, zoom: [5, 16] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(255,255,255,1)',
      textHaloWidth: 1.2,
      textOpacity: 1,
      minZoom: 5,
      maxZoom: 16
    }
  },
  {
    id: 'place-city-small-label',
    name: 'Small Cities',
    description: 'Small cities and towns',
    category: 'place',
    defaultStyles: {
      textColor: '#777777',
      textSize: { min: 10, max: 14, zoom: [7, 16] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(255,255,255,1)',
      textHaloWidth: 1.2,
      textOpacity: 1,
      minZoom: 7,
      maxZoom: 16
    }
  },
  {
    id: 'place-village-label',
    name: 'Villages',
    description: 'Small villages and hamlets',
    category: 'place',
    defaultStyles: {
      textColor: '#888888',
      textSize: { min: 9, max: 12, zoom: [9, 18] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(255,255,255,1)',
      textHaloWidth: 1.2,
      textOpacity: 1,
      minZoom: 9,
      maxZoom: 18
    }
  }
];

const ROAD_LABEL_LAYERS = [
  {
    id: 'road-label-motorway',
    name: 'Highway Labels',
    description: 'Interstate and highway shields',
    category: 'road',
    defaultStyles: {
      textColor: '#ffffff',
      textSize: { min: 10, max: 16, zoom: [6, 18] },
      textFont: 'DIN Pro Bold',
      textHaloColor: 'rgba(0,0,0,0.3)',
      textHaloWidth: 1,
      textOpacity: 1,
      minZoom: 6,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-trunk',
    name: 'Major Road Labels',
    description: 'Major trunk roads',
    category: 'road',
    defaultStyles: {
      textColor: '#000000',
      textSize: { min: 10, max: 16, zoom: [8, 18] },
      textFont: 'DIN Pro Bold',
      textHaloColor: '#000000',
      textHaloWidth: 0.1,
      textOpacity: 1,
      minZoom: 8,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-primary',
    name: 'Primary Road Labels',
    description: 'Primary roads and streets',
    category: 'road',
    defaultStyles: {
      textColor: '#333333',
      textSize: { min: 11, max: 16, zoom: [10, 18] },
      textFont: 'DIN Pro Medium',
      textHaloColor: 'rgba(255,255,255,0.8)',
      textHaloWidth: 1.5,
      textOpacity: 1,
      minZoom: 10,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-secondary',
    name: 'Secondary Road Labels',
    description: 'Secondary roads',
    category: 'road',
    defaultStyles: {
      textColor: '#333333',
      textSize: { min: 11, max: 16, zoom: [11, 18] },
      textFont: 'DIN Pro Medium',
      textHaloColor: 'rgba(255,255,255,0.8)',
      textHaloWidth: 1.5,
      textOpacity: 1,
      minZoom: 11,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-tertiary',
    name: 'Tertiary Roads',
    description: 'Tertiary roads and tertiary links',
    category: 'road',
    defaultStyles: {
      textColor: '#333333',
      textSize: { min: 9, max: 15, zoom: [12, 18] },
      textFont: 'DIN Pro Medium',
      textHaloColor: 'transparent',
      textHaloWidth: 0,
      textOpacity: 1,
      minZoom: 12,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-street',
    name: 'Streets',
    description: 'Local streets and street limited',
    category: 'road',
    defaultStyles: {
      textColor: '#5a5757',
      textSize: { min: 9, max: 15, zoom: [13, 19] },
      textFont: 'DIN Pro Regular',
      textHaloColor: 'transparent',
      textHaloWidth: 0,
      textOpacity: 1,
      minZoom: 13,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-service',
    name: 'Service Roads',
    description: 'Service roads and driveways',
    category: 'road',
    defaultStyles: {
      textColor: '#777777',
      textSize: { min: 8, max: 14, zoom: [14, 20] },
      textFont: 'DIN Pro Regular',
      textHaloColor: 'transparent',
      textHaloWidth: 0,
      textOpacity: 1,
      minZoom: 14,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-path',
    name: 'Paths',
    description: 'Walking paths and trails',
    category: 'road',
    defaultStyles: {
      textColor: '#888888',
      textSize: { min: 8, max: 14, zoom: [15, 21] },
      textFont: 'DIN Pro Regular',
      textHaloColor: 'transparent',
      textHaloWidth: 0,
      textOpacity: 1,
      minZoom: 15,
      maxZoom: 22
    }
  },
  {
    id: 'road-label-track',
    name: 'Tracks',
    description: 'Dirt tracks and unpaved roads',
    category: 'road',
    defaultStyles: {
      textColor: '#999999',
      textSize: { min: 8, max: 14, zoom: [16, 22] },
      textFont: 'DIN Pro Regular',
      textHaloColor: 'transparent',
      textHaloWidth: 0,
      textOpacity: 1,
      minZoom: 16,
      maxZoom: 22
    }
  }
];

// Color conversion utilities
const rgbaToHex = (rgba) => {
  if (!rgba || rgba === 'transparent') return '#ffffff';
  
  // Handle rgba format
  if (rgba.startsWith('rgba(')) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
  
  // Handle rgb format
  if (rgba.startsWith('rgb(')) {
    const match = rgba.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
  
  // If it's already a hex color, return as is
  if (rgba.startsWith('#')) {
    return rgba;
  }
  
  return '#ffffff';
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex || hex === 'transparent') return 'rgba(255,255,255,1)';
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r},${g},${b},${alpha})`;
};

export default function LabelStyleManager({ user }) {
  const [activeTab, setActiveTab] = useState('place');
  const [expandedLayers, setExpandedLayers] = useState({});
  const [layerStyles, setLayerStyles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initialize with default styles
    const initialStyles = {};
    [...PLACE_LABEL_LAYERS, ...ROAD_LABEL_LAYERS].forEach(layer => {
      initialStyles[layer.id] = { ...layer.defaultStyles };
    });
    setLayerStyles(initialStyles);
    loadSavedStyles();
  }, []);

  const loadSavedStyles = async () => {
    try {
      const result = await getLabelStylesAPI();
      if (result.data && result.data.styles) {
        setLayerStyles(prev => ({ ...prev, ...result.data.styles }));
      } else if (result.error) {
        console.warn('Error loading saved styles:', result.error);
      }
    } catch (error) {
      console.error('Error loading saved styles:', error);
    }
  };

  const saveStyles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await saveLabelStylesAPI(layerStyles);
      
      if (result.data) {
        setHasChanges(false);
        // Success - styles saved
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message || 'Failed to save styles');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all styles to default values?')) {
      const defaultStyles = {};
      [...PLACE_LABEL_LAYERS, ...ROAD_LABEL_LAYERS].forEach(layer => {
        defaultStyles[layer.id] = { ...layer.defaultStyles };
      });
      setLayerStyles(defaultStyles);
      setHasChanges(true);
    }
  };



  const toggleLayerExpanded = (layerId) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  const getCurrentLayers = () => {
    return activeTab === 'place' ? PLACE_LABEL_LAYERS : ROAD_LABEL_LAYERS;
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 invisible">Label Style Manager</h2>
          <p className="text-gray-600 invisible">Customize the appearance of place and road labels</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveStyles}
            disabled={!hasChanges || loading}
            className={`px-4 py-2 rounded-md ${
              hasChanges && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('place')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'place'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapIcon className="w-5 h-5 inline mr-2" />
            Place Labels
          </button>
          <button
            onClick={() => setActiveTab('road')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'road'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5 inline mr-2" />
            Road Labels
          </button>
        </nav>
      </div>

      {/* Layer Cards */}
      <div className="space-y-4">
        {getCurrentLayers().map((layer) => {
          const isExpanded = expandedLayers[layer.id];
          const currentStyles = {
            ...layer.defaultStyles,
            ...(layerStyles[layer.id] || {})
          };

          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              {/* Layer Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleLayerExpanded(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      layer.category === 'place' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {layer.category === 'place' ? (
                        <MapIcon className="w-5 h-5" />
                      ) : (
                        <DocumentTextIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{layer.name}</h3>
                      <p className="text-sm text-gray-500">{layer.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: currentStyles.textColor }}
                    />
                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Layer Controls */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Text Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Text Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbaToHex(currentStyles.textColor)}
                              onChange={(e) => {
                                const hexColor = e.target.value;
                                setLayerStyles(prev => ({
                                  ...prev,
                                  [layer.id]: {
                                    ...prev[layer.id],
                                    textColor: hexColor
                                  }
                                }));
                                setHasChanges(true);
                              }}
                              className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={currentStyles.textColor || ''}
                              onChange={(e) => {
                                const color = e.target.value;
                                setLayerStyles(prev => ({
                                  ...prev,
                                  [layer.id]: {
                                    ...prev[layer.id],
                                    textColor: color
                                  }
                                }));
                                setHasChanges(true);
                              }}
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                              placeholder="#000000"
                            />
                          </div>
                        </div>

                        {/* Text Halo Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Text Outline Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbaToHex(currentStyles.textHaloColor)}
                              onChange={(e) => {
                                const hexColor = e.target.value;
                                const rgbaColor = hexToRgba(hexColor);
                                setLayerStyles(prev => ({
                                  ...prev,
                                  [layer.id]: {
                                    ...prev[layer.id],
                                    textHaloColor: rgbaColor
                                  }
                                }));
                                setHasChanges(true);
                              }}
                              className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={currentStyles.textHaloColor || ''}
                              onChange={(e) => {
                                const color = e.target.value;
                                setLayerStyles(prev => ({
                                  ...prev,
                                  [layer.id]: {
                                    ...prev[layer.id],
                                    textHaloColor: color
                                  }
                                }));
                                setHasChanges(true);
                              }}
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                              placeholder="rgba(255,255,255,1)"
                            />
                          </div>
                        </div>

                        {/* Font */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Font Family
                          </label>
                          <select
                            value={currentStyles.textFont || 'Arial Unicode MS'}
                            onChange={(e) => {
                              const font = e.target.value;
                              setLayerStyles(prev => ({
                                ...prev,
                                [layer.id]: {
                                  ...prev[layer.id],
                                  textFont: font
                                }
                              }));
                              setHasChanges(true);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="Arial Unicode MS">Arial Unicode MS</option>
                            <option value="Arial Unicode MS Bold">Arial Unicode MS Bold</option>
                          </select>
                        </div>

                        {/* Text Size Range */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Text Size Range
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Min Size (px)</label>
                              <input
                                type="number"
                                min="6"
                                max="72"
                                value={currentStyles.textSize?.min || 12}
                                onChange={(e) => {
                                  const minSize = parseInt(e.target.value) || 12;
                                  setLayerStyles(prev => ({
                                    ...prev,
                                    [layer.id]: {
                                      ...prev[layer.id],
                                      textSize: {
                                        ...prev[layer.id]?.textSize,
                                        min: minSize
                                      }
                                    }
                                  }));
                                  setHasChanges(true);
                                }}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Max Size (px)</label>
                              <input
                                type="number"
                                min="6"
                                max="72"
                                value={currentStyles.textSize?.max || 16}
                                onChange={(e) => {
                                  const maxSize = parseInt(e.target.value) || 16;
                                  setLayerStyles(prev => ({
                                    ...prev,
                                    [layer.id]: {
                                      ...prev[layer.id],
                                      textSize: {
                                        ...prev[layer.id]?.textSize,
                                        max: maxSize
                                      }
                                    }
                                  }));
                                  setHasChanges(true);
                                }}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Zoom Range */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Visibility Zoom Range
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Min Zoom</label>
                              <input
                                type="number"
                                min="0"
                                max="22"
                                value={currentStyles.minZoom || 1}
                                onChange={(e) => {
                                  const minZoom = parseInt(e.target.value) || 1;
                                  setLayerStyles(prev => ({
                                    ...prev,
                                    [layer.id]: {
                                      ...prev[layer.id],
                                      minZoom: minZoom
                                    }
                                  }));
                                  setHasChanges(true);
                                }}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Max Zoom</label>
                              <input
                                type="number"
                                min="0"
                                max="22"
                                value={currentStyles.maxZoom || 22}
                                onChange={(e) => {
                                  const maxZoom = parseInt(e.target.value) || 22;
                                  setLayerStyles(prev => ({
                                    ...prev,
                                    [layer.id]: {
                                      ...prev[layer.id],
                                      maxZoom: maxZoom
                                    }
                                  }));
                                  setHasChanges(true);
                                }}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Text Halo Width */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Text Outline Width: {currentStyles.textHaloWidth || 1.0}px
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={currentStyles.textHaloWidth || 1.0}
                            onChange={(e) => {
                              const width = parseFloat(e.target.value);
                              setLayerStyles(prev => ({
                                ...prev,
                                [layer.id]: {
                                  ...prev[layer.id],
                                  textHaloWidth: width
                                }
                              }));
                              setHasChanges(true);
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>

                        {/* Text Opacity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Text Opacity: {Math.round((currentStyles.textOpacity || 1.0) * 100)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={(currentStyles.textOpacity || 1.0) * 100}
                            onChange={(e) => {
                              const opacity = parseFloat(e.target.value) / 100;
                              setLayerStyles(prev => ({
                                ...prev,
                                [layer.id]: {
                                  ...prev[layer.id],
                                  textOpacity: opacity
                                }
                              }));
                              setHasChanges(true);
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                        <div className="space-y-2">
                          {(() => {
                            const getPreviewText = () => {
                              switch(layer.id) {
                                case 'place-country-label':
                                  return 'UNITED STATES';
                                case 'place-state-label':
                                  return 'ARIZONA';
                                case 'place-capital-label':
                                  return 'Phoenix';
                                case 'place-city-major-label':
                                  return 'Las Vegas';
                                case 'place-city-medium-label':
                                  return 'Scottsdale';
                                case 'place-city-small-label':
                                  return 'Sedona';
                                case 'place-village-label':
                                  return 'Jerome';
                                case 'road-label-motorway':
                                  return 'I-17';
                                case 'road-label-trunk':
                                  return 'US-60';
                                case 'road-label-primary':
                                  return 'Camelback Rd';
                                case 'road-label-secondary':
                                  return 'Indian School Rd';
                                case 'road-label-tertiary':
                                  return 'Tertiary Rd';
                                case 'road-label-street':
                                  return 'Oak St';
                                case 'road-label-service':
                                  return 'Service Dr';
                                case 'road-label-path':
                                  return 'Trail Path';
                                case 'road-label-track':
                                  return 'Dirt Track';
                                default:
                                  return `${layer.name} Sample`;
                              }
                            };

                            const previewText = getPreviewText();
                            const minSize = typeof currentStyles.textSize.min === 'number' ? currentStyles.textSize.min : 12;
                            const maxSize = typeof currentStyles.textSize.max === 'number' ? currentStyles.textSize.max : 16;
                            const avgSize = Math.round((minSize + maxSize) / 2);
                            
                            return (
                              <div 
                                className="inline-block px-3 py-1 rounded"
                                style={{
                                  color: currentStyles.textColor,
                                  fontFamily: currentStyles.textFont.split(' ')[0],
                                  fontWeight: currentStyles.textFont.includes('Bold') ? 'bold' : 
                                             currentStyles.textFont.includes('Medium') ? '500' : 'normal',
                                  fontSize: `${avgSize}px`,
                                  textShadow: `0 0 ${currentStyles.textHaloWidth}px ${currentStyles.textHaloColor}`,
                                  opacity: currentStyles.textOpacity,
                                  backgroundColor: 'rgba(255,255,255,0.8)',
                                  border: '1px solid rgba(0,0,0,0.1)'
                                }}
                              >
                                {previewText}
                              </div>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Shows how this label will appear on the map
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}