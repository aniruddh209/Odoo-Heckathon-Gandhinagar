import { apiClient } from './apiClient.js';

export const portalApi = {
  login: (data) =>
    apiClient.post('/auth/login', data),

  getQuoteByToken: (token) =>
    apiClient.get(`/portal/quote/${token}`),

  submitLineComment: (token, lineId, comment) =>
    apiClient.post(`/portal/quote/${token}/lines/${lineId}/comment`, typeof comment === 'string' ? comment : (comment?.Comment || comment?.commentText || '')),

  submitCounterOffer: (token, data) =>
    apiClient.post(`/portal/quote/${token}/counter-offer`, {
      lineId: Number(data?.lineId || data?.LineId || 0),
      proposedDiscountPercent: Number(data?.proposedDiscountPercent || data?.RequestedDiscountPercentage || data?.counterDiscountPercent || 0),
      reason: data?.reason || data?.Reason || data?.Notes || data?.remarks || '',
    }),

  // Customer Portal Endpoints (Authenticated Customer Role)
  getMyQuotations: () => apiClient.get('/customers/me/quotations'),
  getMyOrders: () => apiClient.get('/customers/me/orders'),
  getMyInvoices: () => apiClient.get('/customers/me/invoices'),

  // Fallback aliases for existing components
  getQuotations: () => apiClient.get('/customers/me/quotations'),
  getCustomerQuotations: () => apiClient.get('/customers/me/quotations'),
  getQuotation: (tokenOrId) => apiClient.get(`/portal/quote/${tokenOrId}`),
  getQuotationById: (tokenOrId) => apiClient.get(`/portal/quote/${tokenOrId}`),
  getCustomerQuotationById: (tokenOrId) => apiClient.get(`/portal/quote/${tokenOrId}`),
  addLineComment: (lineId, data) =>
    apiClient.post(`/portal/quote/${data.token || 'token'}/lines/${lineId}/comment`, data.Comment || data.commentText || ''),
  requestCounterDiscount: (quotationId, data) =>
    apiClient.post(`/portal/quote/${data.token || quotationId}/counter-offer`, {
      lineId: Number(data.LineId || data.lineId || 0),
      proposedDiscountPercent: Number(data.RequestedDiscountPercentage || data.counterDiscountPercent || 0),
      reason: data.Notes || data.remarks || '',
    }),
  confirmQuotation: (tokenOrId, data) =>
    apiClient.post(`/portal/quote/${tokenOrId}/counter-offer`, {
      lineId: 0,
      proposedDiscountPercent: 0,
      reason: data?.notes || 'Confirmed by customer',
    }),
};

