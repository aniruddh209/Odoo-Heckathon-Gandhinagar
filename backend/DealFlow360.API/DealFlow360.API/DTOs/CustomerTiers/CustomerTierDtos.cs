namespace DealFlow360.API.DTOs.CustomerTiers;

public class CreateCustomerTierRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal MaxDiscountPercent { get; set; }
}

public class UpdateCustomerTierRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal MaxDiscountPercent { get; set; }
}

public class CustomerTierResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MaxDiscountPercent { get; set; }
}
