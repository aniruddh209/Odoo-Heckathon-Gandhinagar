using DealFlow360.API.Common;
using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Customers;
using DealFlow360.API.DTOs.Invoices;
using DealFlow360.API.DTOs.Orders;
using DealFlow360.API.DTOs.Portal;
using DealFlow360.API.DTOs.Users;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface ICustomerService
{
    Task<List<CustomerListResponse>> GetCustomersAsync();
    Task<CustomerDetailResponse> GetCustomerByIdAsync(int id);
    Task<CreateCustomerResponse> CreateCustomerAsync(CreateCustomerRequest request);
    Task<CustomerDetailResponse> UpdateCustomerAsync(int id, UpdateCustomerRequest request);
    Task<Customer360Response> GetCustomer360Async(int id);
    Task<List<CustomerQuoteDto>> GetCustomerQuotationsAsync(int customerId);
    Task<CustomerQuoteDto> ConfirmCustomerQuotationAsync(int customerId, int quotationId);
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
            .Include(cust => cust.AssignedSalesRep)
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
            CreatedAtUtc = c.CreatedAtUtc,
            AssignedSalesRepId = c.AssignedSalesRepId,
            AssignedSalesRepName = c.AssignedSalesRep?.FullName
        };
    }

    public async Task<CreateCustomerResponse> CreateCustomerAsync(CreateCustomerRequest request)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            var customer = new Customer
            {
                Name = request.Name.Trim(),
                Email = request.Email?.Trim(),
                Phone = request.Phone?.Trim(),
                TierId = request.TierId,
                CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode.Trim().ToUpper(),
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            UserResponse? userResponse = null;
            string? temporaryPassword = null;

            if (!string.IsNullOrWhiteSpace(customer.Email))
            {
                var emailLower = customer.Email.ToLower();
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);
                if (existingUser != null)
                {
                    existingUser.CustomerId = customer.Id;
                    existingUser.UpdatedAtUtc = DateTime.UtcNow;
                    _context.Users.Update(existingUser);
                    await _context.SaveChangesAsync();

                    userResponse = new UserResponse
                    {
                        Id = existingUser.Id,
                        FullName = existingUser.FullName,
                        Email = existingUser.Email,
                        Role = existingUser.Role.ToString(),
                        CustomerId = existingUser.CustomerId,
                        CustomerName = customer.Name,
                        IsActive = existingUser.IsActive,
                        CreatedAtUtc = existingUser.CreatedAtUtc
                    };
                }
                else
                {
                    temporaryPassword = PasswordGenerator.Generate(14);
                    var newUser = new User
                    {
                        FullName = customer.Name,
                        Email = emailLower,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(temporaryPassword),
                        Role = Role.Customer,
                        CustomerId = customer.Id,
                        IsActive = true,
                        MustChangePassword = true,
                        CreatedAtUtc = DateTime.UtcNow,
                        UpdatedAtUtc = DateTime.UtcNow
                    };

                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

                    userResponse = new UserResponse
                    {
                        Id = newUser.Id,
                        FullName = newUser.FullName,
                        Email = newUser.Email,
                        Role = newUser.Role.ToString(),
                        CustomerId = newUser.CustomerId,
                        CustomerName = customer.Name,
                        IsActive = newUser.IsActive,
                        MustChangePassword = true,
                        CreatedAtUtc = newUser.CreatedAtUtc
                    };
                }
            }

            await transaction.CommitAsync();

            var detail = await GetCustomerByIdAsync(customer.Id);

            return new CreateCustomerResponse
            {
                Customer = detail,
                User = userResponse,
                TemporaryPassword = temporaryPassword
            };
        });
    }

    public async Task<CustomerDetailResponse> UpdateCustomerAsync(int id, UpdateCustomerRequest request)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) throw new KeyNotFoundException($"Customer {id} not found.");

        customer.Name = request.Name.Trim();
        customer.Email = request.Email?.Trim();
        customer.Phone = request.Phone?.Trim();
        customer.TierId = request.TierId;
        customer.CurrencyCode = request.CurrencyCode;
        customer.IsActive = request.IsActive;
        customer.UpdatedAtUtc = DateTime.UtcNow;

        _context.Customers.Update(customer);
        await _context.SaveChangesAsync();

        return await GetCustomerByIdAsync(id);
    }

    public async Task<Customer360Response> GetCustomer360Async(int id)
    {
        var customerDetail = await GetCustomerByIdAsync(id);

        var quotes = await GetCustomerQuotationsAsync(id);
        var orders = await GetCustomerOrdersAsync(id);
        var invoices = await GetCustomerInvoicesAsync(id);

        var associatedUsers = await _context.Users
            .Where(u => u.CustomerId == id)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.ToString(),
                CustomerId = u.CustomerId,
                CustomerName = customerDetail.Name,
                IsActive = u.IsActive,
                MustChangePassword = u.MustChangePassword,
                LastLoginAtUtc = u.LastLoginAtUtc,
                CreatedAtUtc = u.CreatedAtUtc
            })
            .ToListAsync();

        // Compute Overview KPIs
        var activeQuotes = quotes.Where(q => q.Status != "ConvertedToOrder" && q.Status != "Confirmed" && q.Status != "Rejected" && q.Status != "Cancelled").ToList();
        var activeQuotesValue = activeQuotes.Sum(q => q.GrandTotal);

        var confirmedOrders = orders.Where(o => o.Status == "Confirmed" || o.Status == "Processing" || o.Status == "Fulfilled" || o.Status == "PartiallyFulfilled").ToList();
        var confirmedOrdersValue = confirmedOrders.Sum(o => o.Total);

        var totalOutstanding = invoices.Sum(i => i.Outstanding);

        var lifetimeValue = confirmedOrdersValue > 0 ? confirmedOrdersValue : quotes.Where(q => q.Status == "Confirmed" || q.Status == "ConvertedToOrder").Sum(q => q.GrandTotal);

        var kpis = new CustomerOverviewKpis
        {
            TotalLifetimeValue = lifetimeValue,
            TotalQuotationsCount = quotes.Count,
            ActiveQuotationsCount = activeQuotes.Count,
            ActiveQuotationsValue = activeQuotesValue,
            ConfirmedOrdersCount = orders.Count,
            ConfirmedOrdersValue = confirmedOrdersValue,
            TotalInvoicesCount = invoices.Count,
            TotalOutstandingBalance = totalOutstanding
        };

        // Product History: Aggregate distinct products purchased across quotations and orders
        var productHistoryMap = new Dictionary<int, CustomerProductHistoryItem>();
        foreach (var q in quotes)
        {
            foreach (var line in q.Lines)
            {
                if (!productHistoryMap.TryGetValue(line.ProductId, out var item))
                {
                    item = new CustomerProductHistoryItem
                    {
                        ProductId = line.ProductId,
                        ProductName = line.ProductName,
                        SKU = line.SKU,
                        TotalQuantityPurchased = line.Quantity,
                        TotalRevenue = line.NetAmount,
                        LastPurchasedAtUtc = q.ExpectedCloseDate
                    };
                    productHistoryMap[line.ProductId] = item;
                }
                else
                {
                    item.TotalQuantityPurchased += line.Quantity;
                    item.TotalRevenue += line.NetAmount;
                }
            }
        }

        // Activity Timeline: Assemble milestones
        var timeline = new List<CustomerActivityEvent>();
        foreach (var q in quotes)
        {
            timeline.Add(new CustomerActivityEvent
            {
                EventType = "QuotationCreated",
                Title = $"Quotation {q.QuotationNumber} Prepared",
                Description = $"Commercial proposal created totaling {q.CurrencyCode} {q.GrandTotal:N2}.",
                TimestampUtc = q.ExpectedCloseDate ?? DateTime.UtcNow,
                ReferenceNumber = q.QuotationNumber
            });

            if (q.Status == "Confirmed")
            {
                timeline.Add(new CustomerActivityEvent
                {
                    EventType = "QuotationConfirmed",
                    Title = $"Quotation {q.QuotationNumber} Formally Confirmed",
                    Description = $"Client confirmed proposal terms.",
                    TimestampUtc = DateTime.UtcNow,
                    ReferenceNumber = q.QuotationNumber
                });
            }
        }

        foreach (var o in orders)
        {
            timeline.Add(new CustomerActivityEvent
            {
                EventType = "OrderCreated",
                Title = $"Sale Order {o.OrderNumber} Executed",
                Description = $"Order confirmed with status {o.Status} totaling {customerDetail.CurrencyCode} {o.Total:N2}.",
                TimestampUtc = o.CreatedAtUtc,
                ReferenceNumber = o.OrderNumber
            });
        }

        foreach (var inv in invoices)
        {
            timeline.Add(new CustomerActivityEvent
            {
                EventType = "InvoiceIssued",
                Title = $"Invoice {inv.InvoiceNumber} Issued",
                Description = $"Billing statement issued for {customerDetail.CurrencyCode} {inv.Total:N2}. Status: {inv.Status}.",
                TimestampUtc = inv.DueDate,
                ReferenceNumber = inv.InvoiceNumber
            });
        }

        var sortedTimeline = timeline.OrderByDescending(t => t.TimestampUtc).Take(30).ToList();

        return new Customer360Response
        {
            Customer = customerDetail,
            Overview = kpis,
            Quotations = quotes,
            Orders = orders,
            Invoices = invoices,
            ProductHistory = productHistoryMap.Values.OrderByDescending(p => p.TotalRevenue).ToList(),
            ActivityTimeline = sortedTimeline,
            AssociatedUsers = associatedUsers
        };
    }

    public async Task<List<CustomerQuoteDto>> GetCustomerQuotationsAsync(int customerId)
    {
        var quotations = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
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
                IsRecurring = l.SubscriptionPlanId.HasValue,
                BillingFrequency = l.SubscriptionPlan?.BillingFrequency,
                SubscriptionPlanName = l.SubscriptionPlan?.Name,
                Comments = l.Comments.Select(c => new CustomerCommentDto
                {
                    Id = c.Id,
                    Comment = c.Comment,
                    CreatedAtUtc = c.CreatedAtUtc
                }).ToList()
            }).ToList()
        }).ToList();
    }

    public async Task<CustomerQuoteDto> ConfirmCustomerQuotationAsync(int customerId, int quotationId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId && q.CustomerId == customerId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found for this customer account.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder)
        {
            throw new InvalidOperationException("Quotation has already been converted to an active order.");
        }

        quotation.Status = QuoteStatus.Confirmed;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        return new CustomerQuoteDto
        {
            Id = quotation.Id,
            QuotationNumber = quotation.QuotationNumber,
            CustomerName = quotation.Customer?.Name ?? string.Empty,
            Status = quotation.Status.ToString(),
            CurrencyCode = quotation.CurrencyCode,
            SubTotal = quotation.SubTotal,
            DiscountTotal = quotation.DiscountTotal,
            TaxTotal = quotation.TaxTotal,
            GrandTotal = quotation.GrandTotal,
            ExpectedCloseDate = quotation.ExpectedCloseDate,
            Notes = quotation.Notes,
            Lines = quotation.Lines.Select(l => new CustomerQuoteLineDto
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
                IsRecurring = l.SubscriptionPlanId.HasValue,
                BillingFrequency = l.SubscriptionPlan?.BillingFrequency,
                SubscriptionPlanName = l.SubscriptionPlan?.Name,
                Comments = l.Comments.Select(c => new CustomerCommentDto
                {
                    Id = c.Id,
                    Comment = c.Comment,
                    CreatedAtUtc = c.CreatedAtUtc
                }).ToList()
            }).ToList()
        };
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
