using DealFlow360.API.Data;
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

    public PortalService(
        AppDbContext context,
        IJwtService jwtService,
        ICustomerNegotiationEngine negotiationEngine,
        IDiscountGovernanceEngine governanceEngine,
        IBlendedDiscountRiskEngine riskEngine,
        IMarginCalculationEngine marginEngine,
        INotificationService notificationService)
    {
        _context = context;
        _jwtService = jwtService;
        _negotiationEngine = negotiationEngine;
        _governanceEngine = governanceEngine;
        _riskEngine = riskEngine;
        _marginEngine = marginEngine;
        _notificationService = notificationService;
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

        return MapToCustomerQuoteDto(quotation);
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

        if (quotation.Status == QuoteStatus.Sent)
        {
            quotation.Status = QuoteStatus.UnderNegotiation;
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

        var discountRules = await _context.DiscountRules.ToListAsync();

        var evalResult = _negotiationEngine.EvaluateCounterOffer(
            quotation,
            quotation.Customer,
            request.LineId,
            request.ProposedDiscountPercent,
            discountRules,
            _governanceEngine,
            _riskEngine,
            _marginEngine);

        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Counter-Offer Submitted for {quotation.QuotationNumber}",
            evalResult.SummaryMessage,
            "CounterOffer",
            "Quotation",
            0);

        return MapToCustomerQuoteDto(quotation);
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

        quotation.Status = QuoteStatus.Confirmed;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            quotation.SalesRepId,
            $"Quotation {quotation.QuotationNumber} Confirmed by Customer",
            $"Customer {customerEmail} has accepted and confirmed commercial proposal {quotation.QuotationNumber}.",
            "QuoteConfirmed",
            "Quotation",
            quotation.Id);

        return MapToCustomerQuoteDto(quotation);
    }

    private static CustomerQuoteDto MapToCustomerQuoteDto(Quotation q)
    {
        // STRICT ZERO-LEAK SECURITY INVARIANT:
        // CostPrice, UnitMargin, MarginPercent, TotalCost, BlendedRiskScore,
        // and ManagerRemarks are strictly stripped!
        return new CustomerQuoteDto
        {
            Id = q.Id,
            QuotationNumber = q.QuotationNumber,
            CustomerName = q.Customer?.Name ?? string.Empty,
            Status = q.Status.ToString(),
            SubTotal = q.SubTotal,
            DiscountTotal = q.DiscountTotal,
            TaxTotal = q.TaxTotal,
            GrandTotal = q.GrandTotal,
            CurrencyCode = q.CurrencyCode,
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
        };
    }
}
