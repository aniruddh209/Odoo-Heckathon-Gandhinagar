namespace DealFlow360.API.DTOs.SubscriptionPlans;

public class CreateSubscriptionPlanRequest
{
    public string Name { get; set; } = string.Empty;
    public string BillingFrequency { get; set; } = string.Empty;
    public int BillingIntervalMonths { get; set; }
}

public class UpdateSubscriptionPlanRequest
{
    public string Name { get; set; } = string.Empty;
    public string BillingFrequency { get; set; } = string.Empty;
    public int BillingIntervalMonths { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SubscriptionPlanResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BillingFrequency { get; set; } = string.Empty;
    public int BillingIntervalMonths { get; set; }
    public bool IsActive { get; set; }
}
