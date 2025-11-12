import api from './api';

// Customer Management Service
export const customerService = {
  // Get all customers with hierarchy
  async getCustomers() {
    try {
      const response = await api.get('/api/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Get customer hierarchy tree
  async getCustomerHierarchy(customerId = null) {
    try {
      const url = customerId 
        ? `/api/customers/hierarchy/${customerId}`
        : '/api/customers/hierarchy';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer hierarchy:', error);
      throw error;
    }
  },

  // Get customer details
  async getCustomer(customerId) {
    try {
      const response = await api.get(`/api/customers/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  // Create new customer
  async createCustomer(customerData) {
    try {
      const response = await api.post('/api/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(customerId, customerData) {
    try {
      const response = await api.put(`/api/customers/${customerId}`, customerData);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(customerId) {
    try {
      const response = await api.delete(`/api/customers/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Get customer locations/properties
  async getCustomerLocations(customerId) {
    try {
      const response = await api.get(`/api/customers/${customerId}/locations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer locations:', error);
      throw error;
    }
  },

  // Get customer memberships
  async getCustomerMemberships(customerId) {
    try {
      const response = await api.get(`/api/customers/${customerId}/memberships`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer memberships:', error);
      throw error;
    }
  },

  // Get customer descendants (children and grandchildren)
  async getCustomerDescendants(customerId) {
    try {
      const response = await api.get(`/api/customers/${customerId}/descendants`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer descendants:', error);
      throw error;
    }
  },

  // Get customer ancestors (parents and grandparents)
  async getCustomerAncestors(customerId) {
    try {
      const response = await api.get(`/api/customers/${customerId}/ancestors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer ancestors:', error);
      throw error;
    }
  },

  // Search customers
  async searchCustomers(query, filters = {}) {
    try {
      const params = new URLSearchParams({ q: query, ...filters });
      const response = await api.get(`/api/customers/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },

  // Get customer statistics
  async getCustomerStats(customerId) {
    try {
      const response = await api.get(`/api/customers/${customerId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }
};

// Legacy organization service for backward compatibility
export const organizationService = {
  async getOrganizations() {
    try {
      const response = await api.get('/api/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }
};

export default customerService;
