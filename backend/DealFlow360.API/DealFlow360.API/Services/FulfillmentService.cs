using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Fulfillment;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IFulfillmentService
{
    Task<List<OrderFulfillmentSummaryResponse>> GetOrdersForFulfillmentAsync();
    Task<FulfillmentPreviewResponse> PreviewAllocationAsync(int orderId);
    Task<FulfillmentPreviewResponse> ExecuteAllocationAsync(int orderId);
    Task<List<BackorderResponse>> GetBackordersAsync();
    Task<BackorderResponse> CancelBackorderAsync(int backorderId);
    Task ConsolidateOnReplenishmentAsync(int warehouseId, int productId);
    Task<FulfillmentPreviewResponse> OverrideAllocationAsync(int orderId, FulfillmentOverrideRequest request);
    Task<ConsolidateBackorderResponse> ConsolidateOrderBackordersAsync(int orderId);
    Task<ConsolidationOptionResponse> GetConsolidationOptionsAsync(int orderId);
}

public class FulfillmentService : IFulfillmentService
{
    private readonly AppDbContext _context;
    private readonly IWarehouseAllocationEngine _allocationEngine;
    private readonly IFulfillmentEngine _fulfillmentEngine;
    private readonly IBackorderConsolidationEngine _consolidationEngine;

    public FulfillmentService(
        AppDbContext context,
        IWarehouseAllocationEngine allocationEngine,
        IFulfillmentEngine fulfillmentEngine,
        IBackorderConsolidationEngine consolidationEngine)
    {
        _context = context;
        _allocationEngine = allocationEngine;
        _fulfillmentEngine = fulfillmentEngine;
        _consolidationEngine = consolidationEngine;
    }

    public async Task<List<OrderFulfillmentSummaryResponse>> GetOrdersForFulfillmentAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Lines)
            .Include(o => o.Backorders)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync();

        var orderLineIds = orders.SelectMany(o => o.Lines).Select(l => l.Id).ToList();
        var allocatedLineIds = await _context.WarehouseAllocations
            .Where(a => orderLineIds.Contains(a.OrderLineId))
            .Select(a => a.OrderLineId)
            .Distinct()
            .ToListAsync();
        var allocatedLineSet = new HashSet<int>(allocatedLineIds);

        return orders.Select(o => new OrderFulfillmentSummaryResponse
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            CustomerId = o.CustomerId,
            CustomerName = o.Customer?.Name ?? string.Empty,
            Total = o.Total,
            Status = o.Status.ToString(),
            CreatedAtUtc = o.CreatedAtUtc,
            LineCount = o.Lines.Count,
            HasAllocations = o.Lines.Any(l => allocatedLineSet.Contains(l.Id)),
            HasBackorders = o.Backorders.Any(b => b.Status == "Pending")
        }).ToList();
    }

    public async Task<FulfillmentPreviewResponse> PreviewAllocationAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException($"Order {orderId} not found.");

        var orderLineIds = order.Lines.Select(l => l.Id).ToList();
        var existingAllocations = await _context.WarehouseAllocations
            .Where(a => orderLineIds.Contains(a.OrderLineId))
            .ToListAsync();
        var existingBackorders = await _context.Backorders
            .Where(b => b.OrderId == order.Id)
            .ToListAsync();

        var warehouseMap = await _context.Warehouses.ToDictionaryAsync(w => w.Id);
        var productMap = await _context.Products.ToDictionaryAsync(p => p.Id);

        if (existingAllocations.Any() || existingBackorders.Any())
        {
            int totalShipments = existingAllocations.Select(a => a.WarehouseId).Distinct().Count();
            decimal totalCost = existingAllocations.Sum(a => a.ShipmentCost);
            bool isFullyAllocated = !existingBackorders.Any(b => b.Status == "Pending");

            return new FulfillmentPreviewResponse
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                IsFullyAllocated = isFullyAllocated,
                TotalShipments = totalShipments,
                TotalShipmentCost = totalCost,
                Allocations = existingAllocations.Select(a => new AllocationResponse
                {
                    OrderLineId = a.OrderLineId,
                    ProductName = order.Lines.FirstOrDefault(ol => ol.Id == a.OrderLineId)?.Product?.Name ?? string.Empty,
                    WarehouseId = a.WarehouseId,
                    WarehouseName = warehouseMap.GetValueOrDefault(a.WarehouseId)?.Name ?? string.Empty,
                    Quantity = a.Quantity,
                    ShipmentCost = a.ShipmentCost
                }).ToList(),
                Backorders = existingBackorders.Select(b => new BackorderResponse
                {
                    Id = b.Id,
                    OrderId = b.OrderId,
                    OrderLineId = b.OrderLineId,
                    ProductId = b.ProductId,
                    ProductName = productMap.GetValueOrDefault(b.ProductId)?.Name ?? string.Empty,
                    Quantity = b.Quantity,
                    Status = b.Status,
                    CreatedAtUtc = b.CreatedAtUtc
                }).ToList()
            };
        }

        var warehouses = await _context.Warehouses.ToListAsync();
        var stocks = await _context.InventoryStocks.ToListAsync();

        var result = _allocationEngine.CalculateAllocation(order, warehouses, stocks);

        return new FulfillmentPreviewResponse
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            IsFullyAllocated = result.IsFullyAllocated,
            TotalShipments = result.TotalShipments,
            TotalShipmentCost = result.TotalShipmentCost,
            Allocations = result.Allocations.Select(a => new AllocationResponse
            {
                OrderLineId = a.OrderLineId,
                ProductName = order.Lines.FirstOrDefault(ol => ol.Id == a.OrderLineId)?.Product?.Name ?? string.Empty,
                WarehouseId = a.WarehouseId,
                WarehouseName = warehouseMap.GetValueOrDefault(a.WarehouseId)?.Name ?? string.Empty,
                Quantity = a.Quantity,
                ShipmentCost = a.ShipmentCost
            }).ToList(),
            Backorders = result.Backorders.Select(b => new BackorderResponse
            {
                OrderId = b.OrderId,
                OrderLineId = b.OrderLineId,
                ProductId = b.ProductId,
                ProductName = productMap.GetValueOrDefault(b.ProductId)?.Name ?? string.Empty,
                Quantity = b.Quantity,
                Status = b.Status
            }).ToList()
        };
    }

    public async Task<FulfillmentPreviewResponse> ExecuteAllocationAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException($"Order {orderId} not found.");

        if (order.Status == OrderStatus.Allocated || order.Status == OrderStatus.Fulfilled)
        {
            throw new InvalidOperationException($"Order {order.OrderNumber} has already been allocated (Status: {order.Status}).");
        }

        var orderLineIds = order.Lines.Select(l => l.Id).ToList();
        var hasExistingAllocations = await _context.WarehouseAllocations
            .AnyAsync(a => orderLineIds.Contains(a.OrderLineId));
        if (hasExistingAllocations)
        {
            throw new InvalidOperationException($"Order {order.OrderNumber} already has warehouse allocations recorded.");
        }

        var warehouses = await _context.Warehouses.ToListAsync();
        var stocks = await _context.InventoryStocks.ToListAsync();

        var result = _allocationEngine.CalculateAllocation(order, warehouses, stocks);

        // LIVE CONCURRENCY VALIDATION (Test 6)
        // Verify inventory availability immediately before committing reservations
        foreach (var alloc in result.Allocations)
        {
            var line = order.Lines.FirstOrDefault(l => l.Id == alloc.OrderLineId);
            if (line == null) continue;

            var stock = stocks.FirstOrDefault(s => s.WarehouseId == alloc.WarehouseId && s.ProductId == line.ProductId);
            if (stock == null)
            {
                throw new InvalidOperationException($"Stock record missing for Product {line.ProductId} at Warehouse {alloc.WarehouseId}.");
            }

            int available = stock.OnHand - stock.Reserved;
            if (available < alloc.Quantity)
            {
                throw new InvalidOperationException(
                    $"Concurrency conflict: Available inventory at Warehouse {alloc.WarehouseId} for Product {line.ProductId} is insufficient ({available} available, {alloc.Quantity} required). Allocation rejected to prevent overselling.");
            }

            // Reserve stock
            stock.Reserved += alloc.Quantity;
            stock.UpdatedAtUtc = DateTime.UtcNow;
        }

        _context.WarehouseAllocations.AddRange(result.Allocations);
        _context.Backorders.AddRange(result.Backorders);
        _context.InventoryStocks.UpdateRange(stocks);

        var newStatus = _fulfillmentEngine.DetermineOrderStatus(order, result.Allocations, result.Backorders);
        order.Status = newStatus;
        order.UpdatedAtUtc = DateTime.UtcNow;

        _context.Orders.Update(order);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Order",
            EntityId = order.Id,
            Action = "FulfillmentAllocated",
            Reason = $"Allocated {result.Allocations.Count} warehouse split(s), created {result.Backorders.Count} backorder(s). Resulting status: {newStatus}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return await PreviewAllocationAsync(orderId);
    }

    public async Task<List<BackorderResponse>> GetBackordersAsync()
    {
        var backorders = await _context.Backorders
            .Include(b => b.Product)
            .Where(b => b.Status == "Pending")
            .OrderByDescending(b => b.CreatedAtUtc)
            .ToListAsync();

        return backorders.Select(b => new BackorderResponse
        {
            Id = b.Id,
            OrderId = b.OrderId,
            OrderLineId = b.OrderLineId,
            ProductId = b.ProductId,
            ProductName = b.Product?.Name ?? string.Empty,
            Quantity = b.Quantity,
            Status = b.Status,
            CreatedAtUtc = b.CreatedAtUtc
        }).ToList();
    }

    public async Task<BackorderResponse> CancelBackorderAsync(int backorderId)
    {
        var backorder = await _context.Backorders
            .Include(b => b.Product)
            .FirstOrDefaultAsync(b => b.Id == backorderId);

        if (backorder == null) throw new KeyNotFoundException($"Backorder {backorderId} not found.");

        if (backorder.Status != "Pending")
        {
            throw new InvalidOperationException($"Backorder {backorderId} is already {backorder.Status} and cannot be cancelled.");
        }

        backorder.Status = "Cancelled";
        backorder.UpdatedAtUtc = DateTime.UtcNow;
        _context.Backorders.Update(backorder);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Backorder",
            EntityId = backorder.Id,
            Action = "BackorderCancelled",
            Reason = $"Backorder of {backorder.Quantity} units of product {backorder.Product?.Name ?? backorder.ProductId.ToString()} cancelled.",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new BackorderResponse
        {
            Id = backorder.Id,
            OrderId = backorder.OrderId,
            OrderLineId = backorder.OrderLineId,
            ProductId = backorder.ProductId,
            ProductName = backorder.Product?.Name ?? string.Empty,
            Quantity = backorder.Quantity,
            Status = backorder.Status,
            CreatedAtUtc = backorder.CreatedAtUtc
        };
    }

    public async Task ConsolidateOnReplenishmentAsync(int warehouseId, int productId)
    {
        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == warehouseId && s.ProductId == productId);
        var pendingBackorders = await _context.Backorders.Where(b => b.ProductId == productId && b.Status == "Pending").ToListAsync();

        if (warehouse != null && stock != null && pendingBackorders.Any())
        {
            var consolidation = _consolidationEngine.ConsolidateBackorders(warehouse, stock, pendingBackorders);

            _context.WarehouseAllocations.AddRange(consolidation.NewAllocations);
            _context.Backorders.UpdateRange(consolidation.ResolvedBackorders);
            _context.InventoryStocks.Update(stock);

            await _context.SaveChangesAsync();
        }
    }
    public async Task<FulfillmentPreviewResponse> OverrideAllocationAsync(int orderId, FulfillmentOverrideRequest request)
    {
        var order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .Include(o => o.Backorders)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException($"Order {orderId} not found.");

        if (order.Status == OrderStatus.Fulfilled)
        {
            throw new InvalidOperationException($"Order {order.OrderNumber} has already been fulfilled and cannot be re-allocated.");
        }

        var orderLineIds = order.Lines.Select(l => l.Id).ToList();

        // Release any existing allocations and backorders
        var existingAllocations = await _context.WarehouseAllocations
            .Where(a => orderLineIds.Contains(a.OrderLineId))
            .ToListAsync();

        if (existingAllocations.Any())
        {
            foreach (var alloc in existingAllocations)
            {
                var line = order.Lines.FirstOrDefault(l => l.Id == alloc.OrderLineId);
                if (line != null)
                {
                    var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == alloc.WarehouseId && s.ProductId == line.ProductId);
                    if (stock != null)
                    {
                        stock.Reserved = Math.Max(0, stock.Reserved - alloc.Quantity);
                    }
                }
            }
            _context.WarehouseAllocations.RemoveRange(existingAllocations);
        }

        if (order.Backorders.Any())
        {
            _context.Backorders.RemoveRange(order.Backorders);
        }

        var warehouses = await _context.Warehouses.ToListAsync();
        var warehouseMap = warehouses.ToDictionary(w => w.Id);

        var newAllocations = new List<WarehouseAllocation>();
        var newBackorders = new List<Backorder>();

        // Group requested allocations by order line
        var requestedByLine = request.Allocations
            .GroupBy(a => a.OrderLineId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var line in order.Lines)
        {
            var requestedAllocations = requestedByLine.GetValueOrDefault(line.Id) ?? new List<AllocationOverride>();
            int allocatedQtyForLine = 0;

            foreach (var reqAlloc in requestedAllocations)
            {
                if (reqAlloc.Quantity <= 0) continue;

                var wh = warehouseMap.GetValueOrDefault(reqAlloc.WarehouseId);
                if (wh == null) throw new KeyNotFoundException($"Warehouse {reqAlloc.WarehouseId} not found.");

                var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == wh.Id && s.ProductId == line.ProductId);
                int availableStock = stock != null ? (stock.OnHand - stock.Reserved) : 0;

                // VALIDATE MANUAL OVERRIDE CAPACITY (Test 8)
                if (reqAlloc.Quantity > availableStock)
                {
                    throw new InvalidOperationException($"Cannot allocate {reqAlloc.Quantity} units from warehouse '{wh.Name}'. Only {availableStock} units are currently available.");
                }

                if (stock == null)
                {
                    stock = new InventoryStock { WarehouseId = wh.Id, ProductId = line.ProductId, OnHand = 0, Reserved = 0, CreatedAtUtc = DateTime.UtcNow };
                    _context.InventoryStocks.Add(stock);
                }

                // Reserve stock
                stock.Reserved += reqAlloc.Quantity;
                stock.UpdatedAtUtc = DateTime.UtcNow;

                decimal shipmentCost = reqAlloc.Quantity * wh.ShippingCostWeight * 10.00m;

                newAllocations.Add(new WarehouseAllocation
                {
                    OrderLineId = line.Id,
                    WarehouseId = wh.Id,
                    Quantity = reqAlloc.Quantity,
                    ShipmentCost = shipmentCost,
                    CreatedAtUtc = DateTime.UtcNow
                });

                allocatedQtyForLine += reqAlloc.Quantity;
            }

            int unallocatedQty = line.Quantity - allocatedQtyForLine;
            if (unallocatedQty > 0)
            {
                newBackorders.Add(new Backorder
                {
                    OrderId = order.Id,
                    OrderLineId = line.Id,
                    ProductId = line.ProductId,
                    Quantity = unallocatedQty,
                    Status = "Pending",
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }

        _context.WarehouseAllocations.AddRange(newAllocations);
        _context.Backorders.AddRange(newBackorders);

        if (newBackorders.Any())
        {
            order.Status = newAllocations.Any() ? OrderStatus.PartiallyAllocated : OrderStatus.Confirmed;
        }
        else
        {
            order.Status = OrderStatus.Allocated;
        }

        order.UpdatedAtUtc = DateTime.UtcNow;
        _context.Orders.Update(order);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Order",
            EntityId = order.Id,
            Action = "ManualFulfillmentOverride",
            Reason = $"Manual override applied: {newAllocations.Count} allocation(s), {newBackorders.Count} backorder(s). Resulting status: {order.Status}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return await PreviewAllocationAsync(orderId);
    }

    public async Task<ConsolidateBackorderResponse> ConsolidateOrderBackordersAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .Include(o => o.Backorders)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException($"Order {orderId} not found.");

        var pendingBackorders = order.Backorders.Where(b => b.Status == "Pending").ToList();
        if (!pendingBackorders.Any())
        {
            return new ConsolidateBackorderResponse
            {
                OrderId = orderId,
                Message = "No pending backorders exist for this order.",
                ConsolidatedAllocationsCount = 0,
                RemainingBackordersCount = 0,
                NewOrderStatus = order.Status.ToString()
            };
        }

        var warehouses = await _context.Warehouses.Where(w => w.IsActive).OrderBy(w => w.ShippingCostWeight).ToListAsync();
        int consolidatedCount = 0;

        foreach (var bo in pendingBackorders)
        {
            int remainingNeeded = bo.Quantity;

            foreach (var wh in warehouses)
            {
                if (remainingNeeded <= 0) break;

                var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == wh.Id && s.ProductId == bo.ProductId);
                if (stock == null) continue;

                int available = stock.OnHand - stock.Reserved;
                if (available > 0)
                {
                    int take = Math.Min(available, remainingNeeded);
                    stock.Reserved += take;
                    stock.UpdatedAtUtc = DateTime.UtcNow;

                    _context.WarehouseAllocations.Add(new WarehouseAllocation
                    {
                        OrderLineId = bo.OrderLineId,
                        WarehouseId = wh.Id,
                        Quantity = take,
                        ShipmentCost = wh.ShippingCostWeight * 10.00m,
                        CreatedAtUtc = DateTime.UtcNow
                    });

                    remainingNeeded -= take;
                    consolidatedCount++;
                }
            }

            if (remainingNeeded <= 0)
            {
                bo.Status = "Fulfilled";
                bo.UpdatedAtUtc = DateTime.UtcNow;
            }
            else
            {
                bo.Quantity = remainingNeeded;
                bo.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        bool allResolved = order.Backorders.All(b => b.Status != "Pending");
        if (allResolved)
        {
            order.Status = OrderStatus.Allocated;
        }
        else if (consolidatedCount > 0)
        {
            order.Status = OrderStatus.PartiallyAllocated;
        }

        order.UpdatedAtUtc = DateTime.UtcNow;
        _context.Orders.Update(order);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Order",
            EntityId = order.Id,
            Action = "BackordersConsolidated",
            Reason = $"Consolidated backorders for order {order.OrderNumber}. {consolidatedCount} allocation(s) created. Remaining pending backorders: {order.Backorders.Count(b => b.Status == "Pending")}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new ConsolidateBackorderResponse
        {
            OrderId = orderId,
            Message = consolidatedCount > 0 ? $"Successfully consolidated backorders. Created {consolidatedCount} allocation(s)." : "No available inventory to fulfill remaining backorders.",
            ConsolidatedAllocationsCount = consolidatedCount,
            RemainingBackordersCount = order.Backorders.Count(b => b.Status == "Pending"),
            NewOrderStatus = order.Status.ToString()
        };
    }

    public async Task<ConsolidationOptionResponse> GetConsolidationOptionsAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .Include(o => o.Backorders)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException($"Order {orderId} not found.");

        var pendingBackorders = order.Backorders.Where(b => b.Status == "Pending").ToList();
        if (!pendingBackorders.Any())
        {
            return new ConsolidationOptionResponse
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CanConsolidate = false,
                Explanation = "No active pending backorders exist for this order."
            };
        }

        var orderLineIds = order.Lines.Select(l => l.Id).ToList();
        var existingAllocations = await _context.WarehouseAllocations
            .Where(a => orderLineIds.Contains(a.OrderLineId))
            .ToListAsync();

        var existingWarehouseIds = existingAllocations.Select(a => a.WarehouseId).Distinct().ToHashSet();
        var warehouses = await _context.Warehouses.Where(w => w.IsActive).ToDictionaryAsync(w => w.Id);
        var products = await _context.Products.ToDictionaryAsync(p => p.Id);

        var opportunities = new List<ConsolidationOpportunityDto>();

        foreach (var bo in pendingBackorders)
        {
            var product = products.GetValueOrDefault(bo.ProductId);
            var stocks = await _context.InventoryStocks
                .Where(s => s.ProductId == bo.ProductId)
                .ToListAsync();

            foreach (var stock in stocks)
            {
                var wh = warehouses.GetValueOrDefault(stock.WarehouseId);
                if (wh == null) continue;

                int available = Math.Max(0, stock.OnHand - stock.Reserved);
                if (available <= 0) continue;

                int fulfillable = Math.Min(available, bo.Quantity);

                // MEANINGFUL BENEFIT:
                // 1. Warehouse already has an active allocation for this order -> saves a separate shipment!
                // 2. Warehouse has enough stock to fulfill 100% of the remaining backorder in 1 consolidated shipment!
                bool isExistingWarehouse = existingWarehouseIds.Contains(wh.Id);
                bool canFulfillEntireBackorder = fulfillable >= bo.Quantity;

                if (isExistingWarehouse || canFulfillEntireBackorder)
                {
                    int shipmentsSaved = isExistingWarehouse ? 1 : 0;
                    decimal costSavings = isExistingWarehouse ? (wh.ShippingCostWeight * 10.00m) : 0m;

                    opportunities.Add(new ConsolidationOpportunityDto
                    {
                        WarehouseId = wh.Id,
                        WarehouseName = wh.Name,
                        ProductId = bo.ProductId,
                        ProductName = product?.Name ?? $"Product #{bo.ProductId}",
                        AvailableQuantity = available,
                        BackorderQuantity = bo.Quantity,
                        FulfillableQuantity = fulfillable,
                        ShipmentsSaved = shipmentsSaved,
                        EstimatedCostSavings = costSavings,
                        Reason = $"{fulfillable} units of {product?.Name ?? "item"} are now available at {wh.Name}. Consolidating the remaining backorder can reduce the remaining shipment count."
                    });
                }
            }
        }

        if (opportunities.Any())
        {
            var best = opportunities.OrderByDescending(o => o.ShipmentsSaved).ThenByDescending(o => o.FulfillableQuantity).First();
            return new ConsolidationOptionResponse
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CanConsolidate = true,
                Explanation = $"{best.FulfillableQuantity} units are now available at {best.WarehouseName}. Consolidating the remaining backorder can reduce the remaining shipment count.",
                Opportunities = opportunities
            };
        }

        return new ConsolidationOptionResponse
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            CanConsolidate = false,
            Explanation = "Newly arrived stock does not reduce shipment count or provide a logistics cost advantage."
        };
    }
}
