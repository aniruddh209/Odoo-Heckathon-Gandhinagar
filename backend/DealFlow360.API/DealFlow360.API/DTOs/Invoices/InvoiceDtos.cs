namespace DealFlow360.API.DTOs.Invoices;

public class RecordPaymentRequest
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Reference { get; set; }
}

public class CreateCreditNoteRequest
{
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int? OrderLineId { get; set; }
}

public class InvoiceListResponse
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Outstanding { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class InvoiceDetailResponse
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Outstanding { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<InvoiceLineResponse> Lines { get; set; } = new();
    public List<PaymentResponse> Payments { get; set; } = new();
    public List<CreditNoteResponse> CreditNotes { get; set; } = new();
}

public class InvoiceLineResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal NetAmount { get; set; }
    public decimal TaxAmount { get; set; }
}

public class PaymentResponse
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidAtUtc { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Reference { get; set; }
}

public class CreditNoteResponse
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
