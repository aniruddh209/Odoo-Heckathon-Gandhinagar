import { apiClient } from './client';
import type { CustomerDto, CustomerTierDto } from '@/types/catalog';

export interface SalesTeamDto {
  id: number;
  name: string;
  code: string;
  teamLeadId?: number;
  teamLeadName?: string;
}

export interface GetCustomersParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  tierId?: number;
}

export const customerApi = {
  getCustomers: async (searchOrParams?: string | GetCustomersParams, tierId?: number) => {
    const params = new URLSearchParams();
    if (typeof searchOrParams === 'string') {
      if (searchOrParams) params.append('search', searchOrParams);
      if (tierId) params.append('tierId', tierId.toString());
    } else if (searchOrParams && typeof searchOrParams === 'object') {
      if (searchOrParams.SearchTerm) params.append('search', searchOrParams.SearchTerm);
      if (searchOrParams.tierId) params.append('tierId', searchOrParams.tierId.toString());
      if (searchOrParams.PageNumber) params.append('pageNumber', searchOrParams.PageNumber.toString());
      if (searchOrParams.PageSize) params.append('pageSize', searchOrParams.PageSize.toString());
    }
    const query = params.toString();
    const result = await apiClient.get<any>(`/customers${query ? `?${query}` : ''}`);
    if (Array.isArray(result)) {
      return {
        Items: result as CustomerDto[],
        TotalCount: result.length,
        PageNumber: 1,
        PageSize: result.length,
        TotalPages: 1,
      };
    }
    if (result && result.items) {
      return {
        Items: result.items as CustomerDto[],
        TotalCount: result.totalCount ?? result.items.length,
        PageNumber: result.pageNumber ?? 1,
        PageSize: result.pageSize ?? 10,
        TotalPages: result.totalPages ?? 1,
      };
    }
    return result;
  },

  getCustomerById: (id: number | string) => apiClient.get<CustomerDto>(`/customers/${id}`),
  createCustomer: (data: Partial<CustomerDto>) => apiClient.post<CustomerDto>('/customers', data),
  updateCustomer: (id: number | string, data: Partial<CustomerDto>) => apiClient.put<CustomerDto>(`/customers/${id}`, data),
  
  getCustomerTiers: () => apiClient.get<CustomerTierDto[]>('/customer-tiers'),
  createCustomerTier: (data: Partial<CustomerTierDto>) => apiClient.post<CustomerTierDto>('/customer-tiers', data),
  updateCustomerTier: (id: number | string, data: Partial<CustomerTierDto>) => apiClient.put<CustomerTierDto>(`/customer-tiers/${id}`, data),

  getSalesTeams: () => apiClient.get<SalesTeamDto[]>('/sales-teams'),
  createSalesTeam: (data: { name: string; code: string; teamLeadId?: number }) => apiClient.post<SalesTeamDto>('/sales-teams', data),
  updateSalesTeam: (id: number | string, data: { name: string; code: string; teamLeadId?: number }) => apiClient.put<SalesTeamDto>(`/sales-teams/${id}`, data),
};
