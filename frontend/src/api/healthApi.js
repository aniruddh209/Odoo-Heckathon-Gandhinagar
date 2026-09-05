import { apiClient } from './apiClient.js';

export const healthApi = {
  getDealHealthSummary: () => apiClient.get('/dashboard/deal-health'),

  getAlerts: (severity, type) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (type) params.append('type', type);
    const query = params.toString();
    return apiClient.get(`/deal-health/alerts${query ? `?${query}` : ''}`);
  },
  getDealAlerts: (severity, type) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (type) params.append('type', type);
    const query = params.toString();
    return apiClient.get(`/deal-health/alerts${query ? `?${query}` : ''}`);
  },

  getStalledDeals: (daysThreshold) => {
    const params = new URLSearchParams();
    if (daysThreshold) params.append('daysThreshold', daysThreshold.toString());
    const query = params.toString();
    return apiClient.get(`/deal-health/stalled-deals${query ? `?${query}` : ''}`);
  },

  getRepAnomalies: () => apiClient.get('/deal-health/anomalies'),
  getDeliverySlippages: () => apiClient.get('/deal-health/delivery-slippages'),

  getQuotationHealth: (quotationId) =>
    apiClient.get(`/quotations/${quotationId}/health`),

  nudgeRep: (alertId, notes) =>
    apiClient.post(`/deal-health/alerts/${alertId}/nudge`, { notes }),

  escalateAlert: (alertId, justification) =>
    apiClient.post(`/deal-health/alerts/${alertId}/escalate`, { justification }),
};
