using DealFlow360.API.DTOs.Users;

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
    public int TierId { get; set; }
    public string TierName { get; set; } = string.Empty;
    public decimal TierMaxDiscount { get; set; }
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
    public int? AssignedSalesRepId { get; set; }
    public string? AssignedSalesRepName { get; set; }
}

public class CreateCustomerResponse
{
    public CustomerDetailResponse Customer { get; set; } = null!;
    public UserResponse? User { get; set; }
    public string? TemporaryPassword { get; set; }
}

public class CustomerOverviewKpis
{
    public decimal TotalLifetimeValue { get; set; }
    public int TotalQuotationsCount { get; set; }
    public int ActiveQuotationsCount { get; set; }
    public decimal ActiveQuotationsValue { get; set; }
    public int ConfirmedOrdersCount { get; set; }
    public decimal ConfirmedOrdersValue { get; set; }
    public int TotalInvoicesCount { get; set; }
    public decimal TotalOutstandingBalance { get; set; }
}

public class CustomerProductHistoryItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int TotalQuantityPurchased { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime? LastPurchasedAtUtc { get; set; }
}

public class CustomerActivityEvent
{
    public string EventType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime TimestampUtc { get; set; }
    public string? ReferenceNumber { get; set; }
}

public class Customer360Response
{
    public CustomerDetailResponse Customer { get; set; } = null!;
    public CustomerOverviewKpis Overview { get; set; } = new();
    public List<DealFlow360.API.DTOs.Portal.CustomerQuoteDto> Quotations { get; set; } = new();
    public List<DealFlow360.API.DTOs.Orders.OrderListResponse> Orders { get; set; } = new();
    public List<DealFlow360.API.DTOs.Invoices.InvoiceListResponse> Invoices { get; set; } = new();
    public List<CustomerProductHistoryItem> ProductHistory { get; set; } = new();
    public List<CustomerActivityEvent> ActivityTimeline { get; set; } = new();
    public List<DealFlow360.API.DTOs.Users.UserResponse> AssociatedUsers { get; set; } = new();
    public List<DealFlow360.API.DTOs.SalesConnections.SalesConnectionResponse> SalesConnections { get; set; } = new();
}
