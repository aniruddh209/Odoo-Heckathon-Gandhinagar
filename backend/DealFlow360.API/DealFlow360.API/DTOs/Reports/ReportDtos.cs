namespace DealFlow360.API.DTOs.Reports;

public class DashboardResponse
{
    public int TotalQuotationsCount { get; set; }
    public decimal TotalQuotedRevenue { get; set; }
    public decimal TotalBookedRevenue { get; set; }
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal AverageMarginPercent { get; set; }
    public decimal AverageRiskScore { get; set; }
    public int PendingApprovalsCount { get; set; }
    public int ActiveOrdersCount { get; set; }

    public decimal OpenQuotationValue { get; set; }
    public int ApprovedQuoteCount { get; set; }
    public int PendingQuoteCount { get; set; }
    public int RejectedQuoteCount { get; set; }
    public decimal WeightedPipelineValue { get; set; }
    public int DiscountAnomalyCount { get; set; }
    public int StalledQuoteCount { get; set; }
    public int OrdersAwaitingFulfillment { get; set; }
    public int BackorderCount { get; set; }
    public decimal BackorderValue { get; set; }
    public decimal OutstandingInvoiceAmount { get; set; }
    public int OverdueInvoiceCount { get; set; }
    public decimal RecurringRevenueScheduled { get; set; }
}

public class ReportResponse
{
    public string ReportType { get; set; } = string.Empty;
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<ReportRow> Rows { get; set; } = new();
    public Dictionary<string, decimal> Summary { get; set; } = new();
}

public class ReportRow
{
    public Dictionary<string, object?> Data { get; set; } = new();
}

public class PlatformOverviewResponse
{
    public int TotalCustomers { get; set; }
    public int TotalSalesReps { get; set; }
    public int TotalSalesManagers { get; set; }
    public int TotalFinanceUsers { get; set; }
    public int TotalQuotations { get; set; }
    public Dictionary<string, int> QuoteStatusDistribution { get; set; } = new();
    public int TotalOrders { get; set; }
    public decimal TotalBookedRevenue { get; set; }
    public decimal TotalQuotedRevenue { get; set; }
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public int PendingApprovalsCount { get; set; }
    public int ActiveFulfillmentsCount { get; set; }
    public int BackordersCount { get; set; }
    public int ActiveSubscriptionsCount { get; set; }
    public decimal MonthlyRecurringRevenue { get; set; }
    public decimal AnnualRecurringRevenue { get; set; }
    public int AtRiskDealsCount { get; set; }
    public int TotalWarehouses { get; set; }
    public int TotalStockOnHand { get; set; }
    public int TotalStockReserved { get; set; }
}

public class AdminAuditLogDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? OldValueJson { get; set; }
    public string? NewValueJson { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
