namespace DealFlow360.API.DTOs.Quotations;

// ─── Create / Update Requests ──────────────────────────────

public class CreateQuotationRequest
{
    public int CustomerId { get; set; }
    public int? PriceListId { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
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
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class QuotationDetailResponse
{
    public int Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerTierName { get; set; } = string.Empty;
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

    // Children
    public List<QuotationLineResponse> Lines { get; set; } = new();
    public List<ApprovalStepResponse> ApprovalSteps { get; set; } = new();
    public List<string> AllowedActions { get; set; } = new();
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
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal MarginPerUnit { get; set; }
    public decimal CurrentQuoteMargin { get; set; }
    public decimal MarginAfterAddition { get; set; }
    public decimal MarginDeltaPercent { get; set; }
    public decimal Score { get; set; }
    public bool IsPromoted { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
