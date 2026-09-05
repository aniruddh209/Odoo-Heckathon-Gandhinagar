using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public class AllocationResult
{
    public List<WarehouseAllocation> Allocations { get; set; } = new();
    public List<Backorder> Backorders { get; set; } = new();
    public bool IsFullyAllocated { get; set; }
}

public interface IWarehouseAllocationEngine
{
    AllocationResult CalculateAllocation(Order order, IEnumerable<Warehouse> warehouses, IEnumerable<InventoryStock> stocks);
}

public class WarehouseAllocationEngine : IWarehouseAllocationEngine
{
    public AllocationResult CalculateAllocation(Order order, IEnumerable<Warehouse> warehouses, IEnumerable<InventoryStock> stocks)
    {
        var result = new AllocationResult();
        var stockMap = stocks.ToDictionary(s => (s.WarehouseId, s.ProductId));
        var sortedWarehouses = warehouses.Where(w => w.IsActive).OrderBy(w => w.ShippingCostWeight).ToList();

        bool allLinesFulfilled = true;

        foreach (var line in order.Lines)
        {
            if (line.Product?.ProductType == ProductType.Subscription) continue;

            var remainingQty = line.Quantity;

            // Single-Depot Feasibility (Hop Minimization)
            var optimalSingleWarehouse = sortedWarehouses.FirstOrDefault(w =>
                stockMap.TryGetValue((w.Id, line.ProductId), out var s) && (s.OnHand - s.Reserved) >= remainingQty);

            if (optimalSingleWarehouse != null)
            {
                var stock = stockMap[(optimalSingleWarehouse.Id, line.ProductId)];
                stock.Reserved += remainingQty;
                
                result.Allocations.Add(new WarehouseAllocation
                {
                    OrderLineId = line.Id,
                    WarehouseId = optimalSingleWarehouse.Id,
                    Quantity = remainingQty,
                    ShipmentCost = remainingQty * optimalSingleWarehouse.ShippingCostWeight
                });
                
                continue; // Next line
            }

            // Multi-Depot Greedy Split (Fallback)
            foreach (var warehouse in sortedWarehouses)
            {
                if (remainingQty <= 0) break;

                if (stockMap.TryGetValue((warehouse.Id, line.ProductId), out var stock))
                {
                    var availableStock = stock.OnHand - stock.Reserved;
                    if (availableStock > 0)
                    {
                        var allocateQty = Math.Min(remainingQty, availableStock);
                        stock.Reserved += allocateQty;
                        remainingQty -= allocateQty;

                        result.Allocations.Add(new WarehouseAllocation
                        {
                            OrderLineId = line.Id,
                            WarehouseId = warehouse.Id,
                            Quantity = allocateQty,
                            ShipmentCost = allocateQty * warehouse.ShippingCostWeight
                        });
                    }
                }
            }

            if (remainingQty > 0)
            {
                allLinesFulfilled = false;
                result.Backorders.Add(new Backorder
                {
                    OrderId = order.Id,
                    OrderLineId = line.Id,
                    ProductId = line.ProductId,
                    Quantity = remainingQty,
                    Status = "Pending",
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }

        result.IsFullyAllocated = allLinesFulfilled;
        return result;
    }
}
