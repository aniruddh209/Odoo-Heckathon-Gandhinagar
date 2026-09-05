using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Customers;
using DealFlow360.API.DTOs.Invoices;
using DealFlow360.API.DTOs.Orders;
using DealFlow360.API.DTOs.Portal;
using DealFlow360.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface ICustomerService
{
    Task<List<CustomerListResponse>> GetCustomersAsync();
    Task<CustomerDetailResponse> GetCustomerByIdAsync(int id);
    Task<CustomerDetailResponse> CreateCustomerAsync(CreateCustomerRequest request);
    Task<CustomerDetailResponse> UpdateCustomerAsync(int id, UpdateCustomerRequest request);
    Task<List<CustomerQuoteDto>> GetCustomerQuotationsAsync(int customerId);
    Task<List<OrderListResponse>> GetCustomerOrdersAsync(int customerId);
    Task<List<InvoiceListResponse>> GetCustomerInvoicesAsync(int customerId);
}

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _context;

    public CustomerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CustomerListResponse>> GetCustomersAsync()
    {
        return await _context.Customers
            .Include(c => c.Tier)
            .OrderBy(c => c.Name)
            .Select(c => new CustomerListResponse
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                TierName = c.Tier.Name,
                CurrencyCode = c.CurrencyCode,
                IsActive = c.IsActive
            }).ToListAsync();
    }

    public async Task<CustomerDetailResponse> GetCustomerByIdAsync(int id)
    {
        var c = await _context.Customers
            .Include(cust => cust.Tier)
            .FirstOrDefaultAsync(cust => cust.Id == id);

        if (c == null) throw new KeyNotFoundException($"Customer {id} not found.");

        return new CustomerDetailResponse
        {
            Id = c.Id,
            Name = c.Name,
            Email = c.Email,
            Phone = c.Phone,
            TierId = c.TierId,
            TierName = c.Tier.Name,
            TierMaxDiscount = c.Tier.MaxDiscountPercent,
            CurrencyCode = c.CurrencyCode,
            IsActive = c.IsActive,
            CreatedAtUtc = c.CreatedAtUtc
        };
    }

    public async Task<CustomerDetailResponse> CreateCustomerAsync(CreateCustomerRequest request)
    {
        var customer = new Customer
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            TierId = request.TierId,
            CurrencyCode = request.CurrencyCode,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return await GetCustomerByIdAsync(customer.Id);
    }

    public async Task<CustomerDetailResponse> UpdateCustomerAsync(int id, UpdateCustomerRequest request)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) throw new KeyNotFoundException($"Customer {id} not found.");

        customer.Name = request.Name;
        customer.Email = request.Email;
        customer.Phone = request.Phone;
        customer.TierId = request.TierId;
        customer.CurrencyCode = request.CurrencyCode;
        customer.IsActive = request.IsActive;
        customer.UpdatedAtUtc = DateTime.UtcNow;

        _context.Customers.Update(customer);
        await _context.SaveChangesAsync();

        return await GetCustomerByIdAsync(id);
    }

    public async Task<List<CustomerQuoteDto>> GetCustomerQuotationsAsync(int customerId)
    {
        var quotations = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Where(q => q.CustomerId == customerId)
            .OrderByDescending(q => q.CreatedAtUtc)
            .ToListAsync();

        return quotations.Select(q => new CustomerQuoteDto
        {
            Id = q.Id,
            QuotationNumber = q.QuotationNumber,
            CustomerName = q.Customer?.Name ?? string.Empty,
            Status = q.Status.ToString(),
            CurrencyCode = q.CurrencyCode,
            SubTotal = q.SubTotal,
            DiscountTotal = q.DiscountTotal,
            TaxTotal = q.TaxTotal,
            GrandTotal = q.GrandTotal,
            ExpectedCloseDate = q.ExpectedCloseDate,
            Notes = q.Notes,
            Lines = q.Lines.Select(l => new CustomerQuoteLineDto
            {
                Id = l.Id,
                ProductId = l.ProductId,
                ProductName = l.Product?.Name ?? string.Empty,
                SKU = l.Product?.SKU ?? string.Empty,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountPercent = l.DiscountPercent,
                NetAmount = l.NetAmount,
                TaxAmount = l.TaxAmount,
                Comments = l.Comments.Select(c => new CustomerCommentDto
                {
                    Id = c.Id,
                    Comment = c.Comment,
                    CreatedAtUtc = c.CreatedAtUtc
                }).ToList()
            }).ToList()
        }).ToList();
    }

    public async Task<List<OrderListResponse>> GetCustomerOrdersAsync(int customerId)
    {
        return await _context.Orders
            .Include(o => o.Customer)
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Select(o => new OrderListResponse
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.Customer.Name,
                Status = o.Status.ToString(),
                Total = o.Total,
                CreatedAtUtc = o.CreatedAtUtc
            }).ToListAsync();
    }

    public async Task<List<InvoiceListResponse>> GetCustomerInvoicesAsync(int customerId)
    {
        return await _context.Invoices
            .Include(i => i.Customer)
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.CreatedAtUtc)
            .Select(i => new InvoiceListResponse
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerName = i.Customer.Name,
                Type = i.Type,
                Status = i.Status.ToString(),
                Total = i.Total,
                PaidAmount = i.PaidAmount,
                DueDate = i.DueDate,
                CreatedAtUtc = i.CreatedAtUtc
            }).ToListAsync();
    }
}
