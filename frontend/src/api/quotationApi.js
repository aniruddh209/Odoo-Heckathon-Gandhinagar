import { apiClient } from './apiClient';

export const quotationApi = {
  getQuotations: async ({ salesRepId, status } = {}) => {
    const params = new URLSearchParams();
    if (salesRepId !== undefined && salesRepId !== null) params.append('salesRepId', salesRepId);
    if (status) params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`quotations${queryString}`);
  },

  getQuotationById: async (id) => {
    return apiClient.get(`quotations/${id}`);
  },

  createQuotation: async (data) => {
    return apiClient.post('quotations', data);
  },

  updateQuotation: async (id, data) => {
    return apiClient.put(`quotations/${id}`, data);
  },

  addLineItem: async (quotationId, lineData) => {
    return apiClient.post(`quotations/${quotationId}/lines`, lineData);
  },

  updateLineItem: async (quotationId, lineId, lineData) => {
    return apiClient.put(`quotations/${quotationId}/lines/${lineId}`, lineData);
  },

  removeLineItem: async (quotationId, lineId) => {
    return apiClient.delete(`quotations/${quotationId}/lines/${lineId}`);
  },

  recalculate: async (id) => {
    return apiClient.post(`quotations/${id}/recalculate`);
  },

  submitForApproval: async (id) => {
    return apiClient.post(`quotations/${id}/submit-approval`);
  },

  getRecommendations: async (id) => {
    return apiClient.get(`quotations/${id}/recommendations`);
  },

  generatePortalLink: async (id) => {
    return apiClient.post(`quotations/${id}/generate-portal-link`);
  },

  convertToOrder: async (id) => {
    return apiClient.post(`quotations/${id}/convert-to-order`);
  },
};

export default quotationApi;
