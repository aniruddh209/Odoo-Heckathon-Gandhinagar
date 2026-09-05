export interface DealHealthSummaryDto {
  totalMonitoredQuotes?: number;
  stalledDealsCount?: number;
  anomaliesCount?: number;
  deliverySlippagesCount?: number;
  averageDiscountDeviation?: number;
}

export interface DealAlertDto {
  id?: any;
  Id?: any;
  dealId?: any;
  DealId?: any;
  quotationId?: any;
  QuotationId?: any;
  quotationNumber?: string;
  QuotationNumber?: string;
  customerId?: any;
  customerName?: string;
  CustomerName?: string;
  repId?: any;
  repName?: string;
  SalesRepName?: string;
  alertType?: string;
  severity?: string;
  Severity?: string;
  message?: string;
  daysInactive?: number;
  daysStalled?: number;
  DaysStalled?: number;
  currentStage?: string;
  CurrentStage?: string;
  totalAmount?: number;
  TotalAmount?: number;
  discountDeviation?: number;
  isResolved?: boolean;
  createdAt?: string;
}

export interface RepAnomalyDto {
  repId: any;
  RepId?: any;
  repName: string;
  RepName?: string;
  teamName?: string;
  historicalAverageDiscount?: number;
  currentQuoteDiscount?: number;
  deviationPercentage?: number;
  quotationId?: any;
  quotationNumber?: string;
  anomalyType?: string;
  AnomalyType?: string;
  severity?: string;
  Severity?: string;
  description?: string;
  Description?: string;
  occurrences?: number;
  Occurrences?: number;
}
