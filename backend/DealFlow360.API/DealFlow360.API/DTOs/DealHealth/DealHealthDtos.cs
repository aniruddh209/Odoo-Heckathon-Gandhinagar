namespace DealFlow360.API.DTOs.DealHealth;

public class DealHealthSummaryResponse
{
    public int TotalActiveDeals { get; set; }
    public int HealthyCount { get; set; }
    public int AtRiskCount { get; set; }
    public int CriticalCount { get; set; }
    public int StalledDealsCount { get; set; }
    public int DiscountAnomaliesCount { get; set; }
    public int HighRiskDealsCount { get; set; }
    public decimal HealthScore { get; set; }
    public List<DealHealthAlertResponse> Alerts { get; set; } = new();
}

public class DealHealthAlertResponse
{
    public int Id { get; set; }
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string? EntityNumber { get; set; }
    public string? CustomerName { get; set; }
    public int HealthScore { get; set; }
    public string AlertType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // Low, Medium, High, Critical
    public string SignalType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? SignalDescription { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class QuotationHealthResponse
{
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public int HealthScore { get; set; }
    public string Severity { get; set; } = string.Empty;
    public List<HealthSignal> Signals { get; set; } = new();
}

public class HealthSignal
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public int PenaltyPoints { get; set; }
}
