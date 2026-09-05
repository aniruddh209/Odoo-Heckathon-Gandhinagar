import { apiClient } from './apiClient';

export const userApi = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.salesTeamId) query.append('salesTeamId', params.salesTeamId);
    if (params.isActive !== undefined) query.append('isActive', params.isActive);
    const qs = query.toString();
    return apiClient.get(qs ? `users?${qs}` : 'users');
  },

  getUserById: async (id) => {
    return apiClient.get(`users/${id}`);
  },

  createUser: async (userData) => {
    return apiClient.post('users', userData);
  },

  updateUser: async (id, userData) => {
    return apiClient.put(`users/${id}`, userData);
  },

  toggleStatus: async (id) => {
    return apiClient.post(`users/${id}/toggle-status`);
  },
};

export default userApi;
