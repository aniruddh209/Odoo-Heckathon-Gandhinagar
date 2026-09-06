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
    public int Version { get; set; } = 1;
    public string CustomerName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public int? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? InvoiceNumber { get; set; }
    public int ActiveSubscriptionsCount { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public List<CustomerQuoteLineDto> Lines { get; set; } = new();
    public List<NegotiationHistoryResponse> ChangeRequests { get; set; } = new();

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
    public bool IsRecurring { get; set; }
    public string? BillingFrequency { get; set; }
    public string? SubscriptionPlanName { get; set; }
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

public class SubmitChangeRequest
{
    public int? LineId { get; set; }
    public string ChangeType { get; set; } = "General"; // QuantityChange, ScopeChange, Terms, General
    public int? NewQuantity { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class CustomerOrderDetailDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public List<CustomerOrderLineDto> Lines { get; set; } = new();
}

public class CustomerOrderLineDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal NetAmount { get; set; }
}

public class CustomerInvoiceDetailDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Outstanding { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<CustomerInvoiceLineDto> Lines { get; set; } = new();
    public List<CustomerPaymentDto> Payments { get; set; } = new();
    public List<CustomerCreditNoteDto> CreditNotes { get; set; } = new();
}

public class CustomerInvoiceLineDto
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal NetAmount { get; set; }
}

public class CustomerPaymentDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime PaidAtUtc { get; set; }
    public string? Reference { get; set; }
}

public class CustomerCreditNoteDto
{
    public int Id { get; set; }
    public string CreditNoteNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class CustomerProfileDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "USD";
    public DateTime CreatedAtUtc { get; set; }
    public string? AssignedSalesRepName { get; set; }
    public string? AssignedSalesRepEmail { get; set; }
}

