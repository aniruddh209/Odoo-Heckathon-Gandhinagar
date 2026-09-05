import { apiClient } from './client';
import type { ApprovalActionDto, ApprovalDecisionRequest, ApprovalRequestDto } from '@/types/approval';

export const approvalApi = {
  getPendingApprovals: () => apiClient.get<ApprovalRequestDto[]>('/approvals/pending'),

  getApprovalById: (id: number | string) => apiClient.get<ApprovalRequestDto>(`/approvals/${id}`),

  approve: (id: number | string, data: ApprovalDecisionRequest) =>
    apiClient.post<{ message: string; nextStep?: string }>(`/approvals/${id}/approve`, data),

  reject: (id: number | string, data: ApprovalDecisionRequest) =>
    apiClient.post<{ message: string }>(`/approvals/${id}/reject`, data),

  returnForRevision: (id: number | string, data: ApprovalDecisionRequest) =>
    apiClient.post<{ message: string }>(`/approvals/${id}/return`, data),

  recordDecision: (id: number | string, data: { Action: 'Approve' | 'Reject' | string; Comments?: string; remarks?: string }) => {
    const payload = { remarks: data.Comments || data.remarks || '' };
    if (data.Action === 'Approve') {
      return apiClient.post<{ message: string; nextStep?: string }>(`/approvals/${id}/approve`, payload);
    } else {
      return apiClient.post<{ message: string }>(`/approvals/${id}/reject`, payload);
    }
  },

  getApprovalHistory: (quotationId: number | string) =>
    apiClient.get<ApprovalActionDto[]>(`/quotations/${quotationId}/approval-history`),
};
