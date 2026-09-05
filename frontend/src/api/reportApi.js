import { apiClient } from './apiClient.js';

export const reportApi = {
  getDashboardMetrics: (salesRepId) => {
    const query = salesRepId ? `?salesRepId=${encodeURIComponent(salesRepId)}` : '';
    return apiClient.get(`/reports/dashboard${query}`);
  },

  getPipelineOverview: () => apiClient.get('/reports/pipeline'),

  // Aliases for dashboard and analytics views
  getSalesSummary: (salesRepId) => {
    const query = salesRepId ? `?salesRepId=${encodeURIComponent(salesRepId)}` : '';
    return apiClient.get(`/reports/dashboard${query}`);
  },
  getRevenueAnalytics: () => apiClient.get('/reports/dashboard'),
  getPipelineVelocity: () => apiClient.get('/reports/pipeline'),
};

