import { apiClient } from './apiClient';

export const salesConnectionApi = {
  // Public / Customer Catalog
  getCompanies: async (productId) => {
    const params = productId ? `?productId=${productId}` : '';
    return apiClient.get(`sales-connections/companies${params}`);
  },

  getProducts: async ({ companyId, categoryId, search } = {}) => {
    const query = new URLSearchParams();
    if (companyId) query.append('companyId', companyId);
    if (categoryId) query.append('categoryId', categoryId);
    if (search) query.append('search', search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`sales-connections/products${qs}`);
  },

  resolveRepresentative: async ({ companyId, productId }) => {
    return apiClient.post('sales-connections/resolve', { companyId, productId });
  },

  createConnectionRequest: async (data) => {
    return apiClient.post('sales-connections', data);
  },

  getMyRequests: async () => {
    return apiClient.get('sales-connections/my');
  },

  // Sales Rep / Manager Workspace
  getWorkspaceRequests: async ({ status, companyId } = {}) => {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (companyId) query.append('companyId', companyId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`sales-connections/workspace${qs}`);
  },

  getRequestById: async (id) => {
    return apiClient.get(`sales-connections/${id}`);
  },

  updateStatus: async (id, data) => {
    return apiClient.patch(`sales-connections/${id}/status`, data);
  },

  createQuoteFromConnection: async (id) => {
    return apiClient.post(`sales-connections/${id}/create-quote`);
  },

  // Admin & Governance
  getAllCompaniesAdmin: async () => {
    return apiClient.get('sales-connections/admin/companies');
  },

  createCompany: async (data) => {
    return apiClient.post('sales-connections/admin/companies', data);
  },

  updateCompany: async (id, data) => {
    return apiClient.put(`sales-connections/admin/companies/${id}`, data);
  },

  deleteCompany: async (id) => {
    return apiClient.delete(`sales-connections/admin/companies/${id}`);
  },

  getSalesAssignments: async (companyId) => {
    const params = companyId ? `?companyId=${companyId}` : '';
    return apiClient.get(`sales-connections/admin/assignments${params}`);
  },

  createSalesAssignment: async (data) => {
    return apiClient.post('sales-connections/admin/assignments', data);
  },

  updateSalesAssignment: async (id, data) => {
    return apiClient.put(`sales-connections/admin/assignments/${id}`, data);
  },

  deleteSalesAssignment: async (id) => {
    return apiClient.delete(`sales-connections/admin/assignments/${id}`);
  },
};

export default salesConnectionApi;
