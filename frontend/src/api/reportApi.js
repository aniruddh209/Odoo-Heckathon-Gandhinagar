import { apiClient, getStoredToken } from './apiClient';

export const reportApi = {
  getDashboardMetrics: async (salesRepId = null) => {
    const query = salesRepId ? `?salesRepId=${encodeURIComponent(salesRepId)}` : '';
    return apiClient.get(`reports/dashboard${query}`);
  },

  getPipelineOverview: async () => {
    return apiClient.get('reports/pipeline');
  },

  downloadXls: async () => {
    const token = getStoredToken();
    const res = await fetch('/api/reports/export/xls', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to export XLS report');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DealFlow360_SalesReport_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  downloadPdf: async () => {
    const token = getStoredToken();
    const res = await fetch('/api/reports/export/pdf', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to export PDF report');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DealFlow360_SalesReport_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};

export default reportApi;
