import api from './api';

// Invitation Management Service
export const invitationService = {
  // Send invitation (NO customer assignment at this time)
  async sendInvitation(invitationData) {
    try {
      const response = await api.post('/api/invitations/send', {
        invitee_email: invitationData.email,
        target_role_key: invitationData.roleKey,
        target_customer_ids: invitationData.customerIds || [], // Optional, for reference only
        property_id: invitationData.propertyId || null,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  },

  // Get available roles for invitation (based on current user's permissions)
  async getAvailableRoles() {
    try {
      const response = await api.get('/api/invitations/available-roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching available roles:', error);
      throw error;
    }
  },

  // Get available customers for invitation
  async getAvailableCustomers() {
    try {
      const response = await api.get('/api/invitations/available-customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching available customers:', error);
      throw error;
    }
  },

  // Get pending invitations
  async getPendingInvitations(page = 1, limit = 50) {
    try {
      const response = await api.get(`/api/invitations/pending?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  },

  // Get invitation details
  async getInvitation(invitationId) {
    try {
      const response = await api.get(`/api/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  },

  // Get invitation by token (public)
  async getInvitationByToken(token) {
    try {
      const response = await api.get(`/api/invitations/token/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invitation by token:', error);
      throw error;
    }
  },

  // Revoke invitation
  async revokeInvitation(invitationId) {
    try {
      const response = await api.put(`/api/invitations/${invitationId}/revoke`);
      return response.data;
    } catch (error) {
      console.error('Error revoking invitation:', error);
      throw error;
    }
  },

  // Accept invitation (public)
  async acceptInvitation(token, userData) {
    try {
      const response = await api.post(`/api/invitations/accept/${token}`, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        password: userData.password,
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  // POST-INVITE CUSTOMER ASSIGNMENT (Admin Only)
  
  // Get invitations that need customer assignment
  async getInvitationsNeedingCustomerAssignment() {
    try {
      const response = await api.get('/api/invitations/needing-customer-assignment');
      return response.data;
    } catch (error) {
      console.error('Error fetching invitations needing customer assignment:', error);
      throw error;
    }
  },

  // Assign customer to invitation (Super Admin or GM only)
  async assignCustomerToInvitation(invitationId, customerId) {
    try {
      const response = await api.post('/api/invitations/assign-customer', {
        invitation_id: invitationId,
        customer_id: customerId,
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning customer to invitation:', error);
      throw error;
    }
  },

  // MEMBERSHIP MANAGEMENT (Post-Invitation)

  // Assign membership to user (direct assignment)
  async assignMembership(membershipData) {
    try {
      const response = await api.post('/api/invitations/assign-membership', {
        user_id: membershipData.userId,
        customer_id: membershipData.customerId,
        role_key: membershipData.roleKey,
        property_id: membershipData.propertyId || null,
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning membership:', error);
      throw error;
    }
  },

  // Remove membership from user
  async removeMembership(membershipData) {
    try {
      const response = await api.delete('/api/invitations/remove-membership', {
        data: {
          user_id: membershipData.userId,
          customer_id: membershipData.customerId,
          role_key: membershipData.roleKey,
          property_id: membershipData.propertyId || null,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error removing membership:', error);
      throw error;
    }
  },
};

export default invitationService;

