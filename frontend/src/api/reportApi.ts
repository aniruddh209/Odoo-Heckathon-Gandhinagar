import { apiClient } from './client';

export interface SalesSummaryReportDto {
  totalPipelineValue?: number;
  totalWonValue?: number;
  winRatePercent?: number;
  averageDiscountPercent?: number;
  totalQuotesCount?: number;
  activeApprovalsCount?: number;
  stalledQuotesCount?: number;
  TotalRevenue?: number;
  AverageMarginPercent?: number;
  TotalDiscountGranted?: number;
  WinRatePercent?: number;
}

export const reportApi = {
  getSalesSummary: () => apiClient.get<SalesSummaryReportDto>('/reports/sales-summary'),
  getRevenueAnalytics: () => apiClient.get<SalesSummaryReportDto>('/reports/sales-summary'),

  getRepPerformance: () => apiClient.get<any[]>('/reports/sales-reps'),

  getQuotationsReport: (period?: string, teamId?: number) => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (teamId) params.append('teamId', teamId.toString());
    const query = params.toString();
    return apiClient.get<any[]>(`/reports/quotations${query ? `?${query}` : ''}`);
  },

  getProductsReport: () => apiClient.get<any[]>('/reports/products'),
  getDiscountsReport: () => apiClient.get<any[]>('/reports/discounts'),
  getFulfillmentReport: () => apiClient.get<any[]>('/reports/fulfillment'),
  getBillingReport: () => apiClient.get<any[]>('/reports/billing'),

  exportPdfUrl: (reportType: string, period?: string) => {
    return `/api/reports/export/pdf?reportType=${encodeURIComponent(reportType)}${period ? `&period=${encodeURIComponent(period)}` : ''}`;
  },

  exportXlsUrl: (reportType: string, period?: string) => {
    return `/api/reports/export/xls?reportType=${encodeURIComponent(reportType)}${period ? `&period=${encodeURIComponent(period)}` : ''}`;
  },
};
