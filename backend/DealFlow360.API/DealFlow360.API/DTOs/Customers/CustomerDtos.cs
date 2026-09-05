namespace DealFlow360.API.DTOs.Customers;

public class CreateCustomerRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int TierId { get; set; }
    public string CurrencyCode { get; set; } = "INR";
}

public class UpdateCustomerRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int TierId { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public bool IsActive { get; set; } = true;
}

public class CustomerListResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CustomerDetailResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int TierId { get; set; }
    public string TierName { get; set; } = string.Empty;
    public decimal TierMaxDiscount { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
