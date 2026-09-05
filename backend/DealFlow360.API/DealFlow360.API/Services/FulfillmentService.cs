using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Fulfillment;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IFulfillmentService
{
    Task<FulfillmentPreviewResponse> PreviewAllocationAsync(int orderId);
    Task<FulfillmentPreviewResponse> ExecuteAllocationAsync(int orderId);
    Task<List<BackorderResponse>> GetBackordersAsync();
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

        var warehouses = await _context.Warehouses.ToListAsync();
        var stocks = await _context.InventoryStocks.ToListAsync();

        var result = _allocationEngine.CalculateAllocation(order, warehouses, stocks);

        _context.WarehouseAllocations.AddRange(result.Allocations);
        _context.Backorders.AddRange(result.Backorders);

        var newStatus = _fulfillmentEngine.DetermineOrderStatus(order, result.Allocations, result.Backorders);
        order.Status = newStatus;
        order.UpdatedAtUtc = DateTime.UtcNow;

        _context.Orders.Update(order);
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
