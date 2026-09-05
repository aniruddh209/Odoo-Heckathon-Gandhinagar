import { apiClient } from './apiClient.js';

export const customerApi = {
  getCustomers: async () => {
    const result = await apiClient.get('/customers');
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
  
  getCustomerTiers: () => apiClient.get('/admin/customer-tiers'),
  createCustomerTier: (data) => apiClient.post('/admin/customer-tiers', data),

  getSalesTeams: () => apiClient.get('/admin/sales-teams'),
  createSalesTeam: (data) => apiClient.post('/admin/sales-teams', data),
};

