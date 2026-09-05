export interface LineCommentDto {
  id: any;
  Id?: any;
  quotationLineId?: any;
  authorType?: 'Customer' | 'SalesRep' | string;
  AuthorType?: string;
  authorName?: string;
  AuthorName?: string;
  commentText?: string;
  Comment?: string;
  createdAt: string;
  CreatedAt?: string;
}

export interface CustomerQuoteLineDto {
  id: any;
  Id?: any;
  productId: any;
  productName: string;
  ProductName?: string;
  productSku: string;
  ProductSku?: string;
  variantName?: string;
  quantity: number;
  Quantity?: number;
  unitPrice?: number;
  UnitListPrice?: number;
  UnitNetPrice?: number;
  discountPercentage: number;
  DiscountPercentage?: number;
  subtotalAmount?: number;
  Subtotal?: number;
  lineItemType?: string;
  comments?: LineCommentDto[];
}

// STRICT ZERO-LEAK CUSTOMER QUOTATION DTO
// Absolutely NO standardCostPrice, unitCostPrice, margins, risk score, or internalRemarks!
export interface CustomerQuoteDto {
  id: any;
  Id?: any;
  quotationNumber: string;
  QuotationNumber?: string;
  customerName?: string;
  CustomerName?: string;
  status: string;
  Status?: string;
  totalGrossAmount?: number;
  SubtotalAmount?: number;
  totalDiscountAmount?: number;
  TotalDiscountAmount?: number;
  totalNetAmount?: number;
  TotalAmount?: number;
  taxAmount?: number;
  TaxAmount?: number;
  currency?: string;
  Currency?: string;
  versionNumber?: number;
  VersionNumber?: number;
  customerCounterDiscount?: number;
  customerNotes?: string;
  notes?: string;
  Notes?: string;
  promisedDeliveryDate?: string;
  expirationDate?: string;
  ExpirationDate?: string;
  customerSplitDeliveryConsent?: boolean;
  lines: CustomerQuoteLineDto[];
  Lines?: CustomerQuoteLineDto[];
  createdAt?: string;
}

export interface CustomerLineRequest {
  commentText?: string;
  Comment?: string;
  requestedQuantity?: number;
}

export interface CustomerCounterDiscountRequest {
  counterDiscountPercent?: number;
  RequestedDiscountPercentage?: number;
  RequestedTotalAmount?: number;
  remarks?: string;
  notes?: string;
  Notes?: string;
}

export interface CustomerConfirmRequest {
  acceptanceConsent?: boolean;
  notes?: string;
  PoNumber?: string;
  Signature?: string;
}
