import { apiClient } from './apiClient.js';

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  signup: (data) => apiClient.post('/auth/signup', data),
  refresh: (data) => apiClient.post('/auth/refresh', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  getUsers: () => apiClient.get('/users'),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  updateUserStatus: (id, isActive) => apiClient.patch(`/users/${id}/status`, { isActive }),
};
