namespace DealFlow360.API.DTOs.UpsellRules;

public class CreateUpsellRuleRequest
{
    public int TriggerProductId { get; set; }
    public int SuggestedProductId { get; set; }
    public string RuleType { get; set; } = "CrossSell";
    public int Score { get; set; }
    public bool IsPromoted { get; set; }
}

public class UpdateUpsellRuleRequest
{
    public int TriggerProductId { get; set; }
    public int SuggestedProductId { get; set; }
    public string RuleType { get; set; } = "CrossSell";
    public int Score { get; set; }
    public bool IsPromoted { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpsellRuleResponse
{
    public int Id { get; set; }
    public int TriggerProductId { get; set; }
    public string TriggerProductName { get; set; } = string.Empty;
    public int SuggestedProductId { get; set; }
    public string SuggestedProductName { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool IsPromoted { get; set; }
    public bool IsActive { get; set; }
}
