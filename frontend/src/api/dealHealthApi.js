import { apiClient } from './apiClient';

export const dealHealthApi = {
  getDealHealthSummary: async () => {
    return apiClient.get('dealhealth/summary');
  },
  nudgeRep: async (quotationId, data = {}) => {
    return apiClient.post(`dealhealth/alerts/${quotationId}/nudge`, data);
  },
  escalateDeal: async (quotationId, data = {}) => {
    return apiClient.post(`dealhealth/alerts/${quotationId}/escalate`, data);
  },
};

export default dealHealthApi;
