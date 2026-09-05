namespace DealFlow360.API.DTOs.PriceLists;

public class CreatePriceListRequest
{
    public string Name { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "INR";
    public int? TierId { get; set; }
}

public class UpdatePriceListRequest
{
    public string Name { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "INR";
    public int? TierId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpsertPriceListItemRequest
{
    public int ProductId { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public decimal UnitPrice { get; set; }
}

public class PriceListResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public int? TierId { get; set; }
    public string? TierName { get; set; }
    public bool IsActive { get; set; }
    public List<PriceListItemResponse> Items { get; set; } = new();
}

public class PriceListItemResponse
{
    public int Id { get; set; }
    public int PriceListId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
}
