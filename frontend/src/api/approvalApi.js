import { apiClient } from './apiClient.js';

export const approvalApi = {
  getPendingApprovals: (level) => {
    const query = level ? `?level=${encodeURIComponent(level)}` : '';
    return apiClient.get(`/approvals/pending${query}`);
  },

  getApprovalById: (id) => apiClient.get(`/approvals/${id}`),

  recordDecision: (id, data) => {
    let action = 'Approve';
    const rawAction = (data?.Action || data?.action || '').toLowerCase();
    if (rawAction.includes('reject')) {
      action = 'Reject';
    } else if (rawAction.includes('return') || rawAction.includes('revis')) {
      action = 'RequestRevision';
    } else {
      action = 'Approve';
    }

    const reason = data?.Remarks || data?.remarks || data?.Comments || data?.comments || data?.Reason || data?.reason || '';
    return apiClient.post(`/approvals/${id}/action`, {
      action,
      reason,
    });
  },

  approve: (id, data) =>
    apiClient.post(`/approvals/${id}/action`, {
      action: 'Approve',
      reason: data?.remarks || data?.reason || data?.Comments || '',
    }),

  reject: (id, data) =>
    apiClient.post(`/approvals/${id}/action`, {
      action: 'Reject',
      reason: data?.remarks || data?.reason || data?.Comments || '',
    }),

  returnForRevision: (id, data) =>
    apiClient.post(`/approvals/${id}/action`, {
      action: 'RequestRevision',
      reason: data?.remarks || data?.reason || data?.Comments || '',
    }),

  requestRevision: (id, data) =>
    apiClient.post(`/approvals/${id}/action`, {
      action: 'RequestRevision',
      reason: data?.remarks || data?.reason || data?.Comments || '',
    }),

  getApprovalHistory: (id) => apiClient.get(`/approvals/${id}`),
};

