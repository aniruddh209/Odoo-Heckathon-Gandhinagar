import { apiClient } from './apiClient.js';

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  signup: (data) => apiClient.post('/auth/register', data),
  register: (data) => apiClient.post('/auth/register', data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh-token', typeof refreshToken === 'string' ? refreshToken : (refreshToken?.refreshToken || '')),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh-token', typeof refreshToken === 'string' ? refreshToken : (refreshToken?.refreshToken || '')),
  me: () => apiClient.get('/auth/me'),
  getUsers: () => apiClient.get('/admin/users'),
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),
};

