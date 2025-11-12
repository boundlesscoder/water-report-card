"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatformAdminRoute } from '../../../hooks/useRouteProtection';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PaintBrushIcon,
  SwatchIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useUser } from '../../../context/UserContext';
import LabelStyleManager from '../../../components/layerStyles/LabelStyleManager';
import api from '../../../services/api';

export default function LayerStylesManagement() {
  // Route protection - only Platform Admins can access this page
  const { isPlatformAdmin, isLoading } = usePlatformAdminRoute();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('water'); // 'water' or 'labels'
  const [layerStyles, setLayerStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStyle, setEditingStyle] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStyle, setNewStyle] = useState({
    layer_id: '',
    layer_type: 'fill',
    paint_properties: {
      'fill-color': '#cae9eb',
      'fill-opacity': 0.5
    },
    filter_properties: null
  });

  const fetchLayerStyles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/api/layer-styles/styles');
      const data = response.data;
      
      if (data.success) {
        setLayerStyles(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch layer styles');
      }
    } catch (error) {
      console.error('Error fetching layer styles:', error);
      setError(error.message || 'Failed to fetch layer styles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayerStyles();
  }, []);

  const handleEdit = (style) => {
    setEditingStyle(style);
    setNewStyle({
      layer_id: style.layer_id,
      layer_type: style.layer_type,
      paint_properties: {
        'fill-color': style.paint_properties['fill-color'] || '#cae9eb',
        'fill-opacity': style.paint_properties['fill-opacity'] || 0.5,
        'line-color': style.paint_properties['line-color'] || '#999999',
        'line-width': style.paint_properties['line-width'] || 1.5,
        'line-opacity': style.paint_properties['line-opacity'] || 1
      },
      filter_properties: style.filter_properties
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingStyle 
        ? `/api/layer-styles/styles/${editingStyle.id}`
        : '/api/layer-styles/styles';
      
      const method = editingStyle ? 'PUT' : 'POST';
      
      let response;
      if (editingStyle) {
        response = await api.put(url, newStyle);
      } else {
        response = await api.post(url, newStyle);
      }
      
      const data = response.data;
      
      if (data.success) {
        setShowAddModal(false);
        setEditingStyle(null);
        setNewStyle({
          layer_id: '',
          layer_type: 'fill',
          paint_properties: {},
          filter_properties: null
        });
        fetchLayerStyles();
      } else {
        throw new Error(data.message || 'Failed to save layer style');
      }
    } catch (error) {
      console.error('Error saving layer style:', error);
      setError(error.message || 'Failed to save layer style');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this layer style?')) return;
    
    try {
      const response = await api.delete(`/api/layer-styles/styles/${id}`);
      const data = response.data;
      
      if (data.success) {
        fetchLayerStyles();
      } else {
        throw new Error(data.message || 'Failed to delete layer style');
      }
    } catch (error) {
      console.error('Error deleting layer style:', error);
      setError(error.message || 'Failed to delete layer style');
    }
  };

  const handleAdd = () => {
    setEditingStyle(null);
    setNewStyle({
      layer_id: '',
      layer_type: 'fill',
      paint_properties: {
        'fill-color': '#cae9eb',
        'fill-opacity': 0.5
      },
      filter_properties: null
    });
    setShowAddModal(true);
  };



  const getLayerTypeIcon = (type) => {
    switch (type) {
      case 'fill':
        return <SwatchIcon className="w-5 h-5" />;
      case 'line':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'symbol':
        return <PaintBrushIcon className="w-5 h-5" />;
      default:
        return <PaintBrushIcon className="w-5 h-5" />;
    }
  };

  const getLayerTypeColor = (type) => {
    switch (type) {
      case 'fill':
        return 'bg-blue-100 text-blue-800';
      case 'line':
        return 'bg-green-100 text-green-800';
      case 'symbol':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Conditional rendering based on authentication status
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading layer styles...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('water')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'water'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SwatchIcon className="w-5 h-5 inline mr-2" />
              Water Layers
            </button>
            <button
              onClick={() => setActiveTab('labels')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'labels'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 inline mr-2" />
              Label Styles
            </button>
          </nav>
        </div>

        {/* Error Message */}
        {error && activeTab === 'water' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'water' && (
          <div>
            
            {/* Layer Styles Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {layerStyles.map((style) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${getLayerTypeColor(style.layer_type)}`}>
                      {getLayerTypeIcon(style.layer_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{style.layer_id}</h3>
                      <p className="text-sm text-gray-500">Type: {style.layer_type}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(style)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    {/* <button
                      onClick={() => handleDelete(style.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button> */}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Color Display - Show appropriate color based on layer type */}
                {((style.layer_type === 'fill' && style.paint_properties['fill-color']) || 
                  (style.layer_type === 'line' && style.paint_properties['line-color'])) && (
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ 
                        backgroundColor: style.layer_type === 'fill' 
                          ? style.paint_properties['fill-color'] 
                          : style.paint_properties['line-color']
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      Color: {style.layer_type === 'fill' 
                        ? style.paint_properties['fill-color'] 
                        : style.paint_properties['line-color']
                      }
                    </span>
                  </div>
                )}

                {/* Opacity Display - Show appropriate opacity based on layer type */}
                {((style.layer_type === 'fill' && style.paint_properties['fill-opacity']) || 
                  (style.layer_type === 'line' && style.paint_properties['line-opacity'])) && (
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(style.layer_type === 'fill' 
                            ? style.paint_properties['fill-opacity'] 
                            : style.paint_properties['line-opacity']) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      Opacity: {Math.round((style.layer_type === 'fill' 
                        ? style.paint_properties['fill-opacity'] 
                        : style.paint_properties['line-opacity']) * 100)}%
                    </span>
                  </div>
                )}

                {/* Line Width Display - Only for line layer types */}
                {style.layer_type === 'line' && style.paint_properties['line-width'] && (
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-600 h-2 rounded-full"
                        style={{ width: `${(style.paint_properties['line-width'] / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      Width: {style.paint_properties['line-width']}px
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {layerStyles.length === 0 && !loading && (
          <div className="text-center py-12">
            <PaintBrushIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No layer styles found</h3>
            <p className="text-gray-600 mb-4">Layer styles will appear here once they are created</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingStyle ? 'Edit Layer Style' : 'Add New Layer Style'}
                    </h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Layer ID
                    </label>
                    <input
                      type="text"
                      value={newStyle.layer_id}
                      onChange={(e) => setNewStyle({...newStyle, layer_id: e.target.value})}
                      disabled={editingStyle !== null}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        editingStyle !== null ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="e.g., water-fill"
                    />
                    {editingStyle !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Layer ID cannot be changed for existing layer styles
                      </p>
                    )}
                  </div>





                  {/* Color Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={newStyle.layer_type === 'fill' 
                          ? newStyle.paint_properties['fill-color'] 
                          : newStyle.paint_properties['line-color']
                        }
                        onChange={(e) => {
                          const color = e.target.value;
                          setNewStyle({
                            ...newStyle,
                            paint_properties: {
                              ...newStyle.paint_properties,
                              [newStyle.layer_type === 'fill' ? 'fill-color' : 'line-color']: color
                            }
                          });
                        }}
                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newStyle.layer_type === 'fill' 
                          ? newStyle.paint_properties['fill-color'] 
                          : newStyle.paint_properties['line-color']
                        }
                        onChange={(e) => {
                          const color = e.target.value;
                          setNewStyle({
                            ...newStyle,
                            paint_properties: {
                              ...newStyle.paint_properties,
                              [newStyle.layer_type === 'fill' ? 'fill-color' : 'line-color']: color
                            }
                          });
                        }}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="#cae9eb"
                      />
                    </div>
                  </div>

                  {/* Opacity Slider (for fill) */}
                  {newStyle.layer_type === 'fill' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opacity: {Math.round((newStyle.paint_properties['fill-opacity'] || 0.5) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(newStyle.paint_properties['fill-opacity'] || 0.5) * 100}
                        onChange={(e) => {
                          const opacity = parseFloat(e.target.value) / 100;
                          setNewStyle({
                            ...newStyle,
                            paint_properties: {
                              ...newStyle.paint_properties,
                              'fill-opacity': opacity
                            }
                          });
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  )}

                  {/* Line Width Slider (for line) */}
                  {newStyle.layer_type === 'line' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Line Width: {newStyle.paint_properties['line-width'] || 1.5}px
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={newStyle.paint_properties['line-width'] || 1.5}
                        onChange={(e) => {
                          const width = parseFloat(e.target.value);
                          setNewStyle({
                            ...newStyle,
                            paint_properties: {
                              ...newStyle.paint_properties,
                              'line-width': width
                            }
                          });
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  )}

                  {/* Line Opacity Slider (for line) */}
                  {newStyle.layer_type === 'line' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Line Opacity: {Math.round((newStyle.paint_properties['line-opacity'] || 1) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(newStyle.paint_properties['line-opacity'] || 1) * 100}
                        onChange={(e) => {
                          const opacity = parseFloat(e.target.value) / 100;
                          setNewStyle({
                            ...newStyle,
                            paint_properties: {
                              ...newStyle.paint_properties,
                              'line-opacity': opacity
                            }
                          });
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                      {newStyle.layer_type === 'fill' ? (
                        <div 
                          className="w-full h-16 rounded"
                          style={{
                            backgroundColor: newStyle.paint_properties['fill-color'] || '#cae9eb',
                            opacity: newStyle.paint_properties['fill-opacity'] || 0.5
                          }}
                        ></div>
                      ) : (
                        <div className="w-full h-16 flex items-center justify-center">
                          <div 
                            className="h-1 rounded"
                            style={{
                              backgroundColor: newStyle.paint_properties['line-color'] || '#999999',
                              width: '80%',
                              height: `${newStyle.paint_properties['line-width'] || 1.5}px`,
                              opacity: newStyle.paint_properties['line-opacity'] || 1
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {editingStyle ? 'Update' : 'Add'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        )}

        {/* Labels Tab Content */}
        {activeTab === 'labels' && (
          <LabelStyleManager user={user} />
        )}
      </div>
    </DashboardLayout>
  );
} 