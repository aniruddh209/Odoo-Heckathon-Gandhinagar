namespace DealFlow360.API.DTOs.Warehouses;

public class CreateWarehouseRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal ShippingCostWeight { get; set; }
}

public class UpdateWarehouseRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal ShippingCostWeight { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AdjustStockRequest
{
    public int ProductId { get; set; }
    public int OnHand { get; set; }
    public int? Reserved { get; set; }
}

public class WarehouseResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal ShippingCostWeight { get; set; }
    public bool IsActive { get; set; }
}

public class StockResponse
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int OnHand { get; set; }
    public int Reserved { get; set; }
    public int Available { get; set; }
}

public class CreateReplenishmentRuleRequest
{
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public int ReorderLevel { get; set; }
    public int ReorderQuantity { get; set; }
}

public class UpdateReplenishmentRuleRequest
{
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public int ReorderLevel { get; set; }
    public int ReorderQuantity { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ReplenishmentRuleResponse
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int ReorderLevel { get; set; }
    public int ReorderQuantity { get; set; }
    public bool IsActive { get; set; }
    public int CurrentStock { get; set; }
}
