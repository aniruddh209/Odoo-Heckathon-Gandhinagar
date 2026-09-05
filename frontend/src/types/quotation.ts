export const QuotationStatus = {
  Draft: 'Draft',
  PendingApproval: 'PendingApproval',
  InReview: 'InReview',
  Approved: 'Approved',
  Sent: 'Sent',
  SentToCustomer: 'SentToCustomer',
  UnderNegotiation: 'UnderNegotiation',
  Confirmed: 'Confirmed',
  Accepted: 'Accepted',
  Ordered: 'Ordered',
  Rejected: 'Rejected',
  RevisionRequested: 'RevisionRequested',
  Cancelled: 'Cancelled',
  Expired: 'Expired',
} as const;

export type QuotationStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Sent'
  | 'UnderNegotiation'
  | 'Confirmed'
  | 'Rejected'
  | 'RevisionRequested'
  | 'Cancelled'
  | 'SentToCustomer'
  | 'InReview'
  | 'Accepted'
  | 'Ordered'
  | 'Expired';

export interface QuotationLineDto {
  id: number;
  Id?: any;
  quotationId?: number;
  QuotationId?: any;
  productId: number;
  ProductId?: any;
  productName: string;
  ProductName?: string;
  productSku: string;
  ProductSku?: string;
  productVariantId?: number;
  ProductVariantId?: any;
  variantName?: string;
  quantity: number;
  Quantity?: number;
  unitPrice?: number;
  UnitPrice?: number;
  UnitListPrice?: number;
  UnitNetPrice?: number;
  discountPercentage: number;
  DiscountPercentage?: number;
  discountReason?: string;
  DiscountReason?: string;
  effectiveDiscountLimit?: number;
  requiresApproval?: boolean;
  approvalReason?: string;
  subtotalAmount?: number;
  Subtotal?: number;
  unitCostPrice?: number; // SENSITIVE: Internal Only
  UnitCostPrice?: number;
  lineMarginAmount?: number; // SENSITIVE: Internal Only
  lineMarginPercent?: number; // SENSITIVE: Internal Only
  LineMarginPercent?: number;
  lineItemType?: string;
}

export interface QuotationDto {
  id: any;
  Id?: any;
  quotationNumber: string;
  QuotationNumber?: string;
  customerId: any;
  CustomerId?: any;
  customerName: string;
  CustomerName?: string;
  customerTier?: string;
  CustomerTier?: string;
  salesRepresentativeId?: any;
  repName?: string;
  SalesRepName?: string;
  salesTeamId?: any;
  status: QuotationStatus;
  Status?: QuotationStatus;
  blendedDiscountRiskScore?: number;
  BlendedDiscountRiskScore?: number;
  totalGrossAmount?: number;
  SubtotalAmount?: number;
  totalDiscountAmount?: number;
  TotalDiscountAmount?: number;
  totalNetAmount?: number;
  TotalAmount?: number;
  taxAmount?: number;
  TaxAmount?: number;
  totalCostAmount?: number;
  TotalCostPrice?: number;
  orderGrossMarginAmount?: number;
  OrderGrossMarginAmount?: number;
  orderGrossMarginPercent?: number;
  OrderGrossMarginPercent?: number;
  customerCounterDiscount?: number;
  customerSplitDeliveryConsent?: boolean;
  customerNotes?: string;
  internalRemarks?: string;
  notes?: string;
  Notes?: string;
  promisedDeliveryDate?: string;
  expirationDate?: string;
  ExpirationDate?: string;
  versionNumber?: number;
  VersionNumber?: number;
  currency?: string;
  Currency?: string;
  approvalRequired?: boolean;
  ApprovalRequired?: boolean;
  priceListId?: any;
  PriceListId?: any;
  lines: QuotationLineDto[];
  Lines?: QuotationLineDto[];
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
}

export interface RecalculateResultDto {
  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalNetAmount: number;
  totalCostAmount?: number;
  orderGrossMarginAmount?: number;
  orderGrossMarginPercent?: number;
  blendedDiscountRiskScore: number;
  requiresApproval: boolean;
  requiredApprovalLevel?: 'None' | 'SalesManager' | 'SalesManagerAndFinance' | string;
  peakLineViolation: number;
  weightedMarginLoss: number;
  lines: QuotationLineDto[];
}

export interface CreateQuotationRequest {
  customerId?: any;
  CustomerId?: any;
  promisedDeliveryDate?: string;
  customerNotes?: string;
  internalRemarks?: string;
  priceListId?: any;
  PriceListId?: any;
  expirationDate?: string;
  ExpirationDate?: string;
  notes?: string;
  Notes?: string;
}

export interface UpdateQuotationRequest {
  promisedDeliveryDate?: string;
  customerNotes?: string;
  internalRemarks?: string;
  customerSplitDeliveryConsent?: boolean;
  expirationDate?: string;
  notes?: string;
}

export interface AddQuotationLineRequest {
  productId?: any;
  ProductId?: any;
  productVariantId?: any;
  ProductVariantId?: any;
  quantity?: number;
  Quantity?: number;
  unitPrice?: number;
  UnitPrice?: number;
  discountPercentage?: number;
  DiscountPercentage?: number;
  discountReason?: string;
  DiscountReason?: string;
}

export interface UpdateQuotationLineRequest {
  quantity?: number;
  Quantity?: number;
  discountPercentage?: number;
  DiscountPercentage?: number;
  unitPrice?: number;
  UnitPrice?: number;
  discountReason?: string;
  DiscountReason?: string;
}

export interface UpsellRecommendationDto {
  productId?: any;
  ProductId?: any;
  productName?: string;
  ProductName?: string;
  productSku?: string;
  ProductSku?: string;
  ruleType?: string;
  reason?: string;
  Reason?: string;
  suggestedQuantity?: number;
  SuggestedQuantity?: number;
  confidenceScore?: number;
  promotionalText?: string;
  isPromoted?: boolean;
  unitPrice?: number;
  estimatedPrice?: number;
  EstimatedPrice?: number;
  marginContribution?: number;
  MarginContribution?: number;
  projectedMarginDeltaPercent?: number;
}
