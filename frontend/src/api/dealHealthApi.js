import { apiClient } from './apiClient';

export const dealHealthApi = {
  getDealHealthSummary: async () => {
    return apiClient.get('dealhealth/summary');
  },
};

export default dealHealthApi;
