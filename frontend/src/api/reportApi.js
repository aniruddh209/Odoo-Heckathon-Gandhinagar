import { apiClient } from './apiClient';

export const reportApi = {
  getDashboardMetrics: async (salesRepId = null) => {
    const query = salesRepId ? `?salesRepId=${encodeURIComponent(salesRepId)}` : '';
    return apiClient.get(`reports/dashboard${query}`);
  },

  getPipelineOverview: async () => {
    return apiClient.get('reports/pipeline');
  },
};

export default reportApi;
