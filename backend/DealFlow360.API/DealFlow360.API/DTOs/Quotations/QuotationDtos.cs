namespace DealFlow360.API.DTOs.Quotations;

// ─── Create / Update Requests ──────────────────────────────

public class CreateQuotationRequest
{
    public int CustomerId { get; set; }
    public int? PriceListId { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public string? InquiryRequestNumber { get; set; }
    public List<AddLineRequest>? Lines { get; set; }
}

public class UpdateQuotationRequest
{
    public int? PriceListId { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
}

public class AddLineRequest
{
    public int ProductId { get; set; }
    public int? VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public int? SubscriptionPlanId { get; set; }
}

public class UpdateLineRequest
{
    public int Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public int? VariantId { get; set; }
    public int? SubscriptionPlanId { get; set; }
}


// ─── Responses ─────────────────────────────────────────────

public class QuotationListResponse
{
    public int Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string SalesRepName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
    public decimal GrandTotal { get; set; }
    public decimal MarginPercent { get; set; }
    public decimal RiskScore { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public int? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public int Version { get; set; } = 1;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class QuotationDetailResponse
{
    public int Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerTierName { get; set; } = string.Empty;
    public decimal CustomerTierMaxDiscount { get; set; }
    public int SalesRepId { get; set; }
    public string SalesRepName { get; set; } = string.Empty;
    public int? PriceListId { get; set; }
    public string? PriceListName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;

    // Totals
    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal CostTotal { get; set; }
    public decimal MarginAmount { get; set; }
    public decimal MarginPercent { get; set; }
    public decimal RiskScore { get; set; }

    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public bool IsPortalVisible { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    // Linked Order & Fulfillment
    public int? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? OrderStatus { get; set; }

    // Children
    public List<QuotationLineResponse> Lines { get; set; } = new();
    public List<ApprovalStepResponse> ApprovalSteps { get; set; } = new();
    public List<string> AllowedActions { get; set; } = new();

    // Negotiation & Governance Metadata
    public List<QuotationChangeResponse> ChangeRequests { get; set; } = new();
    public bool HasPendingCounterOffer { get; set; }
    public decimal? LatestCounterDiscount { get; set; }
    public string? LatestCounterReason { get; set; }
    public int? LatestCounterLineId { get; set; }
    public bool IsDiscountLocked { get; set; }
    public bool IsAutoApproved { get; set; }
}

public class QuotationLineResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public string ProductType { get; set; } = string.Empty;
    public int? VariantId { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal NetAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal CostPrice { get; set; }
    public decimal MarginAmount { get; set; }
    public int? SubscriptionPlanId { get; set; }
    public string? SubscriptionPlanName { get; set; }
    public bool IsNegotiatedLocked { get; set; }
    public decimal? CounterDiscountPercent { get; set; }
    public string? CounterReason { get; set; }

    // Negotiation & Customer Inquiries
    public List<LineCommentResponse> Comments { get; set; } = new();
}

public class LineCommentResponse
{
    public int Id { get; set; }
    public int QuotationLineId { get; set; }
    public int? UserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class AddCommentRequest
{
    public string Comment { get; set; } = string.Empty;
}

public class ApprovalStepResponse
{
    public int Id { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Sequence { get; set; }
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? ActedAtUtc { get; set; }
    public string? ActedByName { get; set; }
    public string? Reason { get; set; }
}

public class RecommendationResponse
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal MarginPerUnit { get; set; }
    public decimal ProductMarginPercent { get; set; }
    public decimal CurrentQuoteMargin { get; set; }
    public decimal MarginAfterAddition { get; set; }
    public decimal MarginDeltaPercent { get; set; }
    public decimal BaseRelevanceScore { get; set; }
    public decimal PromotionScore { get; set; }
    public decimal Score { get; set; }
    public bool IsPromoted { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public int CoPurchaseCount { get; set; }
    public bool HasCustomerAffinity { get; set; }
}

public class RecommendationPreviewRequest
{
    public List<int> ProductIds { get; set; } = new();
    public int? CustomerId { get; set; }
    public decimal? MinimumMarginThreshold { get; set; }
}


public class NegotiatePriceRequest
{
    public decimal? TargetUnitPrice { get; set; }
    public decimal? TargetDiscountPercent { get; set; }
    public decimal? ProposedDiscountPercent { get; set; }
    public decimal? ProposedUnitPrice { get; set; }
    public int? Quantity { get; set; }
    public string? Reason { get; set; }
}

public class NegotiateDealRequest
{
    public decimal OverallDiscountPercent { get; set; }
    public string? Reason { get; set; }
}

public class QuotationChangeResponse
{
    public int Id { get; set; }
    public int QuotationId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int RequestedByUserId { get; set; }
    public string? RequestedByUserName { get; set; }
    public string? OldValueJson { get; set; }
    public string? NewValueJson { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class SendQuotationRequest
{
    public string? Notes { get; set; }
}

public class AcceptCounterOfferRequest
{
    public int? LineId { get; set; }
    public decimal? CounterDiscountPercent { get; set; }
    public string? Reason { get; set; }
}

public class RejectCounterOfferRequest
{
    public int? LineId { get; set; }
    public decimal? CounterDiscountPercent { get; set; }
    public decimal? CounterUnitPrice { get; set; }
    public bool DisqualifyDeal { get; set; }
    public string? Reason { get; set; }
}

public class DisqualifyQuotationRequest
{
    public string Reason { get; set; } = string.Empty;
}
