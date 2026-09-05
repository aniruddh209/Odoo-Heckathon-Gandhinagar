import { apiClient } from './apiClient.js';

export const billingApi = {
  getSubscriptionPlans: () => apiClient.get('/subscription-plans'),
  createSubscriptionPlan: (data) =>
    apiClient.post('/subscription-plans', data),

  getSubscriptions: () => apiClient.get('/subscriptions'),

  getOrderBilling: (orderId) =>
    apiClient.get(`/orders/${orderId}/billing`),

  generateBilling: (orderId) =>
    apiClient.post(`/orders/${orderId}/billing/generate`),

  getBillingSchedules: (status, dueBefore) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (dueBefore) params.append('dueBefore', dueBefore);
    const query = params.toString();
    return apiClient.get(`/billing-schedules${query ? `?${query}` : ''}`);
  },

  generateScheduledInvoice: (scheduleId) =>
    apiClient.post(`/billing-schedules/${scheduleId}/generate-invoice`),

  changeSubscription: (subscriptionId, data) =>
    apiClient.post(
      `/subscriptions/${subscriptionId}/change`,
      {
        newQuantity: data.NewQuantity ?? data.newQuantity ?? 1,
        effectiveImmediately: data.EffectiveDate ? true : true,
      }
    ),

  cancelSubscription: (subscriptionId, data) =>
    apiClient.post(
      `/subscriptions/${subscriptionId}/cancel`,
      {
        reason: data.CancellationReason || data.reason || 'User cancelled',
        issueCreditNote: true,
      }
    ),

  getInvoices: () => apiClient.get('/invoices'),
  getInvoiceById: (id) => apiClient.get(`/invoices/${id}`),

  recordPayment: (invoiceId, data) =>
    apiClient.post(`/invoices/${invoiceId}/payments`, {
      amount: data.Amount ?? data.amount,
      paymentMethod: data.PaymentMethod ?? data.paymentMethod ?? 'Wire',
    }),

  getInvoicePayments: (invoiceId) =>
    apiClient.get(`/invoices/${invoiceId}/payments`),

  createCreditNote: (invoiceId, data) =>
    apiClient.post(`/invoices/${invoiceId}/credit-notes`, data),
};
