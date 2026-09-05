export interface ApprovalRequestDto {
  id: any;
  Id?: any;
  quotationId: any;
  QuotationId?: any;
  quotationNumber: string;
  QuotationNumber?: string;
  customerId?: any;
  CustomerId?: any;
  customerName?: string;
  CustomerName?: string;
  customerTier?: string;
  salesRepresentativeId?: any;
  repName?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'RevisionRequested' | string;
  Status?: string;
  blendedRiskScore: number;
  BlendedRiskScore?: number;
  peakLineViolation?: number;
  weightedMarginLoss?: number;
  currentRuleStepId?: any;
  currentStepName?: string;
  requiredRole?: string;
  submittedAt?: string;
  completedAt?: string;
  totalNetAmount?: number;
  TotalAmount?: number;
  discountPercentage?: number;
  DiscountPercentage?: number;
  triggerReason?: string;
  TriggerReason?: string;
  actions?: ApprovalActionDto[];
  Actions?: ApprovalActionDto[];
  createdAt?: string;
  CreatedAt?: string;
}

export interface ApprovalActionDto {
  id?: any;
  Id?: any;
  approvalRequestId?: any;
  reviewerId?: any;
  reviewerName?: string;
  ApproverName?: string;
  reviewerRole?: string;
  ApproverRole?: string;
  actionTaken?: 'Approved' | 'Rejected' | 'RevisionRequested' | string;
  Action?: string;
  stepOrder?: number;
  TierLevel?: number;
  remarks?: string;
  Comments?: string;
  actionTimestamp?: string;
  ActionDate?: string;
}

export interface ApprovalDecisionRequest {
  remarks?: string;
  Action?: string;
  Comments?: string;
}
