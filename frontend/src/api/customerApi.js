import { apiClient } from './apiClient.js';

export const customerApi = {
  getCustomers: async (searchOrParams, tierId) => {
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
    const result = await apiClient.get(`/customers${query ? `?${query}` : ''}`);
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
    return result;
  },

  getCustomerById: (id) => apiClient.get(`/customers/${id}`),
  createCustomer: (data) => apiClient.post('/customers', data),
  updateCustomer: (id, data) => apiClient.put(`/customers/${id}`, data),
  
  getCustomerTiers: () => apiClient.get('/customer-tiers'),
  createCustomerTier: (data) => apiClient.post('/customer-tiers', data),
  updateCustomerTier: (id, data) => apiClient.put(`/customer-tiers/${id}`, data),

  getSalesTeams: () => apiClient.get('/sales-teams'),
  createSalesTeam: (data) => apiClient.post('/sales-teams', data),
  updateSalesTeam: (id, data) => apiClient.put(`/sales-teams/${id}`, data),
};
