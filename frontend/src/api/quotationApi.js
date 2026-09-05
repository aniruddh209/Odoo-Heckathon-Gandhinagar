import { apiClient } from './apiClient.js';

export const quotationApi = {
  getQuotations: async (paramsOrStatus, ownerId, customerId) => {
    const params = new URLSearchParams();
    if (typeof paramsOrStatus === 'string') {
      if (paramsOrStatus) params.append('status', paramsOrStatus);
      if (ownerId) params.append('salesRepId', ownerId.toString());
      if (customerId) params.append('customerId', customerId.toString());
    } else if (paramsOrStatus && typeof paramsOrStatus === 'object') {
      if (paramsOrStatus.Status) params.append('status', paramsOrStatus.Status);
      if (paramsOrStatus.status) params.append('status', paramsOrStatus.status);
      if (paramsOrStatus.salesRepId) params.append('salesRepId', paramsOrStatus.salesRepId.toString());
      if (paramsOrStatus.ownerId) params.append('salesRepId', paramsOrStatus.ownerId.toString());
      if (paramsOrStatus.customerId) params.append('customerId', paramsOrStatus.customerId.toString());
    }
    const query = params.toString();
    const result = await apiClient.get(`/quotations${query ? `?${query}` : ''}`);
    if (Array.isArray(result)) {
      return {
        Items: result,
        TotalCount: result.length,
        PageNumber: 1,
        PageSize: result.length,
        TotalPages: 1,
      };
    }
    if (result && result.items) {
      return {
        Items: result.items,
        TotalCount: result.totalCount ?? result.items.length,
        PageNumber: result.pageNumber ?? 1,
        PageSize: result.pageSize ?? 10,
        TotalPages: result.totalPages ?? 1,
      };
    }
    return result;
  },

  getPipeline: () => apiClient.get('/reports/pipeline'),
  createQuotation: (data) => apiClient.post('/quotations', data),
  getQuotation: (id) => apiClient.get(`/quotations/${id}`),
  getQuotationById: (id) => apiClient.get(`/quotations/${id}`),
  updateQuotation: (id, data) => apiClient.put(`/quotations/${id}`, data),

  addQuotationLine: (quotationId, data) => apiClient.post(`/quotations/${quotationId}/lines`, data),
  addLine: (quotationId, data) => apiClient.post(`/quotations/${quotationId}/lines`, data),

  updateQuotationLine: (quotationId, lineId, data) =>
    apiClient.put(`/quotations/${quotationId}/lines/${lineId}`, data),
  updateLine: (quotationId, lineId, data) =>
    apiClient.put(`/quotations/${quotationId}/lines/${lineId}`, data),

  deleteQuotationLine: (quotationId, lineId) =>
    apiClient.delete(`/quotations/${quotationId}/lines/${lineId}`),
  deleteLine: (quotationId, lineId) =>
    apiClient.delete(`/quotations/${quotationId}/lines/${lineId}`),

  recalculatePricing: (id) => apiClient.post(`/quotations/${id}/recalculate`),
  recalculate: (id) => apiClient.post(`/quotations/${id}/recalculate`),

  getUpsellRecommendations: (id) => apiClient.get(`/quotations/${id}/recommendations`),
  getRecommendations: (id) => apiClient.get(`/quotations/${id}/recommendations`),

  submitForApproval: (id) => apiClient.post(`/quotations/${id}/submit-approval`),
  submitQuotation: (id) => apiClient.post(`/quotations/${id}/submit-approval`),

  sendToCustomer: (id) => apiClient.post(`/quotations/${id}/generate-portal-link`),
  sendToPortal: (id) => apiClient.post(`/quotations/${id}/generate-portal-link`),
  generatePortalLink: (id) => apiClient.post(`/quotations/${id}/generate-portal-link`),

  convertToOrder: (id) => apiClient.post(`/quotations/${id}/convert-to-order`),
  confirmOrder: (id) => apiClient.post(`/quotations/${id}/convert-to-order`),

  deleteQuotation: (id) => apiClient.delete(`/quotations/${id}`),
};

