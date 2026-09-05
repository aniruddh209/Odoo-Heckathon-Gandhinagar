import { apiClient } from './client';
import type { DealAlertDto, DealHealthSummaryDto, RepAnomalyDto } from '@/types/health';

export const healthApi = {
  getDealHealthSummary: () => apiClient.get<DealHealthSummaryDto>('/dashboard/deal-health'),

  getAlerts: (severity?: string, type?: string) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (type) params.append('type', type);
    const query = params.toString();
    return apiClient.get<DealAlertDto[]>(`/deal-health/alerts${query ? `?${query}` : ''}`);
  },
  getDealAlerts: (severity?: string, type?: string) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (type) params.append('type', type);
    const query = params.toString();
    return apiClient.get<DealAlertDto[]>(`/deal-health/alerts${query ? `?${query}` : ''}`);
  },

  getRepAnomalies: () => apiClient.get<RepAnomalyDto[]>('/deal-health/anomalies'),

  getQuotationHealth: (quotationId: number | string) =>
    apiClient.get<{ healthScore: number; daysInactive: number; flags: string[] }>(
      `/quotations/${quotationId}/health`
    ),

  nudgeRep: (alertId: number | string, notes?: string) =>
    apiClient.post<{ message: string }>(`/deal-health/alerts/${alertId}/nudge`, { notes }),

  escalateAlert: (alertId: number | string, justification: string) =>
    apiClient.post<{ message: string }>(`/deal-health/alerts/${alertId}/escalate`, { justification }),
};
