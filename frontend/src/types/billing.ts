export interface SubscriptionPlanDto {
  id: any;
  Id?: any;
  productId?: any;
  productName?: string;
  name: string;
  Name?: string;
  billingInterval?: 'Monthly' | 'Quarterly' | 'Yearly' | string;
  BillingFrequency?: string;
  periodicPrice?: number;
  PeriodicPrice?: number;
  description?: string;
  Description?: string;
  intervalCount?: number;
  gracePeriodDays?: number;
  isActive?: boolean;
  IsActive?: boolean;
}

export interface SubscriptionDto {
  id: any;
  Id?: any;
  subscriptionNumber: string;
  SubscriptionNumber?: string;
  customerId?: any;
  customerName?: string;
  CustomerName?: string;
  orderId?: any;
  orderNumber?: string;
  subscriptionPlanId?: any;
  PlanId?: any;
  planName?: string;
  PlanName?: string;
  currentQuantity?: number;
  Quantity?: number;
  unitPrice?: number;
  periodicPrice?: number;
  PeriodicPrice?: number;
  billingFrequency?: string;
  BillingFrequency?: string;
  discountPercent?: number;
  recurringAmount?: number;
  status: 'Active' | 'Paused' | 'Cancelled' | 'Expired' | string;
  Status?: string;
  startDate?: string;
  currentPeriodStart: string;
  CurrentPeriodStart?: string;
  currentPeriodEnd: string;
  CurrentPeriodEnd?: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  autoRenew?: boolean;
  AutoRenew?: boolean;
  billingSchedules?: BillingScheduleDto[];
  BillingSchedules?: BillingScheduleDto[];
}

export interface BillingScheduleDto {
  id: any;
  Id?: any;
  subscriptionId?: any;
  scheduledDate: string;
  ScheduledDate?: string;
  projectedAmount?: number;
  amount?: number;
  Amount?: number;
  periodDescription?: string;
  PeriodDescription?: string;
  prorationAdjustment?: number;
  status: 'Scheduled' | 'Invoiced' | 'Skipped' | 'Cancelled' | 'Processed' | string;
  Status?: string;
  invoiceId?: any;
}

export interface InvoiceLineDto {
  id: any;
  Id?: any;
  invoiceId?: any;
  productId?: any;
  productName?: string;
  description?: string;
  Description?: string;
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  lineTotal?: number;
  total?: number;
  Total?: number;
}

export interface InvoiceDto {
  id: any;
  Id?: any;
  invoiceNumber: string;
  InvoiceNumber?: string;
  orderId?: any;
  orderNumber?: string;
  customerId?: any;
  customerName?: string;
  CustomerName?: string;
  invoiceType?: string;
  status: string;
  Status?: string;
  issueDate?: string;
  dueDate: string;
  DueDate?: string;
  totalAmount: number;
  TotalAmount?: number;
  paidAmount?: number;
  balanceDue?: number;
  lines: InvoiceLineDto[];
  Lines?: InvoiceLineDto[];
}

export interface PaymentDto {
  id: any;
  Id?: any;
  paymentReference: string;
  invoiceId: any;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

export interface RecordPaymentRequest {
  amount?: number;
  Amount?: number;
  paymentMethod?: string;
  PaymentMethod?: string;
  TransactionReference?: string;
}

export interface CreditNoteDto {
  id: any;
  creditNoteNumber: string;
  orderId: any;
  customerId: any;
  subscriptionId?: any;
  amount: number;
  reason: string;
  issueDate: string;
  status: string;
}

export interface ChangeSubscriptionRequest {
  newQuantity?: number;
  NewQuantity?: number;
  newPlanId?: any;
  NewPlanId?: any;
  effectiveDate?: string;
  EffectiveDate?: string;
  effectiveImmediately?: boolean;
}

export interface CancelSubscriptionRequest {
  reason?: string;
  CancellationReason?: string;
  issueCreditNote?: boolean;
}
