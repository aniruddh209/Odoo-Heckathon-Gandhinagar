namespace DealFlow360.API.DTOs.Portal;

public class PortalLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LineChangeRequest
{
    public int QuotationLineId { get; set; }
    public int? NewQuantity { get; set; }
    public string? Comment { get; set; }
}

public class CounterDiscountRequest
{
    public int LineId { get; set; }
    public decimal ProposedDiscountPercent { get; set; }
    public string? Reason { get; set; }
}

public class CustomerQuoteDto
{
    public int Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public List<CustomerQuoteLineDto> Lines { get; set; } = new();

    // STRICT ZERO-LEAK SECURITY INVARIANT:
    // CostPrice, UnitMargin, MarginPercent, TotalCost, BlendedRiskScore,
    // and ManagerRemarks are NOT present on this DTO.
}

public class CustomerQuoteLineDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal NetAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public List<CustomerCommentDto> Comments { get; set; } = new();
}

public class CustomerCommentDto
{
    public int Id { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class PortalQuotationListResponse
{
    public int Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal GrandTotal { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class NegotiationHistoryResponse
{
    public int Id { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
