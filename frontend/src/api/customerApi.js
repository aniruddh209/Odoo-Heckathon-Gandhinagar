import { apiClient } from './apiClient';

export const customerApi = {
  getCustomers: async () => {
    return apiClient.get('customers');
  },

  getCustomerById: async (id) => {
    return apiClient.get(`customers/${id}`);
  },

  createCustomer: async (data) => {
    return apiClient.post('customers', data);
  },

  updateCustomer: async (id, data) => {
    return apiClient.put(`customers/${id}`, data);
  },

  getMyQuotations: async () => {
    return apiClient.get('customers/me/quotations');
  },

  getMyOrders: async () => {
    return apiClient.get('customers/me/orders');
  },

  getMyInvoices: async () => {
    return apiClient.get('customers/me/invoices');
  },
};

export default customerApi;
