namespace DealFlow360.API.DTOs.DiscountRules;

public class CreateDiscountRuleRequest
{
    public int TierId { get; set; }
    public int? CategoryId { get; set; }
    public decimal MaxDiscountPercent { get; set; }
    public decimal ManagerThreshold { get; set; }
    public decimal FinanceThreshold { get; set; }
}

public class UpdateDiscountRuleRequest
{
    public int TierId { get; set; }
    public int? CategoryId { get; set; }
    public decimal MaxDiscountPercent { get; set; }
    public decimal ManagerThreshold { get; set; }
    public decimal FinanceThreshold { get; set; }
    public bool IsActive { get; set; } = true;
}

public class DiscountRuleResponse
{
    public int Id { get; set; }
    public int TierId { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public decimal MaxDiscountPercent { get; set; }
    public decimal ManagerThreshold { get; set; }
    public decimal FinanceThreshold { get; set; }
    public bool IsActive { get; set; }
}
