import { apiClient } from './client';
import type {
  AddQuotationLineRequest,
  CreateQuotationRequest,
  QuotationDto,
  QuotationLineDto,
  QuotationStatus,
  RecalculateResultDto,
  UpdateQuotationLineRequest,
  UpdateQuotationRequest,
  UpsellRecommendationDto,
} from '../types/quotation';

export interface PipelineStageDto {
  stage: QuotationStatus;
  title: string;
  totalValue: number;
  quotations: QuotationDto[];
}

export interface GetQuotationsParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  Status?: QuotationStatus | string;
  status?: string;
  ownerId?: number | string;
  customerId?: number | string;
}

export interface PaginatedQuotationsResponse {
  Items: QuotationDto[];
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}

export const quotationApi = {
  getQuotations: async (paramsOrStatus?: GetQuotationsParams | string, ownerId?: number, customerId?: number) => {
    const params = new URLSearchParams();
    if (typeof paramsOrStatus === 'string') {
      if (paramsOrStatus) params.append('status', paramsOrStatus);
      if (ownerId) params.append('ownerId', ownerId.toString());
      if (customerId) params.append('customerId', customerId.toString());
    } else if (paramsOrStatus && typeof paramsOrStatus === 'object') {
      if (paramsOrStatus.Status) params.append('status', paramsOrStatus.Status);
      if (paramsOrStatus.status) params.append('status', paramsOrStatus.status);
      if (paramsOrStatus.SearchTerm) params.append('search', paramsOrStatus.SearchTerm);
      if (paramsOrStatus.PageNumber) params.append('pageNumber', paramsOrStatus.PageNumber.toString());
      if (paramsOrStatus.PageSize) params.append('pageSize', paramsOrStatus.PageSize.toString());
      if (paramsOrStatus.ownerId) params.append('ownerId', paramsOrStatus.ownerId.toString());
      if (paramsOrStatus.customerId) params.append('customerId', paramsOrStatus.customerId.toString());
    }
    const query = params.toString();
    const result = await apiClient.get<any>(`/quotations${query ? `?${query}` : ''}`);
    if (Array.isArray(result)) {
      return {
        Items: result,
        TotalCount: result.length,
        PageNumber: 1,
        PageSize: result.length,
        TotalPages: 1,
      };
    }
    if (result && result.items) {
      return {
        Items: result.items,
        TotalCount: result.totalCount ?? result.items.length,
        PageNumber: result.pageNumber ?? 1,
        PageSize: result.pageSize ?? 10,
        TotalPages: result.totalPages ?? 1,
      };
    }
    return result as PaginatedQuotationsResponse;
  },

  getPipeline: () => apiClient.get<PipelineStageDto[]>('/pipeline'),

  createQuotation: (data: CreateQuotationRequest) =>
    apiClient.post<QuotationDto>('/quotations', data),

  getQuotation: (id: number | string) => apiClient.get<QuotationDto>(`/quotations/${id}`),
  getQuotationById: (id: number | string) => apiClient.get<QuotationDto>(`/quotations/${id}`),

  updateQuotation: (id: number | string, data: UpdateQuotationRequest) =>
    apiClient.put<QuotationDto>(`/quotations/${id}`, data),

  addQuotationLine: (quotationId: number | string, data: AddQuotationLineRequest) =>
    apiClient.post<QuotationLineDto>(`/quotations/${quotationId}/lines`, data),
  addLine: (quotationId: number | string, data: AddQuotationLineRequest) =>
    apiClient.post<QuotationLineDto>(`/quotations/${quotationId}/lines`, data),

  updateQuotationLine: (quotationId: number | string, lineId: number | string, data: UpdateQuotationLineRequest) =>
    apiClient.put<QuotationLineDto>(`/quotations/${quotationId}/lines/${lineId}`, data),
  updateLine: (quotationId: number | string, lineId: number | string, data: UpdateQuotationLineRequest) =>
    apiClient.put<QuotationLineDto>(`/quotations/${quotationId}/lines/${lineId}`, data),

  deleteQuotationLine: (quotationId: number | string, lineId: number | string) =>
    apiClient.delete<{ message: string }>(`/quotations/${quotationId}/lines/${lineId}`),
  deleteLine: (quotationId: number | string, lineId: number | string) =>
    apiClient.delete<{ message: string }>(`/quotations/${quotationId}/lines/${lineId}`),

  recalculatePricing: (id: number | string) =>
    apiClient.post<QuotationDto>(`/quotations/${id}/recalculate`),
  recalculate: (id: number | string) =>
    apiClient.post<RecalculateResultDto>(`/quotations/${id}/recalculate`),

  getUpsellRecommendations: (id: number | string) =>
    apiClient.get<UpsellRecommendationDto[]>(`/quotations/${id}/recommendations`),
  getRecommendations: (id: number | string) =>
    apiClient.get<UpsellRecommendationDto[]>(`/quotations/${id}/recommendations`),

  acceptRecommendation: (quotationId: number | string, productId: number | string) =>
    apiClient.post<RecalculateResultDto>(`/quotations/${quotationId}/recommendations/${productId}/accept`),

  dismissRecommendation: (quotationId: number | string, productId: number | string) =>
    apiClient.post<{ message: string }>(`/quotations/${quotationId}/recommendations/${productId}/dismiss`),

  submitForApproval: (id: number | string) =>
    apiClient.post<{ status: string; requiresApproval: boolean; message: string }>(`/quotations/${id}/submit`),
  submitQuotation: (id: number | string) =>
    apiClient.post<{ status: string; requiresApproval: boolean; message: string }>(`/quotations/${id}/submit`),

  sendToCustomer: (id: number | string) =>
    apiClient.post<{ portalUrl: string; message: string }>(`/quotations/${id}/send-portal`),
  sendToPortal: (id: number | string) =>
    apiClient.post<{ portalUrl: string; message: string }>(`/quotations/${id}/send-portal`),

  convertToOrder: (id: number | string) =>
    apiClient.post<{ orderId: number; orderNumber: string }>(`/quotations/${id}/confirm-order`),
  confirmOrder: (id: number | string) =>
    apiClient.post<{ orderId: number; orderNumber: string }>(`/quotations/${id}/confirm-order`),

  cloneQuotation: (id: number | string) =>
    apiClient.post<QuotationDto>(`/quotations/${id}/clone`),

  deleteQuotation: (id: number | string) =>
    apiClient.delete<{ message: string }>(`/quotations/${id}`),

  getAuditHistory: (id: number | string) =>
    apiClient.get<any[]>(`/quotations/${id}/audit`),
};
