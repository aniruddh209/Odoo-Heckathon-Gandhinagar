import { apiClient } from './apiClient.js';

export const portalApi = {
  login: (data) =>
    apiClient.post('/portal/auth/login', data),

  requestMagicLink: (email) =>
    apiClient.post('/portal/auth/magic-link', { email }),

  getQuotations: () => apiClient.get('/portal/quotations'),
  getCustomerQuotations: () => apiClient.get('/portal/quotations'),

  getQuotation: (id) => apiClient.get(`/portal/quotations/${id}`),
  getQuotationById: (id) => apiClient.get(`/portal/quotations/${id}`),
  getCustomerQuotationById: (id) => apiClient.get(`/portal/quotations/${id}`),

  addLineRequest: (quotationId, data) =>
    apiClient.post(`/portal/quotations/${quotationId}/line-requests`, data),

  addLineComment: (lineId, data) =>
    apiClient.post(`/portal/quotation-lines/${lineId}/comments`, {
      commentText: data.Comment || data.commentText,
    }),

  getLineComments: (lineId) =>
    apiClient.get(`/portal/quotation-lines/${lineId}/comments`),

  counterDiscount: (quotationId, data) =>
    apiClient.post(`/portal/quotations/${quotationId}/counter-discount`, data),

  requestCounterDiscount: (quotationId, data) =>
    apiClient.post(`/portal/quotations/${quotationId}/counter-discount`, {
      counterDiscountPercent: data.RequestedDiscountPercentage ?? data.counterDiscountPercent ?? 5,
      remarks: data.Notes ?? data.remarks ?? '',
    }),
  submitCounterDiscount: (quotationId, data) =>
    apiClient.post(`/portal/quotations/${quotationId}/counter-discount`, data),

  confirmQuotation: (quotationId, data) =>
    apiClient.post(`/portal/quotations/${quotationId}/confirm`, {
      acceptanceConsent: true,
      notes: data.Signature ? `Signed by: ${data.Signature}. PO: ${data.PoNumber || 'N/A'}` : data.notes,
    }),
  acceptQuotation: (quotationId, data) =>
    apiClient.post(`/portal/quotations/${quotationId}/confirm`, data),

  updateSplitDeliveryConsent: (quotationId, consent) =>
    apiClient.post(`/portal/quotations/${quotationId}/split-delivery-consent`, { consent }),

  downloadQuotationPdf: (quotationId) =>
    apiClient.get(`/portal/quotations/${quotationId}/pdf`),

  getQuotationHistory: (quotationId) =>
    apiClient.get(`/portal/quotations/${quotationId}/history`),
};
