import { apiClient } from './apiClient.js';

export const reportApi = {
  getSalesSummary: () => apiClient.get('/reports/sales-summary'),
  getRevenueAnalytics: () => apiClient.get('/reports/sales-summary'),
  getPipelineVelocity: (dateRange) => apiClient.get('/reports/pipeline-velocity'),
  getMarginLeakage: (dateRange) => apiClient.get('/reports/margin-leakage'),
  getDiscountCompliance: (dateRange) => apiClient.get('/reports/discount-compliance'),
  getFulfillmentSla: (dateRange) => apiClient.get('/reports/fulfillment-sla'),

  getRepPerformance: () => apiClient.get('/reports/sales-reps'),

  getQuotationsReport: (period, teamId) => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (teamId) params.append('teamId', teamId.toString());
    const query = params.toString();
    return apiClient.get(`/reports/quotations${query ? `?${query}` : ''}`);
  },

  getProductsReport: () => apiClient.get('/reports/products'),
  getDiscountsReport: () => apiClient.get('/reports/discounts'),
  getFulfillmentReport: () => apiClient.get('/reports/fulfillment'),
  getBillingReport: () => apiClient.get('/reports/billing'),

  exportPdfUrl: (reportType, period) => {
    return `/api/reports/export/pdf?reportType=${encodeURIComponent(reportType)}${period ? `&period=${encodeURIComponent(period)}` : ''}`;
  },

  exportXlsUrl: (reportType, period) => {
    return `/api/reports/export/xls?reportType=${encodeURIComponent(reportType)}${period ? `&period=${encodeURIComponent(period)}` : ''}`;
  },
};
