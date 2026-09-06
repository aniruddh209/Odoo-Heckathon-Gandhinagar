using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public class AllocationResult
{
    public List<WarehouseAllocation> Allocations { get; set; } = new();
    public List<Backorder> Backorders { get; set; } = new();
    public bool IsFullyAllocated { get; set; }
    public int TotalShipments { get; set; }
    public decimal TotalShipmentCost { get; set; }
}

public interface IWarehouseAllocationEngine
{
    AllocationResult CalculateAllocation(Order order, IEnumerable<Warehouse> warehouses, IEnumerable<InventoryStock> stocks);
}

public class WarehouseAllocationEngine : IWarehouseAllocationEngine
{
    private const decimal BaseShipmentUnitCost = 10.00m;

    public AllocationResult CalculateAllocation(Order order, IEnumerable<Warehouse> warehouses, IEnumerable<InventoryStock> stocks)
    {
        var result = new AllocationResult();
        var activeWarehouses = warehouses.Where(w => w.IsActive).OrderBy(w => w.ShippingCostWeight).ToList();
        if (!activeWarehouses.Any())
        {
            // No warehouses active - everything backordered
            foreach (var line in order.Lines.Where(l => l.Product?.ProductType != ProductType.Subscription))
            {
                result.Backorders.Add(new Backorder
                {
                    OrderId = order.Id,
                    OrderLineId = line.Id,
                    ProductId = line.ProductId,
                    Quantity = line.Quantity,
                    Status = "Pending",
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            result.IsFullyAllocated = false;
            return result;
        }

        // Local copy of available stock to avoid unintended EF entity side effects
        var stockMap = stocks.ToDictionary(
            s => (s.WarehouseId, s.ProductId),
            s => Math.Max(0, s.OnHand - s.Reserved)
        );

        var physicalLines = order.Lines
            .Where(l => l.Product?.ProductType != ProductType.Subscription && l.Quantity > 0)
            .ToList();

        if (!physicalLines.Any())
        {
            result.IsFullyAllocated = true;
            return result;
        }

        // ═══════════════════════════════════════════════════════════════
        // PHASE 1: SINGLE WAREHOUSE ORDER-LEVEL FULFILLMENT (k = 1)
        // Primary Objective: Minimize Shipments (1 depot for whole order)
        // ═══════════════════════════════════════════════════════════════
        var singleWarehouseCandidates = new List<(Warehouse Warehouse, decimal TotalCost)>();

        foreach (var wh in activeWarehouses)
        {
            bool canFulfillEntireOrder = physicalLines.All(line =>
                stockMap.TryGetValue((wh.Id, line.ProductId), out var avail) && avail >= line.Quantity);

            if (canFulfillEntireOrder)
            {
                decimal totalCost = physicalLines.Sum(line => line.Quantity * wh.ShippingCostWeight * BaseShipmentUnitCost);
                singleWarehouseCandidates.Add((wh, totalCost));
            }
        }

        if (singleWarehouseCandidates.Any())
        {
            // Pick candidate with lowest shipping cost
            var bestSingle = singleWarehouseCandidates.OrderBy(c => c.TotalCost).First();
            var wh = bestSingle.Warehouse;

            foreach (var line in physicalLines)
            {
                result.Allocations.Add(new WarehouseAllocation
                {
                    OrderLineId = line.Id,
                    WarehouseId = wh.Id,
                    Quantity = line.Quantity,
                    ShipmentCost = line.Quantity * wh.ShippingCostWeight * BaseShipmentUnitCost,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            result.IsFullyAllocated = true;
            result.TotalShipments = 1;
            result.TotalShipmentCost = result.Allocations.Sum(a => a.ShipmentCost);
            return result;
        }

        // ═══════════════════════════════════════════════════════════════
        // PHASE 2: TWO-WAREHOUSE COMBINATORIAL SEARCH (k = 2)
        // Check if any pair of warehouses can fulfill the complete order
        // ═══════════════════════════════════════════════════════════════
        var validPairCandidates = new List<(Warehouse W1, Warehouse W2, List<WarehouseAllocation> Allocations, decimal TotalCost)>();

        for (int i = 0; i < activeWarehouses.Count; i++)
        {
            for (int j = i + 1; j < activeWarehouses.Count; j++)
            {
                var w1 = activeWarehouses[i];
                var w2 = activeWarehouses[j];

                bool pairCanFulfill = physicalLines.All(line =>
                {
                    int a1 = stockMap.GetValueOrDefault((w1.Id, line.ProductId), 0);
                    int a2 = stockMap.GetValueOrDefault((w2.Id, line.ProductId), 0);
                    return (a1 + a2) >= line.Quantity;
                });

                if (pairCanFulfill)
                {
                    // Allocate greedily between w1 and w2 prioritizing lower cost weight
                    var pairAllocations = new List<WarehouseAllocation>();
                    var primary = w1.ShippingCostWeight <= w2.ShippingCostWeight ? w1 : w2;
                    var secondary = primary == w1 ? w2 : w1;

                    foreach (var line in physicalLines)
                    {
                        int req = line.Quantity;
                        int availPrimary = stockMap.GetValueOrDefault((primary.Id, line.ProductId), 0);
                        int fromPrimary = Math.Min(req, availPrimary);
                        int fromSecondary = req - fromPrimary;

                        if (fromPrimary > 0)
                        {
                            pairAllocations.Add(new WarehouseAllocation
                            {
                                OrderLineId = line.Id,
                                WarehouseId = primary.Id,
                                Quantity = fromPrimary,
                                ShipmentCost = fromPrimary * primary.ShippingCostWeight * BaseShipmentUnitCost,
                                CreatedAtUtc = DateTime.UtcNow
                            });
                        }
                        if (fromSecondary > 0)
                        {
                            pairAllocations.Add(new WarehouseAllocation
                            {
                                OrderLineId = line.Id,
                                WarehouseId = secondary.Id,
                                Quantity = fromSecondary,
                                ShipmentCost = fromSecondary * secondary.ShippingCostWeight * BaseShipmentUnitCost,
                                CreatedAtUtc = DateTime.UtcNow
                            });
                        }
                    }

                    decimal totalPairCost = pairAllocations.Sum(a => a.ShipmentCost);
                    validPairCandidates.Add((w1, w2, pairAllocations, totalPairCost));
                }
            }
        }

        if (validPairCandidates.Any())
        {
            // Pick pair with lowest total shipping cost (Test 2, Test 5)
            var bestPair = validPairCandidates.OrderBy(c => c.TotalCost).First();
            result.Allocations = bestPair.Allocations;
            result.IsFullyAllocated = true;
            result.TotalShipments = result.Allocations.Select(a => a.WarehouseId).Distinct().Count();
            result.TotalShipmentCost = bestPair.TotalCost;
            return result;
        }

        // ═══════════════════════════════════════════════════════════════
        // PHASE 3: GREEDY MULTI-WAREHOUSE SPLIT WITH LINE-LEVEL BACKORDERS (Test 3)
        // ═══════════════════════════════════════════════════════════════
        bool allFulfilled = true;

        foreach (var line in physicalLines)
        {
            int remainingQty = line.Quantity;

            foreach (var wh in activeWarehouses)
            {
                if (remainingQty <= 0) break;

                int avail = stockMap.GetValueOrDefault((wh.Id, line.ProductId), 0);
                if (avail > 0)
                {
                    int take = Math.Min(remainingQty, avail);
                    stockMap[(wh.Id, line.ProductId)] = avail - take;
                    remainingQty -= take;

                    result.Allocations.Add(new WarehouseAllocation
                    {
                        OrderLineId = line.Id,
                        WarehouseId = wh.Id,
                        Quantity = take,
                        ShipmentCost = take * wh.ShippingCostWeight * BaseShipmentUnitCost,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
            }

            if (remainingQty > 0)
            {
                allFulfilled = false;
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

        result.IsFullyAllocated = allFulfilled;
        result.TotalShipments = result.Allocations.Select(a => a.WarehouseId).Distinct().Count();
        result.TotalShipmentCost = result.Allocations.Sum(a => a.ShipmentCost);
        return result;
    }
}

