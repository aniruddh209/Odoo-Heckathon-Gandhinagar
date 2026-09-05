namespace DealFlow360.API.DTOs.Approvals;

public class ApprovalActionRequest
{
    public string Action { get; set; } = string.Empty; // Approved, Rejected, Returned
    public string? Reason { get; set; }
}

public class ApprovalQueueResponse
{
    public int Id { get; set; }
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string SalesRepName { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal GrandTotal { get; set; }
    public decimal RiskScore { get; set; }
    public DateTime RequestedAtUtc { get; set; }
    public string? Reason { get; set; }
}

public class ApprovalDetailResponse
{
    public int Id { get; set; }
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string SalesRepName { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal GrandTotal { get; set; }
    public decimal RiskScore { get; set; }
    public int Sequence { get; set; }
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? ActedAtUtc { get; set; }
    public string? ActedByName { get; set; }
    public string? Reason { get; set; }
    public List<ApprovalHistoryResponse> History { get; set; } = new();
    public List<ApprovalActionResponse> Actions { get; set; } = new();
}

public class ApprovalActionResponse
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class ApprovalHistoryResponse
{
    public int Id { get; set; }
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<ApprovalDetailResponse> Steps { get; set; } = new();
}
