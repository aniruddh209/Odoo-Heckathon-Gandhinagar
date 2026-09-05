import { apiClient } from './apiClient.js';

export const healthApi = {
  getDealHealthSummary: () => apiClient.get('/dealhealth/summary'),

  getAlerts: () => apiClient.get('/dealhealth/summary'),
  getDealAlerts: () => apiClient.get('/dealhealth/summary'),

  getStalledDeals: () => apiClient.get('/dealhealth/summary'),

  getRepAnomalies: () => apiClient.get('/dealhealth/summary'),
  getDeliverySlippages: () => apiClient.get('/dealhealth/summary'),

  getQuotationHealth: (quotationId) =>
    apiClient.get(`/quotations/${quotationId}`),
};

