import { apiClient } from './apiClient.js';

export const approvalApi = {
  getPendingApprovals: () => apiClient.get('/approvals/pending'),
  getApprovalById: (id) => apiClient.get(`/approvals/${id}`),

  approve: (id, data) =>
    apiClient.post(`/approvals/${id}/approve`, data),

  reject: (id, data) =>
    apiClient.post(`/approvals/${id}/reject`, data),

  returnForRevision: (id, data) =>
    apiClient.post(`/approvals/${id}/return`, data),

  requestRevision: (id, data) =>
    apiClient.post(`/approvals/${id}/return`, data),

  recordDecision: (id, data) => {
    const payload = { remarks: data.Comments || data.remarks || '' };
    if (data.Action === 'Approve') {
      return apiClient.post(`/approvals/${id}/approve`, payload);
    } else {
      return apiClient.post(`/approvals/${id}/reject`, payload);
    }
  },

  getApprovalHistory: (quotationId) =>
    apiClient.get(`/quotations/${quotationId}/approval-history`),
};
