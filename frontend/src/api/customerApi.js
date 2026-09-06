import { apiClient } from './apiClient';

export const customerApi = {
  getCustomers: async () => {
    return apiClient.get('customers');
  },

  getCustomerById: async (id) => {
    return apiClient.get(`customers/${id}`);
  },

  getCustomer360: async (id) => {
    return apiClient.get(`customers/${id}/360`);
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

  getMyQuotationById: async (id) => {
    return apiClient.get(`customers/me/quotations/${id}`);
  },

  submitLineComment: async (id, lineId, comment) => {
    return apiClient.post(`customers/me/quotations/${id}/lines/${lineId}/comment`, { comment });
  },

  submitCounterOffer: async (id, data) => {
    return apiClient.post(`customers/me/quotations/${id}/counter-offer`, data);
  },

  submitChangeRequest: async (id, data) => {
    return apiClient.post(`customers/me/quotations/${id}/change-request`, data);
  },

  confirmMyQuotation: async (id) => {
    return apiClient.post(`customers/me/quotations/${id}/confirm`);
  },

  acceptRepCounterOffer: async (id, remarks = null) => {
    return apiClient.post(`customers/me/quotations/${id}/counter-offer/accept`, { remarks });
  },

  rejectRepCounterOffer: async (id, { reason, counterDiscountPercent = null } = {}) => {
    return apiClient.post(`customers/me/quotations/${id}/counter-offer/reject`, {
      reason,
      counterDiscountPercent,
    });
  },

  getMyOrderById: async (id) => {
    return apiClient.get(`customers/me/orders/${id}`);
  },

  getMyInvoiceById: async (id) => {
    return apiClient.get(`customers/me/invoices/${id}`);
  },

  getMyProfile: async () => {
    return apiClient.get('customers/me/profile');
  },

  downloadMyQuotationPdf: async (id, quotationNumber = 'Quote') => {
    const filename = `DealFlow360_Quotation_${quotationNumber}.pdf`;
    return apiClient.download(`customers/me/quotations/${id}/pdf`, filename);
  },
};

export default customerApi;
