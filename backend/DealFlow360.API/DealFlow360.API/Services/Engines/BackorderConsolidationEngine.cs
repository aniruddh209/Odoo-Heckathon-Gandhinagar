using DealFlow360.API.Models;

namespace DealFlow360.API.Services.Engines;

public class ConsolidationResult
{
    public List<WarehouseAllocation> NewAllocations { get; set; } = new();
    public List<Backorder> ResolvedBackorders { get; set; } = new();
}

public interface IBackorderConsolidationEngine
{
    ConsolidationResult ConsolidateBackorders(Warehouse warehouse, InventoryStock stock, IEnumerable<Backorder> pendingBackorders);
}

public class BackorderConsolidationEngine : IBackorderConsolidationEngine
{
    public ConsolidationResult ConsolidateBackorders(Warehouse warehouse, InventoryStock stock, IEnumerable<Backorder> pendingBackorders)
    {
        var result = new ConsolidationResult();
        var availableQty = stock.OnHand - stock.Reserved;
        if (availableQty <= 0) return result;

        var matchingBackorders = pendingBackorders
            .Where(b => b.ProductId == stock.ProductId && b.Status == "Pending")
            .OrderBy(b => b.CreatedAtUtc)
            .ToList();

        foreach (var backorder in matchingBackorders)
        {
            if (availableQty <= 0) break;

            var fulfillQty = Math.Min(availableQty, backorder.Quantity);
            stock.Reserved += fulfillQty;
            availableQty -= fulfillQty;

            result.NewAllocations.Add(new WarehouseAllocation
            {
                OrderLineId = backorder.OrderLineId,
                WarehouseId = warehouse.Id,
                Quantity = fulfillQty,
                ShipmentCost = Math.Round(fulfillQty * warehouse.ShippingCostWeight, 2)
            });

            if (fulfillQty == backorder.Quantity)
            {
                backorder.Status = "Consolidated";
                result.ResolvedBackorders.Add(backorder);
            }
            else
            {
                backorder.Quantity -= fulfillQty;
            }
        }

        return result;
    }
}
