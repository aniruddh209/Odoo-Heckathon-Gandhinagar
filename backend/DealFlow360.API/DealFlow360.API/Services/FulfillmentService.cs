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

        var warehouses = await _context.Warehouses.ToListAsync();
        var stocks = await _context.InventoryStocks.ToListAsync();

        var result = _allocationEngine.CalculateAllocation(order, warehouses, stocks);

        var warehouseMap = warehouses.ToDictionary(w => w.Id);
        var productMap = await _context.Products.ToDictionaryAsync(p => p.Id);

        return new FulfillmentPreviewResponse
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            IsFullyAllocated = result.IsFullyAllocated,
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

        _context.WarehouseAllocations.AddRange(result.Allocations);
        _context.Backorders.AddRange(result.Backorders);

        // Commit stock reservation changes
        foreach (var stock in stocks)
        {
            stock.UpdatedAtUtc = DateTime.UtcNow;
        }
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
}
