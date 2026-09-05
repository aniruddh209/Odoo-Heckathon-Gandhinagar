using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public interface IFulfillmentEngine
{
    OrderStatus DetermineOrderStatus(Order order, IEnumerable<WarehouseAllocation> allocations, IEnumerable<Backorder> backorders);
}

public class FulfillmentEngine : IFulfillmentEngine
{
    public OrderStatus DetermineOrderStatus(Order order, IEnumerable<WarehouseAllocation> allocations, IEnumerable<Backorder> backorders)
    {
        var hasAllocations = allocations.Any();
        var hasBackorders = backorders.Any(b => b.Status == "Pending");

        if (!hasAllocations && hasBackorders) return OrderStatus.Confirmed;
        if (hasAllocations && hasBackorders) return OrderStatus.PartiallyAllocated;
        if (hasAllocations && !hasBackorders) return OrderStatus.Allocated;

        return OrderStatus.Confirmed;
    }
}
