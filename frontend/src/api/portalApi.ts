import { apiClient } from './client';
import type {
  CustomerConfirmRequest,
  CustomerCounterDiscountRequest,
  CustomerLineRequest,
  CustomerQuoteDto,
  LineCommentDto,
} from '@/types/portal';

export interface PortalAuthResponse {
  token: string;
  customerName: string;
  email: string;
}

export const portalApi = {
  login: (data: { email: string; magicLinkToken?: string }) =>
    apiClient.post<PortalAuthResponse>('/portal/auth/login', data),

  requestMagicLink: (email: string) =>
    apiClient.post<{ message: string }>('/portal/auth/magic-link', { email }),

  getQuotations: () => apiClient.get<CustomerQuoteDto[]>('/portal/quotations'),

  getQuotation: (id: number | string) => apiClient.get<CustomerQuoteDto>(`/portal/quotations/${id}`),
  getQuotationById: (id: number | string) => apiClient.get<CustomerQuoteDto>(`/portal/quotations/${id}`),

  addLineRequest: (quotationId: number | string, data: CustomerLineRequest) =>
    apiClient.post<LineCommentDto>(`/portal/quotations/${quotationId}/line-requests`, data),

  addLineComment: (lineId: number | string, data: { Comment: string }) =>
    apiClient.post<LineCommentDto>(`/portal/quotation-lines/${lineId}/comments`, {
      commentText: data.Comment,
    }),

  getLineComments: (lineId: number | string) =>
    apiClient.get<LineCommentDto[]>(`/portal/quotation-lines/${lineId}/comments`),

  counterDiscount: (quotationId: number | string, data: CustomerCounterDiscountRequest) =>
    apiClient.post<{ status: string; message: string }>(
      `/portal/quotations/${quotationId}/counter-discount`,
      data
    ),

  requestCounterDiscount: (quotationId: number | string, data: any) =>
    apiClient.post<{ status: string; message: string }>(
      `/portal/quotations/${quotationId}/counter-discount`,
      {
        counterDiscountPercent: data.RequestedDiscountPercentage ?? data.counterDiscountPercent ?? 5,
        remarks: data.Notes ?? data.remarks ?? '',
      }
    ),

  confirmQuotation: (quotationId: number | string, data: any) =>
    apiClient.post<{ orderNumber: string; message: string }>(
      `/portal/quotations/${quotationId}/confirm`,
      {
        acceptanceConsent: true,
        notes: data.Signature ? `Signed by: ${data.Signature}. PO: ${data.PoNumber || 'N/A'}` : data.notes,
      }
    ),

  getQuotationHistory: (quotationId: number | string) =>
    apiClient.get<any[]>(`/portal/quotations/${quotationId}/history`),
};
