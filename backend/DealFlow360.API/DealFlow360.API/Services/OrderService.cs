using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Orders;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IOrderService
{
    Task<List<OrderListResponse>> GetOrdersAsync(int? customerId = null);
    Task<OrderDetailResponse> GetOrderByIdAsync(int id);
}

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;

    public OrderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderListResponse>> GetOrdersAsync(int? customerId = null)
    {
        var query = _context.Orders
            .Include(o => o.Customer)
            .AsQueryable();

        if (customerId.HasValue)
        {
            query = query.Where(o => o.CustomerId == customerId.Value);
        }

        return await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Select(o => new OrderListResponse
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.Customer.Name,
                Status = o.Status.ToString(),
                Total = o.Total,
                CreatedAtUtc = o.CreatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<OrderDetailResponse> GetOrderByIdAsync(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Quotation)
            .Include(o => o.Lines).ThenInclude(l => l.Product)
            .Include(o => o.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) throw new KeyNotFoundException($"Order {id} not found.");

        return new OrderDetailResponse
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            QuotationId = order.QuotationId,
            QuotationNumber = order.Quotation?.QuotationNumber ?? string.Empty,
            CustomerId = order.CustomerId,
            CustomerName = order.Customer?.Name ?? string.Empty,
            Status = order.Status.ToString(),
            Total = order.Total,
            CreatedAtUtc = order.CreatedAtUtc,
            Lines = order.Lines.Select(l => new OrderLineResponse
            {
                Id = l.Id,
                ProductId = l.ProductId,
                ProductName = l.Product?.Name ?? string.Empty,
                ProductSKU = l.Product?.SKU ?? string.Empty,
                ProductType = l.ProductType.ToString(),
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountPercent = l.DiscountPercent,
                NetAmount = l.NetAmount,
                TaxAmount = l.TaxAmount,
                SubscriptionPlanName = l.SubscriptionPlan?.Name
            }).ToList()
        };
    }
}
