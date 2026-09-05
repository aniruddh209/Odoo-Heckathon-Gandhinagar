namespace DealFlow360.API.DTOs.Fulfillment;

public class FulfillmentOverrideRequest
{
    public List<AllocationOverride> Allocations { get; set; } = new();
}

public class AllocationOverride
{
    public int OrderLineId { get; set; }
    public int WarehouseId { get; set; }
    public int Quantity { get; set; }
}

public class FulfillmentPreviewResponse
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public bool IsFullyAllocated { get; set; }
    public List<AllocationResponse> Allocations { get; set; } = new();
    public List<BackorderResponse> Backorders { get; set; } = new();
    public List<LineAllocationPreview> Lines { get; set; } = new();
    public int TotalShipments { get; set; }
    public decimal TotalShipmentCost { get; set; }
}

public class LineAllocationPreview
{
    public int OrderLineId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int RequiredQuantity { get; set; }
    public List<WarehouseAllocationPreview> Allocations { get; set; } = new();
    public int BackorderQuantity { get; set; }
}

public class WarehouseAllocationPreview
{
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int AvailableQuantity { get; set; }
    public int AllocatedQuantity { get; set; }
    public decimal ShipmentCost { get; set; }
}

public class BackorderPreview
{
    public int OrderLineId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class AllocationResponse
{
    public int Id { get; set; }
    public int OrderLineId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal ShipmentCost { get; set; }
}

public class BackorderResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int OrderLineId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class OrderFulfillmentSummaryResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public int LineCount { get; set; }
    public bool HasAllocations { get; set; }
    public bool HasBackorders { get; set; }
}

public class ConsolidateBackorderResponse
{
    public int OrderId { get; set; }
    public string Message { get; set; } = string.Empty;
    public int ConsolidatedAllocationsCount { get; set; }
    public int RemainingBackordersCount { get; set; }
    public string NewOrderStatus { get; set; } = string.Empty;
}
