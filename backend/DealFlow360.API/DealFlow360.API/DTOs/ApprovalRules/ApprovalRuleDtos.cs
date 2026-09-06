namespace DealFlow360.API.DTOs.ApprovalRules;

public class CreateApprovalRuleRequest
{
    public string Level { get; set; } = string.Empty; // Manager, Finance
    public decimal MinRisk { get; set; }
    public decimal MaxRisk { get; set; }
    public string RequiredRole { get; set; } = string.Empty;
    public int Sequence { get; set; }
}

public class UpdateApprovalRuleRequest
{
    public string Level { get; set; } = string.Empty;
    public decimal MinRisk { get; set; }
    public decimal MaxRisk { get; set; }
    public string RequiredRole { get; set; } = string.Empty;
    public int Sequence { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ApprovalRuleResponse
{
    public int Id { get; set; }
    public string Level { get; set; } = string.Empty;
    public decimal MinRisk { get; set; }
    public decimal MaxRisk { get; set; }
    public string RequiredRole { get; set; } = string.Empty;
    public int Sequence { get; set; }
    public bool IsActive { get; set; }
}
