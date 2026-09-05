using System.Text.Json;
using DealFlow360.API.Common;
using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Customers;
using DealFlow360.API.DTOs.Invoices;
using DealFlow360.API.DTOs.Orders;
using DealFlow360.API.DTOs.Portal;
using DealFlow360.API.DTOs.Users;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
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
    Task<CustomerQuoteDto> GetCustomerQuotationByIdAsync(int customerId, int quotationId);
    Task SubmitCustomerLineCommentAsync(int customerId, int quotationId, int lineId, string commentText);
    Task<CustomerQuoteDto> SubmitCustomerCounterOfferAsync(int customerId, int quotationId, CounterDiscountRequest request);
    Task<CustomerQuoteDto> SubmitCustomerChangeRequestAsync(int customerId, int quotationId, SubmitChangeRequest request);
    Task<CustomerQuoteDto> ConfirmCustomerQuotationAsync(int customerId, int quotationId);
    Task<List<OrderListResponse>> GetCustomerOrdersAsync(int customerId);
    Task<CustomerOrderDetailDto> GetCustomerOrderByIdAsync(int customerId, int orderId);
    Task<List<InvoiceListResponse>> GetCustomerInvoicesAsync(int customerId);
    Task<CustomerInvoiceDetailDto> GetCustomerInvoiceByIdAsync(int customerId, int invoiceId);
    Task<CustomerProfileDto> GetCustomerProfileAsync(int customerId);
}

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _context;
    private readonly ICustomerNegotiationEngine _negotiationEngine;
    private readonly IDiscountGovernanceEngine _governanceEngine;
    private readonly IBlendedDiscountRiskEngine _riskEngine;
    private readonly IMarginCalculationEngine _marginEngine;
    private readonly INotificationService _notificationService;

    public CustomerService(
        AppDbContext context,
        ICustomerNegotiationEngine negotiationEngine,
        IDiscountGovernanceEngine governanceEngine,
        IBlendedDiscountRiskEngine riskEngine,
        IMarginCalculationEngine marginEngine,
        INotificationService notificationService)
    {
        _context = context;
        _negotiationEngine = negotiationEngine;
        _governanceEngine = governanceEngine;
        _riskEngine = riskEngine;
        _marginEngine = marginEngine;
        _notificationService = notificationService;
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

        var quoteIds = quotations.Select(q => q.Id).ToList();
        var changes = await _context.QuotationChanges
            .Where(c => quoteIds.Contains(c.QuotationId))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return quotations.Select(q => MapToCustomerQuoteDto(q, changes.Where(c => c.QuotationId == q.Id).ToList())).ToList();
    }

    public async Task<CustomerQuoteDto> GetCustomerQuotationByIdAsync(int customerId, int quotationId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId && q.CustomerId == customerId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found for this customer account.");

        var changes = await _context.QuotationChanges
            .Where(c => c.QuotationId == quotationId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return MapToCustomerQuoteDto(quotation, changes);
    }

    public async Task SubmitCustomerLineCommentAsync(int customerId, int quotationId, int lineId, string commentText)
    {
        if (string.IsNullOrWhiteSpace(commentText))
            throw new ArgumentException("Comment text cannot be empty.");

        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(q => q.Id == quotationId && q.CustomerId == customerId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found for this customer account.");

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) throw new KeyNotFoundException($"Quotation line {lineId} not found.");

        var comment = new QuotationLineComment
        {
            QuotationLineId = lineId,
            UserId = quotation.SalesRepId,
            Comment = $"Customer ({quotation.Customer?.Name ?? "Client"}): {commentText.Trim()}",
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.QuotationLineComments.Add(comment);

        if (quotation.Status == QuoteStatus.Draft || quotation.Status == QuoteStatus.Sent)
        {
            quotation.Status = QuoteStatus.UnderNegotiation;
            quotation.UpdatedAtUtc = DateTime.UtcNow;
            _context.Quotations.Update(quotation);
        }

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "CustomerLineInquiry",
            CreatedAtUtc = DateTime.UtcNow,
            Reason = $"Customer inquiry on Quote #{quotation.QuotationNumber}, line {lineId}: '{commentText.Trim()}'"
        });

        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Customer Question on Quote {quotation.QuotationNumber}",
            $"Customer posted an inquiry: '{commentText.Trim()}'",
            "PortalComment",
            "Quotation",
            quotation.Id);
    }

    public async Task<CustomerQuoteDto> SubmitCustomerCounterOfferAsync(int customerId, int quotationId, CounterDiscountRequest request)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId && q.CustomerId == customerId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found for this customer account.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder)
            throw new InvalidOperationException("Cannot submit a counter-offer on an order that has already been converted.");
        if (quotation.Status == QuoteStatus.Confirmed)
            throw new InvalidOperationException("Cannot submit a counter-offer on a confirmed quotation.");
        if (quotation.Status == QuoteStatus.Rejected || quotation.Status == QuoteStatus.Cancelled)
            throw new InvalidOperationException("Cannot negotiate on a rejected or cancelled quotation.");

        var line = quotation.Lines.FirstOrDefault(l => l.Id == request.LineId);
        if (line == null) throw new KeyNotFoundException($"Quotation line {request.LineId} not found.");

        var oldDiscount = line.DiscountPercent;
        var discountRules = await _context.DiscountRules.Where(r => r.IsActive).ToListAsync();

        var evalResult = _negotiationEngine.EvaluateCounterOffer(
            quotation,
            quotation.Customer,
            request.LineId,
            request.ProposedDiscountPercent,
            discountRules,
            _governanceEngine,
            _riskEngine,
            _marginEngine);

        // Record in QuotationChanges
        var quotationChange = new QuotationChange
        {
            QuotationId = quotation.Id,
            ChangeType = "CounterDiscount",
            Description = $"Customer countered discount from {oldDiscount:F1}% to {request.ProposedDiscountPercent:F1}%. Reason: {request.Reason ?? "Not specified"}",
            RequestedByUserId = quotation.SalesRepId,
            OldValueJson = JsonSerializer.Serialize(new { LineId = request.LineId, DiscountPercent = oldDiscount }),
            NewValueJson = JsonSerializer.Serialize(new { LineId = request.LineId, DiscountPercent = request.ProposedDiscountPercent }),
            CreatedAtUtc = DateTime.UtcNow
        };
        _context.QuotationChanges.Add(quotationChange);

        if (evalResult.RequiresReApproval)
        {
            // Supercede previous pending approval requests
            var existingApprovals = await _context.ApprovalRequests
                .Where(a => a.QuotationId == quotation.Id && a.Status == ApprovalStatus.Pending)
                .ToListAsync();
            foreach (var app in existingApprovals)
            {
                app.Status = ApprovalStatus.Rejected;
                app.ActedAtUtc = DateTime.UtcNow;
                app.Reason = "Superseded by customer counter-discount proposal.";
            }

            var approvalRequest = new ApprovalRequest
            {
                QuotationId = quotation.Id,
                Level = evalResult.NewApprovalLevel != ApprovalLevel.None ? evalResult.NewApprovalLevel : ApprovalLevel.Manager,
                Status = ApprovalStatus.Pending,
                Sequence = 1,
                RequestedAtUtc = DateTime.UtcNow,
                Reason = $"Customer counter-offer on line #{request.LineId} proposed {request.ProposedDiscountPercent:F2}% (Risk score: {evalResult.NewRiskScore:F2})"
            };
            _context.ApprovalRequests.Add(approvalRequest);
        }

        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "CustomerCounterOffer",
            CreatedAtUtc = DateTime.UtcNow,
            Reason = $"Customer submitted counter discount of {request.ProposedDiscountPercent:F1}% on Quote #{quotation.QuotationNumber}. Re-approval required: {evalResult.RequiresReApproval}."
        });

        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Counter-Offer on Quote {quotation.QuotationNumber}",
            evalResult.SummaryMessage,
            "CounterOffer",
            "Quotation",
            quotation.Id);

        var changes = await _context.QuotationChanges
            .Where(c => c.QuotationId == quotation.Id)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return MapToCustomerQuoteDto(quotation, changes);
    }

    public async Task<CustomerQuoteDto> SubmitCustomerChangeRequestAsync(int customerId, int quotationId, SubmitChangeRequest request)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId && q.CustomerId == customerId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found for this customer account.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder)
            throw new InvalidOperationException("Cannot request changes on an order that has already been converted.");
        if (quotation.Status == QuoteStatus.Confirmed)
            throw new InvalidOperationException("Cannot request changes on a confirmed quotation.");
        if (quotation.Status == QuoteStatus.Rejected || quotation.Status == QuoteStatus.Cancelled)
            throw new InvalidOperationException("Cannot request changes on a rejected or cancelled quotation.");

        QuotationLine? targetLine = null;
        if (request.LineId.HasValue)
        {
            targetLine = quotation.Lines.FirstOrDefault(l => l.Id == request.LineId.Value);
        }

        var changeRecord = new QuotationChange
        {
            QuotationId = quotation.Id,
            ChangeType = string.IsNullOrWhiteSpace(request.ChangeType) ? "ChangeRequest" : request.ChangeType,
            Description = request.Description,
            RequestedByUserId = quotation.SalesRepId,
            OldValueJson = targetLine != null ? JsonSerializer.Serialize(new { LineId = targetLine.Id, Quantity = targetLine.Quantity }) : null,
            NewValueJson = request.NewQuantity.HasValue ? JsonSerializer.Serialize(new { LineId = request.LineId, NewQuantity = request.NewQuantity.Value }) : null,
            CreatedAtUtc = DateTime.UtcNow
        };
        _context.QuotationChanges.Add(changeRecord);

        quotation.Status = QuoteStatus.UnderNegotiation;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "CustomerChangeRequest",
            CreatedAtUtc = DateTime.UtcNow,
            Reason = $"Customer requested change ({request.ChangeType}) on Quote #{quotation.QuotationNumber}: '{request.Description}'"
        });

        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Change Request on Quote {quotation.QuotationNumber}",
            $"Customer requested change: {request.Description}",
            "ChangeRequest",
            "Quotation",
            quotation.Id);

        var changes = await _context.QuotationChanges
            .Where(c => c.QuotationId == quotation.Id)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return MapToCustomerQuoteDto(quotation, changes);
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
        if (quotation.Status == QuoteStatus.Confirmed)
        {
            throw new InvalidOperationException("Quotation has already been confirmed.");
        }
        if (quotation.Status == QuoteStatus.Rejected)
        {
            throw new InvalidOperationException("Cannot confirm a rejected quotation.");
        }
        if (quotation.Status == QuoteStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot confirm a cancelled quotation.");
        }
        if (quotation.Status == QuoteStatus.PendingApproval || quotation.ApprovalStatus == ApprovalStatus.Pending || quotation.ApprovalStatus == ApprovalStatus.ManagerApproved)
        {
            throw new InvalidOperationException("Quotation is currently undergoing internal governance review and cannot be confirmed until approved.");
        }
        if (quotation.ApprovalStatus == ApprovalStatus.RevisionRequired)
        {
            throw new InvalidOperationException("Quotation requires revision and cannot be confirmed in its current state.");
        }

        quotation.Status = QuoteStatus.Confirmed;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "CustomerConfirmedQuotation",
            CreatedAtUtc = DateTime.UtcNow,
            Reason = $"Customer {quotation.Customer?.Name} confirmed quotation #{quotation.QuotationNumber} for {quotation.CurrencyCode} {quotation.GrandTotal:N2}"
        });

        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Quotation {quotation.QuotationNumber} Confirmed by Customer",
            $"Customer {quotation.Customer?.Name} has formally confirmed commercial proposal {quotation.QuotationNumber}.",
            "QuoteConfirmed",
            "Quotation",
            quotation.Id);

        var changes = await _context.QuotationChanges
            .Where(c => c.QuotationId == quotation.Id)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return MapToCustomerQuoteDto(quotation, changes);
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

    public async Task<CustomerOrderDetailDto> GetCustomerOrderByIdAsync(int customerId, int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Quotation)
            .Include(o => o.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId);

        if (order == null) throw new KeyNotFoundException($"Order {orderId} not found for this customer account.");

        return new CustomerOrderDetailDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Status = order.Status.ToString(),
            Total = order.Total,
            CreatedAtUtc = order.CreatedAtUtc,
            QuotationId = order.QuotationId,
            QuotationNumber = order.Quotation?.QuotationNumber ?? string.Empty,
            Lines = order.Lines.Select(l => new CustomerOrderLineDto
            {
                Id = l.Id,
                ProductId = l.ProductId,
                ProductName = l.Product?.Name ?? string.Empty,
                SKU = l.Product?.SKU ?? string.Empty,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                NetAmount = l.NetAmount
            }).ToList()
        };
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

    public async Task<CustomerInvoiceDetailDto> GetCustomerInvoiceByIdAsync(int customerId, int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Lines)
            .Include(i => i.Payments)
            .Include(i => i.CreditNotes)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.CustomerId == customerId);

        if (invoice == null) throw new KeyNotFoundException($"Invoice {invoiceId} not found for this customer account.");

        var totalCredits = invoice.CreditNotes?.Sum(c => c.Amount) ?? 0m;
        var outstanding = Math.Max(0m, invoice.Total - invoice.PaidAmount - totalCredits);

        return new CustomerInvoiceDetailDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            Type = invoice.Type,
            Status = invoice.Status.ToString(),
            SubTotal = invoice.SubTotal,
            TaxTotal = invoice.TaxTotal,
            Total = invoice.Total,
            PaidAmount = invoice.PaidAmount,
            Outstanding = outstanding,
            DueDate = invoice.DueDate,
            CreatedAtUtc = invoice.CreatedAtUtc,
            Lines = (invoice.Lines ?? new List<InvoiceLine>()).Select(l => new CustomerInvoiceLineDto
            {
                Id = l.Id,
                Description = l.Description ?? string.Empty,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                NetAmount = l.NetAmount
            }).ToList(),
            Payments = (invoice.Payments ?? new List<Payment>()).Select(p => new CustomerPaymentDto
            {
                Id = p.Id,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod ?? string.Empty,
                PaidAtUtc = p.PaidAtUtc,
                Reference = p.Reference
            }).ToList(),
            CreditNotes = (invoice.CreditNotes ?? new List<CreditNote>()).Select(c => new CustomerCreditNoteDto
            {
                Id = c.Id,
                CreditNoteNumber = $"CN-{c.Id:D5}",
                Amount = c.Amount,
                Reason = c.Reason,
                CreatedAtUtc = c.CreatedAtUtc
            }).ToList()
        };
    }

    public async Task<CustomerProfileDto> GetCustomerProfileAsync(int customerId)
    {
        var customer = await _context.Customers
            .Include(c => c.Tier)
            .Include(c => c.AssignedSalesRep)
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer == null) throw new KeyNotFoundException($"Customer account {customerId} not found.");

        return new CustomerProfileDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Email = customer.Email,
            Phone = customer.Phone,
            TierName = customer.Tier?.Name ?? "Standard",
            CurrencyCode = customer.CurrencyCode,
            CreatedAtUtc = customer.CreatedAtUtc,
            AssignedSalesRepName = customer.AssignedSalesRep?.FullName,
            AssignedSalesRepEmail = customer.AssignedSalesRep?.Email
        };
    }

    private static CustomerQuoteDto MapToCustomerQuoteDto(Quotation q, List<QuotationChange>? changes = null)
    {
        // STRICT ZERO-LEAK SECURITY INVARIANT:
        // CostPrice, UnitMargin, MarginPercent, TotalCost, BlendedRiskScore,
        // and ManagerRemarks are NOT present on this DTO.
        return new CustomerQuoteDto
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
            }).ToList(),
            ChangeRequests = changes?.Select(c => new NegotiationHistoryResponse
            {
                Id = c.Id,
                ChangeType = c.ChangeType,
                Description = c.Description,
                CreatedAtUtc = c.CreatedAtUtc
            }).ToList() ?? new List<NegotiationHistoryResponse>()
        };
    }
}
