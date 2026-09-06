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

  addLineComment: async (quotationId, lineId, comment) => {
    return apiClient.post(`quotations/${quotationId}/lines/${lineId}/comments`, { comment });
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

  previewRecommendations: async (data) => {
    return apiClient.post('quotations/recommendations/preview', data);
  },

  addRecommendation: async (quotationId, productId) => {
    return apiClient.post(`quotations/${quotationId}/recommendations/${productId}/add`);
  },

  dismissRecommendation: async (quotationId, productId) => {
    return apiClient.post(`quotations/${quotationId}/recommendations/${productId}/dismiss`);
  },

  generatePortalLink: async (id) => {
    return apiClient.post(`quotations/${id}/generate-portal-link`);
  },

  convertToOrder: async (id) => {
    return apiClient.post(`quotations/${id}/convert-to-order`);
  },

  negotiateLinePrice: async (quotationId, lineId, data) => {
    return apiClient.post(`quotations/${quotationId}/lines/${lineId}/negotiate`, data);
  },

  negotiateDeal: async (quotationId, data) => {
    return apiClient.post(`quotations/${quotationId}/negotiate`, data);
  },

  sendQuotation: async (quotationId, data = {}) => {
    return apiClient.post(`quotations/${quotationId}/send`, data);
  },

  acceptCounterOffer: async (quotationId, data = {}) => {
    return apiClient.post(`quotations/${quotationId}/negotiate/accept`, data);
  },

  rejectCounterOffer: async (quotationId, data = {}) => {
    return apiClient.post(`quotations/${quotationId}/negotiate/reject`, data);
  },

  disqualifyQuotation: async (quotationId, data = {}) => {
    return apiClient.post(`quotations/${quotationId}/disqualify`, data);
  },
};

export default quotationApi;
