import { apiClient } from './apiClient.js';

export const billingApi = {
  getSubscriptionPlans: () => apiClient.get('/admin/subscription-plans'),
  createSubscriptionPlan: (data) =>
    apiClient.post('/admin/subscription-plans', data),

  getSubscriptions: () => apiClient.get('/admin/subscription-plans'),

  getOrderBilling: (orderId) =>
    apiClient.post(`/billing/generate-order-billing/${orderId}`),

  generateOrderBilling: (orderId) =>
    apiClient.post(`/billing/generate-order-billing/${orderId}`),
  generateBilling: (orderId) =>
    apiClient.post(`/billing/generate-order-billing/${orderId}`),

  changeSubscription: (scheduleId, data) =>
    apiClient.post(
      `/billing/subscriptions/${scheduleId}/seat-change`,
      {
        newPlanId: data.NewPlanId ?? data.newPlanId ?? null,
        newQuantity: data.NewQuantity ?? data.newQuantity ?? data.newSeatCount ?? 1,
      }
    ),

  getInvoices: () => apiClient.get('/invoices'),
  getInvoiceById: (id) => apiClient.get(`/invoices/${id}`),

  recordPayment: (invoiceId, data) =>
    apiClient.post(`/invoices/${invoiceId}/pay`, {
      amount: data.Amount ?? data.amount,
      paymentMethod: data.PaymentMethod ?? data.paymentMethod ?? 'Wire',
      reference: data.Reference ?? data.reference ?? '',
    }),

  createCreditNote: (invoiceId, data) =>
    apiClient.post(`/invoices/${invoiceId}/credit-note`, {
      amount: data.Amount ?? data.amount,
      reason: data.Reason ?? data.reason ?? 'Customer adjustment',
      orderLineId: data.OrderLineId ?? data.orderLineId ?? null,
    }),
};

