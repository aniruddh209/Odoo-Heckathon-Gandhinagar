import { apiClient, setStoredAuth, clearStoredAuth } from './apiClient';

export const authApi = {
  login: async (credentials) => {
    const data = await apiClient.post('auth/login', credentials);
    if (data?.accessToken) {
      setStoredAuth(data.accessToken, data.user);
    }
    return data;
  },

  signup: async (userData) => {
    const data = await apiClient.post('auth/register', userData);
    if (data?.accessToken) {
      setStoredAuth(data.accessToken, data.user);
    }
    return data;
  },

  refreshToken: async (refreshToken) => {
    const data = await apiClient.post('auth/refresh-token', JSON.stringify(refreshToken));
    if (data?.accessToken) {
      setStoredAuth(data.accessToken, data.user);
    }
    return data;
  },

  getMe: async () => {
    return apiClient.get('auth/me');
  },

  changePassword: async (passwordData) => {
    return apiClient.post('auth/change-password', passwordData);
  },

  logout: () => {
    clearStoredAuth();
  },
};

export default authApi;
