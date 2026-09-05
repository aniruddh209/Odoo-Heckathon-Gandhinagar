import { apiClient } from './apiClient';

export const billingApi = {
  generateOrderBilling: async (orderId) => {
    return apiClient.post(`billing/generate-order-billing/${orderId}`);
  },

  getInvoices: async () => {
    return apiClient.get('invoices');
  },

  getInvoiceById: async (id) => {
    return apiClient.get(`invoices/${id}`);
  },

  recordPayment: async (invoiceId, { amount, paymentMethod, reference }) => {
    return apiClient.post(`invoices/${invoiceId}/pay`, { amount, paymentMethod, reference });
  },

  createCreditNote: async (invoiceId, { amount, reason, orderLineId }) => {
    return apiClient.post(`invoices/${invoiceId}/credit-note`, { amount, reason, orderLineId });
  },

  applySeatChange: async (scheduleId, { newPlanId, newQuantity }) => {
    return apiClient.post(`billing/subscriptions/${scheduleId}/seat-change`, { newPlanId, newQuantity });
  },

  getSchedules: async () => {
    return apiClient.get('billing/schedules');
  },

  generateNextRecurringInvoice: async (scheduleId) => {
    return apiClient.post(`billing/schedules/${scheduleId}/generate-invoice`);
  },

  cancelSchedule: async (scheduleId, reason) => {
    return apiClient.post(`billing/schedules/${scheduleId}/cancel`, { reason });
  },

  getCreditNotes: async () => {
    return apiClient.get('invoices/credit-notes');
  },

  getFinanceDashboardSummary: async () => {
    return apiClient.get('billing/finance-dashboard');
  },
};

export default billingApi;
