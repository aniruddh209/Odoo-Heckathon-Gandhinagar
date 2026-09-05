import { apiClient } from './client';
import type {
  BillingScheduleDto,
  CancelSubscriptionRequest,
  ChangeSubscriptionRequest,
  CreditNoteDto,
  InvoiceDto,
  PaymentDto,
  RecordPaymentRequest,
  SubscriptionDto,
  SubscriptionPlanDto,
} from '@/types/billing';

export interface OrderBillingOverviewDto {
  orderId: number;
  orderNumber: string;
  invoices: InvoiceDto[];
  subscriptions: SubscriptionDto[];
}

export const billingApi = {
  getSubscriptionPlans: () => apiClient.get<SubscriptionPlanDto[]>('/subscription-plans'),
  createSubscriptionPlan: (data: Partial<SubscriptionPlanDto>) =>
    apiClient.post<SubscriptionPlanDto>('/subscription-plans', data),

  getSubscriptions: () => apiClient.get<SubscriptionDto[]>('/subscriptions'),

  getOrderBilling: (orderId: number | string) =>
    apiClient.get<OrderBillingOverviewDto>(`/orders/${orderId}/billing`),

  generateBilling: (orderId: number | string) =>
    apiClient.post<OrderBillingOverviewDto>(`/orders/${orderId}/billing/generate`),

  getBillingSchedules: (status?: string, dueBefore?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (dueBefore) params.append('dueBefore', dueBefore);
    const query = params.toString();
    return apiClient.get<BillingScheduleDto[]>(`/billing-schedules${query ? `?${query}` : ''}`);
  },

  generateScheduledInvoice: (scheduleId: number | string) =>
    apiClient.post<InvoiceDto>(`/billing-schedules/${scheduleId}/generate-invoice`),

  changeSubscription: (subscriptionId: number | string, data: any) =>
    apiClient.post<{ prorationAdjustment: number; message: string }>(
      `/subscriptions/${subscriptionId}/change`,
      {
        newQuantity: data.NewQuantity ?? data.newQuantity ?? 1,
        effectiveImmediately: data.EffectiveDate ? true : true,
      }
    ),

  cancelSubscription: (subscriptionId: number | string, data: any) =>
    apiClient.post<{ creditNote?: CreditNoteDto; message: string }>(
      `/subscriptions/${subscriptionId}/cancel`,
      {
        reason: data.CancellationReason || data.reason || 'User cancelled',
        issueCreditNote: true,
      }
    ),

  getInvoices: () => apiClient.get<InvoiceDto[]>('/invoices'),

  getInvoiceById: (id: number | string) => apiClient.get<InvoiceDto>(`/invoices/${id}`),

  recordPayment: (invoiceId: number | string, data: any) =>
    apiClient.post<PaymentDto>(`/invoices/${invoiceId}/payments`, {
      amount: data.Amount ?? data.amount,
      paymentMethod: data.PaymentMethod ?? data.paymentMethod ?? 'Wire',
    }),

  getInvoicePayments: (invoiceId: number | string) =>
    apiClient.get<PaymentDto[]>(`/invoices/${invoiceId}/payments`),

  createCreditNote: (invoiceId: number | string, data: { amount: number; reason: string }) =>
    apiClient.post<CreditNoteDto>(`/invoices/${invoiceId}/credit-notes`, data),
};
