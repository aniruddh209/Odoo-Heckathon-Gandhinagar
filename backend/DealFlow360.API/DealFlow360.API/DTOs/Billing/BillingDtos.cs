namespace DealFlow360.API.DTOs.Billing;

public class SubscriptionChangeRequest
{
    public int? NewPlanId { get; set; }
    public int NewQuantity { get; set; }
}

public class CancelSubscriptionRequest
{
    public string? Reason { get; set; }
}

public class BillingOverviewResponse
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public bool HasCommercialInvoice { get; set; }
    public string? InvoiceNumber { get; set; }
    public decimal InvoiceTotal { get; set; }
    public int ActiveSubscriptionsCount { get; set; }
    public List<InvoiceSummary> Invoices { get; set; } = new();
    public List<BillingScheduleResponse> RecurringSchedules { get; set; } = new();
}

public class InvoiceSummary
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Outstanding { get; set; }
    public DateTime DueDate { get; set; }
}

public class BillingScheduleResponse
{
    public int Id { get; set; }
    public int OrderLineId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string SubscriptionPlanName { get; set; } = string.Empty;
    public string BillingFrequency { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime NextBillingDate { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal ProratedAdjustmentAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}
