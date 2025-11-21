'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '../../../context/UserContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
  BuildingOffice2Icon, 
  MapPinIcon, 
  UsersIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapIcon,
  ListBulletIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import CreateCustomerModal from './components/CreateCustomerModal';
import EditCustomerModal from './components/EditCustomerModal';
import InviteUserModal from './components/InviteUserModal';
import CustomerDetailModal from './components/CustomerDetailModal';
import CustomerMapView from '../../../components/mapview/CustomerMapView';
import api from '../../../services/api';

export default function CustomerManagement() {
  const { user } = useUser();
  
  // Get token from localStorage since it's stored there
  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.token;
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  }, []);
  const [customers, setCustomers] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setMagnifyingGlassIconTerm] = useState('');
  const [statusFunnelIcon, setStatusFunnelIcon] = useState('all');
  const [parentFunnelIcon, setParentFunnelIcon] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  
  // Hierarchy sidebar filters
  const [hierarchyFilters, setHierarchyFilters] = useState({
    search: '',
    status: 'all',
    location: 'all',
    parentFilter: 'all' // all, root, children
  });

  // Filter hierarchy based on filters
  const filteredHierarchy = useMemo(() => {
    if (!hierarchy || hierarchy.length === 0) return [];

    let filtered = [...hierarchy];

    // Apply search filter
    if (hierarchyFilters.search) {
      const searchLower = hierarchyFilters.search.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.location_city && customer.location_city.toLowerCase().includes(searchLower)) ||
        (customer.location_state && customer.location_state.toLowerCase().includes(searchLower)) ||
        (customer.contact_1_email && customer.contact_1_email.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (hierarchyFilters.status !== 'all') {
      filtered = filtered.filter(customer => customer.status === hierarchyFilters.status);
    }

    // Apply location filter
    if (hierarchyFilters.location !== 'all') {
      filtered = filtered.filter(customer => {
        if (hierarchyFilters.location === 'has_location') {
          return customer.location_city || customer.location_state;
        }
        if (hierarchyFilters.location === 'no_location') {
          return !customer.location_city && !customer.location_state;
        }
        return true;
      });
    }

    // Apply parent filter
    if (hierarchyFilters.parentFilter === 'root') {
      filtered = filtered.filter(customer => !customer.parent_id);
    } else if (hierarchyFilters.parentFilter === 'children') {
      filtered = filtered.filter(customer => customer.parent_id);
    }

    return filtered;
  }, [hierarchy, hierarchyFilters]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFunnelIcon !== 'all' && { status: statusFunnelIcon }),
        ...(parentFunnelIcon && { parent_id: parentFunnelIcon })
      });

      const response = await api.get(`/api/customers?${params}`);
      console.log('Customers API response data:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch customers');
      }

      setCustomers(response.data.data?.customers || []);
      setPagination(response.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFunnelIcon, parentFunnelIcon, getToken]);

  // Fetch hierarchy
  const fetchHierarchy = useCallback(async () => {
    try {
      setHierarchyLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get('/api/customers/hierarchy');
      console.log('Hierarchy API response data:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch hierarchy');
      }

      setHierarchy(response.data.data || []);
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load customer hierarchy');
    } finally {
      setHierarchyLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchCustomers();
    fetchHierarchy();
  }, [fetchCustomers, fetchHierarchy]);

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Render hierarchy tree
  const renderHierarchyNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children_count > 0;
    const isSelected = selectedCustomer?.id === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-md ${
            isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => setSelectedCustomer(node)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6 mr-2" />}
          
          <BuildingOffice2Icon className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {node.name}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  node.status === 'active' ? 'bg-green-100 text-green-800' :
                  node.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  node.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {node.status}
                </span>
                {node.hierarchy_level > 0 && (
                  <span className="text-gray-400">Level {node.hierarchy_level}</span>
                )}
              </div>
              
              {node.location_city && node.location_state && (
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="w-3 h-3" />
                  <span className="truncate">{node.location_city}, {node.location_state}</span>
                </div>
              )}
              
              {node.contact_1_email && (
                <div className="flex items-center space-x-1">
                  <EnvelopeIcon className="w-3 h-3" />
                  <span className="truncate">{node.contact_1_email}</span>
                </div>
              )}
              
              {node.children_count > 0 && (
                <div className="flex items-center space-x-1">
                  <UsersIcon className="w-3 h-3" />
                  <span>{node.children_count} children</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {hierarchy
              .filter(child => child.parent_id === node.id)
              .map(child => renderHierarchyNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get root nodes (nodes without parent)
  const rootNodes = hierarchy.filter(node => !node.parent_id);

  // Handle search
  const handleMagnifyingGlassIcon = (e) => {
    setMagnifyingGlassIconTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle status filter
  const handleStatusFunnelIcon = (status) => {
    setStatusFunnelIcon(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle customer creation success
  const handleCustomerCreated = (newCustomer) => {
    // Refresh the customer list from the server to get all fields
    fetchCustomers();
    fetchHierarchy(); // Refresh hierarchy
  };

  // Handle invitation success
  const handleInvitationSent = (invitationData) => {
    // Could show a success message or refresh data
    console.log('Invitation sent:', invitationData);
  };

  // Handle view customer details
  const handleViewCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    setShowDetailModal(true);
  };

  // Handle edit customer
  const handleEditCustomer = async (customer) => {
    try {
      // Fetch full customer details for editing
      const response = await api.get(`/api/customers/${customer.id}`);
      if (response.data.success) {
        setCustomerToEdit(response.data.data);
        setShowEditModal(true);
      } else {
        console.error('Failed to fetch customer details:', response.data.message);
        setError('Failed to load customer details for editing');
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('Failed to load customer details for editing');
    }
  };

  // Handle customer updated
  const handleCustomerUpdated = (updatedCustomer) => {
    // Update the customer in the list
    setCustomers(prev => prev.map(customer => 
      customer.id === updatedCustomer.id ? updatedCustomer : customer
    ));
    // Refresh the hierarchy as well
    fetchHierarchy();
    setShowEditModal(false);
    setCustomerToEdit(null);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const response = await api.delete(`/api/customers/${customerToDelete.id}`);
      
      if (response.data.success) {
        // Remove customer from the list
        setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
        // Refresh the hierarchy as well
        fetchHierarchy();
        // Close modal and reset state
        setShowDeleteModal(false);
        setCustomerToDelete(null);
        // Show success message
        alert('Customer deleted successfully');
      } else {
        throw new Error(response.data.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert(error.response?.data?.error || error.message || 'Failed to delete customer');
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] -m-6">
        <div className="flex h-full">
      {/* Contact Hierarchy Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contact Hierarchy</h2>
          <p className="text-sm text-gray-500">Manage your contacts</p>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={hierarchyFilters.search}
                onChange={(e) => setHierarchyFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={hierarchyFilters.status}
              onChange={(e) => setHierarchyFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          {/* Location Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
            <select
              value={hierarchyFilters.location}
              onChange={(e) => setHierarchyFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Locations</option>
              <option value="has_location">Has Location</option>
              <option value="no_location">No Location</option>
            </select>
          </div>
          
          {/* Parent Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hierarchy</label>
            <select
              value={hierarchyFilters.parentFilter}
              onChange={(e) => setHierarchyFilters(prev => ({ ...prev, parentFilter: e.target.value }))}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Customers</option>
              <option value="root">Root Customers</option>
              <option value="children">Child Customers</option>
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {hierarchyLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <BuildingOffice2Icon className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-2">Failed to load hierarchy</p>
              <p className="text-xs text-gray-500 mb-3">Database function needs to be updated</p>
              <button
                onClick={() => fetchHierarchy()}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
              >
                Retry
              </button>
            </div>
          ) : filteredHierarchy.length === 0 ? (
            <div className="text-center py-8">
              <BuildingOffice2Icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No customers found</p>
              <p className="text-xs text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredHierarchy.map(node => renderHierarchyNode(node))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>

            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 divide-x divide-gray-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">List view</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                    viewMode === 'map' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Map view</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>

        {/* FunnelIcons */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {/* MagnifyingGlassIcon */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="MagnifyingGlassIcon customers..."
                value={searchTerm}
                onChange={handleMagnifyingGlassIcon}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status FunnelIcon */}
            <select
              value={statusFunnelIcon}
              onChange={(e) => handleStatusFunnelIcon(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
              <option value="suspended">Suspended</option>
            </select>
            
            {/* Parent FunnelIcon */}
            <select
              value={parentFunnelIcon || ''}
              onChange={(e) => setParentFunnelIcon(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Customers</option>
              {hierarchy.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden h-full">
          {viewMode === 'list' ? (
            <div className="h-full overflow-y-auto">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
              
              {customers.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BuildingOffice2Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-500">Get started by creating your first customer.</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid gap-4">
                    {customers.map(customer => (
                      <div
                        key={customer.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {customer.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                customer.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : customer.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-800'
                                  : customer.status === 'prospect'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {customer.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              {customer.location_city && (
                                <div className="flex items-center space-x-2">
                                  <MapPinIcon className="w-4 h-4" />
                                  <span>{customer.location_city}, {customer.location_state}</span>
                                </div>
                              )}
                              
                              {customer.billing_email && (
                                <div className="flex items-center space-x-2">
                                  <EnvelopeIcon className="w-4 h-4" />
                                  <span>{customer.billing_email}</span>
                                </div>
                              )}
                              
                              {customer.contact_1_direct_line && (
                                <div className="flex items-center space-x-2">
                                  <PhoneIcon className="w-4 h-4" />
                                  <span>{customer.contact_1_direct_line}</span>
                                </div>
                              )}
                              
                              {customer.children_count > 0 && (
                                <div className="flex items-center space-x-2">
                                  <UsersIcon className="w-4 h-4" />
                                  <span>{customer.children_count} child customers</span>
                                </div>
                              )}
                            </div>
                            
                            {customer.general_notes && (
                              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                                {customer.general_notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button 
                              onClick={() => handleViewCustomer(customer.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                              title="View customer details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditCustomer(customer)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                              title="Edit customer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCustomer(customer)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                              title="Delete customer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} results
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={!pagination.hasPrev}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm border rounded-md ${
                                pagination.page === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={!pagination.hasNext}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <CustomerMapView 
              customers={customers}
              onCustomerSelect={(customer) => handleViewCustomer(customer.id)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCustomerCreated}
        availableCustomers={hierarchy}
        user={user}
        token={getToken()}
      />
      
       <EditCustomerModal
         isOpen={showEditModal}
         onClose={() => {
           setShowEditModal(false);
           setCustomerToEdit(null);
         }}
         customer={customerToEdit}
         onSuccess={handleCustomerUpdated}
       />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Customer
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete <strong>&ldquo;{customerToDelete?.name}&rdquo;</strong>? 
                  This action cannot be undone.
                </p>
                
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteCustomer}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInvitationSent}
        user={user}
        token={getToken()}
      />
      
      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        customerId={selectedCustomerId}
        token={getToken()}
      />
        </div>
      </div>
    </DashboardLayout>
  );
}
