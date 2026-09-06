namespace DealFlow360.API.DTOs.Pipeline;

public class PipelineResponse
{
    public decimal TotalPipelineValue { get; set; }
    public int TotalDeals { get; set; }
    public List<PipelineStageDto> Stages { get; set; } = new();
}

public class PipelineStageDto
{
    public string StageName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
    public List<PipelineItemDto> Items { get; set; } = new();
}

public class PipelineItemDto
{
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string SalesRepName { get; set; } = string.Empty;
    public decimal GrandTotal { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
    public string? HealthStatus { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public DateTime? LastActivityDate { get; set; }
}
