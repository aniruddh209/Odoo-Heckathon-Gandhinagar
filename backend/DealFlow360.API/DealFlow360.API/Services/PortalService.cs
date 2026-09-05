using System.Text.Json;
using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Billing;
using DealFlow360.API.DTOs.Portal;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IPortalService
{
    Task<CustomerQuoteDto> GetCustomerQuoteAsync(string token);
    Task SubmitLineCommentAsync(string token, int lineId, string comment);
    Task<CustomerQuoteDto> SubmitCounterOfferAsync(string token, CounterDiscountRequest request);
    Task<CustomerQuoteDto> SubmitChangeRequestAsync(string token, SubmitChangeRequest request);
    Task<CustomerQuoteDto> ConfirmQuoteAsync(string token);
}

public class PortalService : IPortalService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly ICustomerNegotiationEngine _negotiationEngine;
    private readonly IDiscountGovernanceEngine _governanceEngine;
    private readonly IBlendedDiscountRiskEngine _riskEngine;
    private readonly IMarginCalculationEngine _marginEngine;
    private readonly INotificationService _notificationService;
    private readonly IFulfillmentService _fulfillmentService;
    private readonly IBillingService _billingService;

    public PortalService(
        AppDbContext context,
        IJwtService jwtService,
        ICustomerNegotiationEngine negotiationEngine,
        IDiscountGovernanceEngine governanceEngine,
        IBlendedDiscountRiskEngine riskEngine,
        IMarginCalculationEngine marginEngine,
        INotificationService notificationService,
        IFulfillmentService fulfillmentService,
        IBillingService billingService)
    {
        _context = context;
        _jwtService = jwtService;
        _negotiationEngine = negotiationEngine;
        _governanceEngine = governanceEngine;
        _riskEngine = riskEngine;
        _marginEngine = marginEngine;
        _notificationService = notificationService;
        _fulfillmentService = fulfillmentService;
        _billingService = billingService;
    }

    public async Task<CustomerQuoteDto> GetCustomerQuoteAsync(string token)
    {
        var (isValid, quotationId, customerEmail) = _jwtService.ValidatePortalToken(token);
        if (!isValid) throw new UnauthorizedAccessException("Invalid or expired customer portal link.");

        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException("Quotation not found.");

        var changes = await _context.QuotationChanges
            .Where(c => c.QuotationId == quotationId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return MapToCustomerQuoteDto(quotation, changes);
    }

    public async Task SubmitLineCommentAsync(string token, int lineId, string commentText)
    {
        var (isValid, quotationId, customerEmail) = _jwtService.ValidatePortalToken(token);
        if (!isValid) throw new UnauthorizedAccessException("Invalid or expired customer portal link.");

        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException("Quotation not found.");

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) throw new KeyNotFoundException("Quotation line item not found.");

        var comment = new QuotationLineComment
        {
            QuotationLineId = lineId,
            UserId = quotation.SalesRepId, // Recorded under rep context for portal feedback
            Comment = $"Customer ({customerEmail}): {commentText}",
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.QuotationLineComments.Add(comment);

        if (quotation.Status == QuoteStatus.Draft || quotation.Status == QuoteStatus.Sent)
        {
            quotation.Status = QuoteStatus.UnderNegotiation;
            quotation.UpdatedAtUtc = DateTime.UtcNow;
            _context.Quotations.Update(quotation);
        }

        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Customer Inquiry on Quote {quotation.QuotationNumber}",
            $"Customer commented on item: {commentText}",
            "PortalComment",
            "Quotation",
            0);
    }

    public async Task<CustomerQuoteDto> SubmitCounterOfferAsync(string token, CounterDiscountRequest request)
    {
        var (isValid, quotationId, customerEmail) = _jwtService.ValidatePortalToken(token);
        if (!isValid) throw new UnauthorizedAccessException("Invalid or expired customer portal link.");

        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException("Quotation not found.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder)
            throw new InvalidOperationException("Cannot submit a counter-offer on an order that has already been converted.");
        if (quotation.Status == QuoteStatus.Confirmed)
            throw new InvalidOperationException("Cannot submit a counter-offer on a confirmed quotation.");
        if (quotation.Status == QuoteStatus.PendingApproval || quotation.ApprovalStatus == ApprovalStatus.Pending)
            throw new InvalidOperationException("Quotation is currently under review. Please wait for management approval before submitting additional changes.");
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

        quotation.Version++;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "CustomerCounterOffer",
            CreatedAtUtc = DateTime.UtcNow,
            Reason = $"Customer ({customerEmail}) submitted counter discount of {request.ProposedDiscountPercent:F1}% on Quote #{quotation.QuotationNumber}."
        });

        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Counter-Offer Submitted for {quotation.QuotationNumber}",
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

    public async Task<CustomerQuoteDto> SubmitChangeRequestAsync(string token, SubmitChangeRequest request)
    {
        var (isValid, quotationId, customerEmail) = _jwtService.ValidatePortalToken(token);
        if (!isValid) throw new UnauthorizedAccessException("Invalid or expired customer portal link.");

        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException("Quotation not found.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder)
            throw new InvalidOperationException("Cannot request changes on an order that has already been converted.");
        if (quotation.Status == QuoteStatus.Confirmed)
            throw new InvalidOperationException("Cannot request changes on a confirmed quotation.");
        if (quotation.Status == QuoteStatus.PendingApproval || quotation.ApprovalStatus == ApprovalStatus.Pending)
            throw new InvalidOperationException("Quotation is currently under review. Please wait for management approval before requesting additional changes.");
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
        quotation.Version++;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "CustomerChangeRequest",
            CreatedAtUtc = DateTime.UtcNow,
            Reason = $"Customer ({customerEmail}) requested change ({request.ChangeType}) on Quote #{quotation.QuotationNumber}: '{request.Description}'"
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

    public async Task<CustomerQuoteDto> ConfirmQuoteAsync(string token)
    {
        var (isValid, quotationId, customerEmail) = _jwtService.ValidatePortalToken(token);
        if (!isValid) throw new UnauthorizedAccessException("Invalid or expired customer portal link.");

        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Comments)
            .Include(q => q.Lines).ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException("Quotation not found.");

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
        if (quotation.ApprovalStatus != ApprovalStatus.Approved && quotation.Status != QuoteStatus.Approved && quotation.Status != QuoteStatus.Sent)
        {
            throw new InvalidOperationException("Quotation must be approved before it can be confirmed.");
        }

        // Check or create order
        var order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .FirstOrDefaultAsync(o => o.QuotationId == quotation.Id);

        if (order == null)
        {
            var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
            order = new Order
            {
                OrderNumber = orderNumber,
                QuotationId = quotation.Id,
                CustomerId = quotation.CustomerId,
                Status = OrderStatus.Confirmed,
                Total = quotation.GrandTotal,
                CreatedAtUtc = DateTime.UtcNow,
                Lines = quotation.Lines.Select(l => new OrderLine
                {
                    ProductId = l.ProductId,
                    VariantId = l.VariantId,
                    ProductType = l.Product.ProductType,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    DiscountPercent = l.DiscountPercent,
                    NetAmount = l.NetAmount,
                    TaxAmount = l.TaxAmount,
                    SubscriptionPlanId = l.SubscriptionPlanId
                }).ToList()
            };
            _context.Orders.Add(order);
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
            Reason = $"Customer ({customerEmail}) confirmed quotation #{quotation.QuotationNumber} for {quotation.CurrencyCode} {quotation.GrandTotal:N2}. Order {order.OrderNumber} created."
        });

        await _context.SaveChangesAsync();

        // Trigger Warehouse Fulfillment Allocation
        try
        {
            await _fulfillmentService.ExecuteAllocationAsync(order.Id);
        }
        catch (Exception)
        {
            // Handled
        }

        // Trigger Hybrid Billing
        BillingOverviewResponse? billingInfo = null;
        try
        {
            billingInfo = await _billingService.GenerateBillingForOrderAsync(order.Id);
        }
        catch (Exception)
        {
            // Handled
        }

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Quotation {quotation.QuotationNumber} Confirmed by Customer",
            $"Customer {customerEmail} has accepted and confirmed commercial proposal {quotation.QuotationNumber}.",
            "QuoteConfirmed",
            "Quotation",
            quotation.Id);

        var changes = await _context.QuotationChanges
            .Where(c => c.QuotationId == quotation.Id)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return MapToCustomerQuoteDto(quotation, changes, order, billingInfo?.InvoiceNumber, billingInfo?.ActiveSubscriptionsCount);
    }

    private CustomerQuoteDto MapToCustomerQuoteDto(
        Quotation q, 
        List<QuotationChange>? changes = null,
        Order? order = null,
        string? invoiceNumber = null,
        int? activeSubsCount = null)
    {
        // STRICT ZERO-LEAK SECURITY INVARIANT:
        // CostPrice, UnitMargin, MarginPercent, TotalCost, BlendedRiskScore,
        // and ManagerRemarks are strictly stripped!
        var linkedOrder = order ?? _context.Orders.FirstOrDefault(o => o.QuotationId == q.Id);
        var invNum = invoiceNumber ?? (linkedOrder != null ? _context.Invoices.Where(i => i.OrderId == linkedOrder.Id).Select(i => i.InvoiceNumber).FirstOrDefault() : null);
        var subsCount = activeSubsCount ?? (linkedOrder != null ? _context.BillingSchedules.Count(s => s.OrderLine.OrderId == linkedOrder.Id) : 0);

        return new CustomerQuoteDto
        {
            Id = q.Id,
            QuotationNumber = q.QuotationNumber,
            Version = q.Version,
            CustomerName = q.Customer?.Name ?? string.Empty,
            Status = q.Status.ToString(),
            CurrencyCode = q.CurrencyCode,
            OrderId = linkedOrder?.Id,
            OrderNumber = linkedOrder?.OrderNumber,
            InvoiceNumber = invNum,
            ActiveSubscriptionsCount = subsCount,
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
