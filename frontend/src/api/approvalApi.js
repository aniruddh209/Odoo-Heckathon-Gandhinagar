import { apiClient } from './apiClient';

export const approvalApi = {
  getPendingApprovals: async (level = null) => {
    const query = level ? `?level=${encodeURIComponent(level)}` : '';
    return apiClient.get(`approvals/pending${query}`);
  },

  getApprovalById: async (id) => {
    return apiClient.get(`approvals/${id}`);
  },

  actionApproval: async (id, { action, reason }) => {
    return apiClient.post(`approvals/${id}/action`, { action, reason });
  },

  actionQuotationApproval: async (quotationId, { action, reason }) => {
    return apiClient.post(`approvals/quotation/${quotationId}/action`, { action, reason });
  },
};

export default approvalApi;

