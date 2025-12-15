'use client';

/**
 * Example Usage of SearchPanel and SearchableDataTable
 * 
 * This file demonstrates how to use the flexible SearchPanel and SearchableDataTable
 * components in different pages with different configurations.
 */

import { useState, useMemo } from 'react';
import SearchPanel from './SearchPanel';
import SearchableDataTable from './SearchableDataTable';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

// Example 1: Customer/Contact Management Page
export function CustomerSearchExample() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Define search configuration for customers
  const customerSearchConfig = [
    { id: 'name', label: 'Name', type: 'text', placeholder: 'Search by name...' },
    { id: 'email', label: 'Email', type: 'text', placeholder: 'Search by email...' },
    { id: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'prospect', label: 'Prospect' }
    ]},
    { id: 'city', label: 'City', type: 'text', placeholder: 'Search by city...' },
    { id: 'state', label: 'State', type: 'text', placeholder: 'Search by state...' }
  ];

  // Define table columns
  const customerColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { 
      key: 'actions', 
      label: 'Actions', 
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Handle search
  const handleSearch = async (searchConditions) => {
    setLoading(true);
    try {
      // Build query from search conditions
      const query = {};
      searchConditions.forEach(condition => {
        if (condition.value && condition.value.trim() !== '') {
          query[condition.fieldId] = condition.value;
        }
      });

      // Make API call with query
      // const response = await api.get('/api/customers', { params: query });
      // setCustomers(response.data);
      
      // For demo purposes, filter local data
      // In real usage, you'd make an API call
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sort
  const handleSort = async (sortConditions) => {
    console.log('Sort conditions:', sortConditions);
    // Apply sorting - SearchableDataTable handles this internally
    // But you can also make API calls with sort parameters if needed
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customer Management</h1>
      
      <SearchableDataTable
        data={customers}
        columns={customerColumns}
        searchConfig={customerSearchConfig}
        onSearch={handleSearch}
        onSort={handleSort}
        loading={loading}
        showSearchPanel={true}
        showSortPanel={true}
        renderActions={(row) => (
          <div className="flex items-center gap-2">
            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
              <EyeIcon className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}

// Example 2: User Management Page
export function UserSearchExample() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasPrev: false,
    hasNext: false
  });

  // Define search configuration for users
  const userSearchConfig = [
    { id: 'username', label: 'Username', type: 'text' },
    { id: 'email', label: 'Email', type: 'text' },
    { id: 'role', label: 'Role', type: 'select', options: [
      { value: 'admin', label: 'Admin' },
      { value: 'user', label: 'User' },
      { value: 'manager', label: 'Manager' }
    ]},
    { id: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]}
  ];

  // Define table columns
  const userColumns = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true }
  ];

  const handleSearch = async (searchConditions) => {
    // Handle search with pagination
    setPagination(prev => ({ ...prev, page: 1 }));
    // Make API call
  };

  const handleSort = async (sortConditions) => {
    console.log('Sort conditions:', sortConditions);
    // Apply sorting - SearchableDataTable handles this internally
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Make API call with new page
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <SearchableDataTable
        data={users}
        columns={userColumns}
        searchConfig={userSearchConfig}
        onSearch={handleSearch}
        onSort={handleSort}
        pagination={pagination}
        onPageChange={handlePageChange}
        showSearchPanel={true}
        showSortPanel={true}
      />
    </div>
  );
}

// Example 3: Standalone SearchPanel (without table)
export function StandaloneSearchExample() {
  const [searchConditions, setSearchConditions] = useState([]);

  const searchConfig = [
    { id: 'field1', label: 'Field 1', type: 'text' },
    { id: 'field2', label: 'Field 2', type: 'text' },
    { id: 'field3', label: 'Field 3', type: 'select', options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ]}
  ];

  const handleSearchChange = (searches) => {
    setSearchConditions(searches);
    console.log('Search conditions:', searches);
    // Apply filters to your data
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Custom Search</h1>
      
      <SearchPanel
        searchConfig={searchConfig}
        activeSearches={searchConditions}
        onSearchChange={handleSearchChange}
        maxSearches={3}
      />
      
      {/* Your custom content that uses searchConditions */}
      <div className="mt-6">
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(searchConditions, null, 2)}
        </pre>
      </div>
    </div>
  );
}

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Import the components:
 *    import SearchPanel from '@/components/ui/SearchPanel';
 *    import SearchableDataTable from '@/components/ui/SearchableDataTable';
 * 
 * 2. Define your search configuration:
 *    const searchConfig = [
 *      { id: 'name', label: 'Name', type: 'text', placeholder: 'Search by name...' },
 *      { id: 'status', label: 'Status', type: 'select', options: [...] }
 *    ];
 * 
 * 3. Define your table columns:
 *    const columns = [
 *      { key: 'name', label: 'Name', sortable: true },
 *      { key: 'status', label: 'Status', sortable: true }
 *    ];
 * 
 * 4. Use the components:
 *    <SearchableDataTable
 *      data={yourData}
 *      columns={columns}
 *      searchConfig={searchConfig}
 *      onSearch={handleSearch}
 *      loading={loading}
 *    />
 * 
 * 5. Handle search in your component:
 *    const handleSearch = (searchConditions) => {
 *      // Build query from searchConditions
 *      // Make API call
 *      // Update data
 *    };
 */

export default {
  CustomerSearchExample,
  UserSearchExample,
  StandaloneSearchExample
};

