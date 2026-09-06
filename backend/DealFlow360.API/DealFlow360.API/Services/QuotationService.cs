using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Orders;
using DealFlow360.API.DTOs.Quotations;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IQuotationService
{
    Task<List<QuotationListResponse>> GetQuotationsAsync(int? salesRepId = null, QuoteStatus? status = null);
    Task<QuotationDetailResponse> GetQuotationByIdAsync(int id);
    Task<QuotationDetailResponse> CreateQuotationAsync(CreateQuotationRequest request, int salesRepId);
    Task<QuotationDetailResponse> UpdateQuotationAsync(int id, UpdateQuotationRequest request, int userId);
    Task<QuotationDetailResponse> AddLineItemAsync(int quotationId, AddLineRequest request, int userId);
    Task<QuotationDetailResponse> UpdateLineItemAsync(int quotationId, int lineId, UpdateLineRequest request, int userId);
    Task<QuotationDetailResponse> RemoveLineItemAsync(int quotationId, int lineId, int userId);
    Task<QuotationDetailResponse> RecalculateQuotationAsync(int id);
    Task<QuotationDetailResponse> SubmitForApprovalAsync(int id, int userId);
    Task<List<RecommendationResponse>> GetUpsellRecommendationsAsync(int id);
    Task<List<RecommendationResponse>> PreviewCartRecommendationsAsync(List<int> productIds, int? customerId = null, decimal? minMargin = null);
    Task<QuotationDetailResponse> AddRecommendationToQuoteAsync(int quotationId, int productId, int userId);
    Task<bool> DismissRecommendationAsync(int quotationId, int productId, int userId);
    Task<string> GeneratePortalLinkAsync(int quotationId);
    Task<QuotationDetailResponse> AddLineCommentAsync(int quotationId, int lineId, string comment, int userId);
    Task<QuotationDetailResponse> NegotiateLinePriceAsync(int quotationId, int lineId, NegotiatePriceRequest request, int userId);
    Task<QuotationDetailResponse> NegotiateDealAsync(int quotationId, NegotiateDealRequest request, int userId);
    Task<QuotationDetailResponse> SendQuotationAsync(int quotationId, SendQuotationRequest request, int userId);
    Task<QuotationDetailResponse> AcceptCounterOfferAsync(int quotationId, AcceptCounterOfferRequest request, int userId);
    Task<QuotationDetailResponse> RejectCounterOfferAsync(int quotationId, RejectCounterOfferRequest request, int userId);
    Task<QuotationDetailResponse> DisqualifyQuotationAsync(int quotationId, DisqualifyQuotationRequest request, int userId);
    Task<OrderDetailResponse> ConvertToOrderAsync(int quotationId, int userId);
}

public class QuotationService : IQuotationService
{
    private readonly AppDbContext _context;
    private readonly IMarginCalculationEngine _marginEngine;
    private readonly IDiscountGovernanceEngine _governanceEngine;
    private readonly IBlendedDiscountRiskEngine _riskEngine;
    private readonly IUpsellCrossSellEngine _upsellEngine;
    private readonly IJwtService _jwtService;
    private readonly IFulfillmentService _fulfillmentService;
    private readonly IBillingService _billingService;

    public QuotationService(
        AppDbContext context,
        IMarginCalculationEngine marginEngine,
        IDiscountGovernanceEngine governanceEngine,
        IBlendedDiscountRiskEngine riskEngine,
        IUpsellCrossSellEngine upsellEngine,
        IJwtService jwtService,
        IFulfillmentService fulfillmentService,
        IBillingService billingService)
    {
        _context = context;
        _marginEngine = marginEngine;
        _governanceEngine = governanceEngine;
        _riskEngine = riskEngine;
        _upsellEngine = upsellEngine;
        _jwtService = jwtService;
        _fulfillmentService = fulfillmentService;
        _billingService = billingService;
    }

    public async Task<List<QuotationListResponse>> GetQuotationsAsync(int? salesRepId = null, QuoteStatus? status = null)
    {
        var query = _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.SalesRep)
            .AsQueryable();

        if (salesRepId.HasValue)
        {
            query = query.Where(q => q.SalesRepId == salesRepId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(q => q.Status == status.Value);
        }

        return await query
            .OrderByDescending(q => q.UpdatedAtUtc ?? q.CreatedAtUtc)
            .Select(q => new QuotationListResponse
            {
                Id = q.Id,
                QuotationNumber = q.QuotationNumber,
                Version = q.Version,
                CustomerName = q.Customer.Name,
                SalesRepName = q.SalesRep.FullName,
                Status = q.Status.ToString(),
                GrandTotal = q.GrandTotal,
                MarginPercent = q.MarginPercent,
                RiskScore = q.RiskScore,
                ApprovalStatus = q.ApprovalStatus.ToString(),
                OrderId = _context.Orders.Where(o => o.QuotationId == q.Id).Select(o => (int?)o.Id).FirstOrDefault(),
                OrderNumber = _context.Orders.Where(o => o.QuotationId == q.Id).Select(o => o.OrderNumber).FirstOrDefault(),
                CreatedAtUtc = q.CreatedAtUtc,
                UpdatedAtUtc = q.UpdatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<QuotationDetailResponse> GetQuotationByIdAsync(int id)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.SalesRep)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Lines).ThenInclude(l => l.Variant)
            .Include(q => q.Lines).ThenInclude(l => l.Comments).ThenInclude(c => c.User)
            .Include(q => q.ApprovalRequests).ThenInclude(a => a.ActedBy)
            .Include(q => q.ApprovalRequests).ThenInclude(a => a.Actions)
            .Include(q => q.Changes).ThenInclude(c => c.RequestedBy)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {id} not found.");

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.QuotationId == id);

        return MapToDetailResponse(quotation, order);
    }

    public async Task<QuotationDetailResponse> CreateQuotationAsync(CreateQuotationRequest request, int salesRepId)
    {
        var quotationNumber = $"QT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var quotation = new Quotation
        {
            QuotationNumber = quotationNumber,
            CustomerId = request.CustomerId,
            SalesRepId = salesRepId,
            PriceListId = request.PriceListId,
            Status = QuoteStatus.Draft,
            ApprovalStatus = ApprovalStatus.None,
            CurrencyCode = request.CurrencyCode ?? "USD",
            ExpectedCloseDate = request.ExpectedCloseDate,
            Notes = request.Notes,
            SubTotal = 0,
            DiscountTotal = 0,
            TaxTotal = 0,
            GrandTotal = 0,
            CostTotal = 0,
            MarginAmount = 0,
            MarginPercent = 0,
            RiskScore = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Quotations.Add(quotation);
        await _context.SaveChangesAsync();

        if (request.Lines != null && request.Lines.Any())
        {
            foreach (var lReq in request.Lines)
            {
                var product = await _context.Products.FindAsync(lReq.ProductId);
                if (product != null)
                {
                    if (!product.IsActive)
                    {
                        throw new InvalidOperationException($"Product '{product.Name}' is inactive/deactivated and cannot be added to new quotes.");
                    }

                    decimal resolvedPrice = lReq.UnitPrice > 0 ? lReq.UnitPrice : await ResolveProductPriceAsync(quotation.PriceListId, quotation.CustomerId, product, lReq.VariantId);
                    var line = new QuotationLine
                    {
                        QuotationId = quotation.Id,
                        ProductId = lReq.ProductId,
                        VariantId = lReq.VariantId,
                        Quantity = lReq.Quantity,
                        UnitPrice = resolvedPrice,
                        DiscountPercent = lReq.DiscountPercent,
                        SubscriptionPlanId = lReq.SubscriptionPlanId
                    };
                    _marginEngine.CalculateLine(line, product);
                    quotation.Lines.Add(line);
                }
            }
            await RecalculateAndSaveQuotationAsync(quotation);
        }

        // Auto-link Sales Inquiry if specified directly or referenced in notes
        string? targetInquiryRef = request.InquiryRequestNumber;
        if (string.IsNullOrWhiteSpace(targetInquiryRef) && !string.IsNullOrWhiteSpace(request.Notes))
        {
            var match = System.Text.RegularExpressions.Regex.Match(request.Notes, @"(SCR-\d{8}-[A-F0-9]{6})", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (match.Success)
            {
                targetInquiryRef = match.Value;
            }
        }

        if (!string.IsNullOrWhiteSpace(targetInquiryRef))
        {
            var inquiry = await _context.SalesConnectionRequests
                .FirstOrDefaultAsync(r => r.RequestNumber == targetInquiryRef);
            if (inquiry != null)
            {
                inquiry.QuotationId = quotation.Id;
                inquiry.Status = SalesConnectionStatus.QuoteCreated;
                inquiry.UpdatedAtUtc = DateTime.UtcNow;
                _context.SalesConnectionRequests.Update(inquiry);
            }
        }

        // Check if discount exceeds customer tier ceiling -> automatically route to manager for verification
        var customer = await _context.Customers
            .Include(c => c.Tier)
            .FirstOrDefaultAsync(c => c.Id == quotation.CustomerId);
        decimal tierLimit = customer?.Tier?.MaxDiscountPercent ?? 5.00m;
        string tierName = customer?.Tier?.Name ?? "Bronze";
        bool exceedsTier = quotation.Lines.Any(l => l.DiscountPercent > tierLimit);

        if (exceedsTier)
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;
            quotation.UpdatedAtUtc = DateTime.UtcNow;
            await EnsureManagerApprovalRequestAsync(quotation, tierLimit, tierName);
            _context.Quotations.Update(quotation);
            await _context.SaveChangesAsync();
        }
        else
        {
            // Auto-approved immediately within customer tier ceiling (<= tierLimit) -> No manager escalation needed
            quotation.Status = !string.IsNullOrWhiteSpace(targetInquiryRef) ? QuoteStatus.Sent : QuoteStatus.Approved;
            quotation.ApprovalStatus = ApprovalStatus.Approved;
            quotation.UpdatedAtUtc = DateTime.UtcNow;
            _context.Quotations.Update(quotation);
            await _context.SaveChangesAsync();
        }

        return await GetQuotationByIdAsync(quotation.Id);
    }

    public async Task<QuotationDetailResponse> UpdateQuotationAsync(int id, UpdateQuotationRequest request, int userId)
    {
        var quotation = await _context.Quotations.FindAsync(id);
        if (quotation == null) throw new KeyNotFoundException($"Quotation {id} not found.");

        if (request.ExpectedCloseDate.HasValue) quotation.ExpectedCloseDate = request.ExpectedCloseDate.Value;
        if (request.Notes != null) quotation.Notes = request.Notes;

        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        return await GetQuotationByIdAsync(id);
    }

    public async Task<QuotationDetailResponse> AddLineItemAsync(int quotationId, AddLineRequest request, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.Confirmed || quotation.Status == QuoteStatus.ConvertedToOrder)
        {
            throw new InvalidOperationException("Cannot modify deliverables on a confirmed quotation. Commercial terms are locked.");
        }

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) throw new KeyNotFoundException($"Product {request.ProductId} not found.");

        if (!product.IsActive)
        {
            throw new InvalidOperationException($"Product '{product.Name}' is inactive/deactivated and cannot be added to new quotes.");
        }

        decimal resolvedPrice = request.UnitPrice > 0 ? request.UnitPrice : await ResolveProductPriceAsync(quotation.PriceListId, quotation.CustomerId, product, request.VariantId);

        var line = new QuotationLine
        {
            QuotationId = quotationId,
            ProductId = request.ProductId,
            VariantId = request.VariantId,
            Quantity = request.Quantity,
            UnitPrice = resolvedPrice,
            DiscountPercent = request.DiscountPercent,
            SubscriptionPlanId = request.SubscriptionPlanId
        };

        _marginEngine.CalculateLine(line, product);
        quotation.Lines.Add(line);

        var customer = await _context.Customers.Include(c => c.Tier).FirstOrDefaultAsync(c => c.Id == quotation.CustomerId);
        decimal tierLimit = customer?.Tier?.MaxDiscountPercent ?? 5.00m;
        string tierName = customer?.Tier?.Name ?? "Silver";

        if (quotation.Lines.Any(l => l.DiscountPercent > tierLimit))
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;
            await EnsureManagerApprovalRequestAsync(quotation, tierLimit, tierName);
        }
        else
        {
            quotation.Status = QuoteStatus.Approved;
            quotation.ApprovalStatus = ApprovalStatus.Approved;
            var pendingRequests = await _context.ApprovalRequests
                .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                .ToListAsync();
            if (pendingRequests.Any())
            {
                _context.ApprovalRequests.RemoveRange(pendingRequests);
            }
        }

        await RecalculateAndSaveQuotationAsync(quotation);
        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> UpdateLineItemAsync(int quotationId, int lineId, UpdateLineRequest request, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.Confirmed || quotation.Status == QuoteStatus.ConvertedToOrder)
        {
            throw new InvalidOperationException("Cannot modify deliverables on a confirmed quotation. Commercial terms are locked.");
        }

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) throw new KeyNotFoundException($"Line item {lineId} not found.");

        var product = await _context.Products.FindAsync(line.ProductId);
        if (product == null) throw new KeyNotFoundException($"Product {line.ProductId} not found.");

        line.Quantity = request.Quantity;
        line.DiscountPercent = request.DiscountPercent;
        if (request.UnitPrice.HasValue) line.UnitPrice = request.UnitPrice.Value;

        _marginEngine.CalculateLine(line, product);

        var customer = await _context.Customers.Include(c => c.Tier).FirstOrDefaultAsync(c => c.Id == quotation.CustomerId);
        decimal tierLimit = customer?.Tier?.MaxDiscountPercent ?? 5.00m;
        string tierName = customer?.Tier?.Name ?? "Silver";

        if (quotation.Lines.Any(l => l.DiscountPercent > tierLimit))
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;
            await EnsureManagerApprovalRequestAsync(quotation, tierLimit, tierName);
        }
        else
        {
            quotation.Status = QuoteStatus.Approved;
            quotation.ApprovalStatus = ApprovalStatus.Approved;
            var pendingRequests = await _context.ApprovalRequests
                .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                .ToListAsync();
            if (pendingRequests.Any())
            {
                _context.ApprovalRequests.RemoveRange(pendingRequests);
            }
        }

        await RecalculateAndSaveQuotationAsync(quotation);

        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> RemoveLineItemAsync(int quotationId, int lineId, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.Confirmed || quotation.Status == QuoteStatus.ConvertedToOrder)
        {
            throw new InvalidOperationException("Cannot remove line items from a confirmed quotation. Commercial terms are locked.");
        }

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line != null)
        {
            _context.QuotationLines.Remove(line);
            quotation.Lines.Remove(line);

            var customer = await _context.Customers.Include(c => c.Tier).FirstOrDefaultAsync(c => c.Id == quotation.CustomerId);
            decimal tierLimit = customer?.Tier?.MaxDiscountPercent ?? 5.00m;
            string tierName = customer?.Tier?.Name ?? "Silver";

            if (quotation.Lines.Any(l => l.DiscountPercent > tierLimit))
            {
                quotation.Status = QuoteStatus.PendingApproval;
                quotation.ApprovalStatus = ApprovalStatus.Pending;
                await EnsureManagerApprovalRequestAsync(quotation, tierLimit, tierName);
            }
            else
            {
                quotation.Status = QuoteStatus.Approved;
                quotation.ApprovalStatus = ApprovalStatus.Approved;
                var pendingRequests = await _context.ApprovalRequests
                    .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                    .ToListAsync();
                if (pendingRequests.Any())
                {
                    _context.ApprovalRequests.RemoveRange(pendingRequests);
                }
            }

            await RecalculateAndSaveQuotationAsync(quotation);
        }

        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> AddLineCommentAsync(int quotationId, int lineId, string comment, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) throw new KeyNotFoundException($"Quotation line {lineId} not found.");

        if (string.IsNullOrWhiteSpace(comment))
        {
            throw new ArgumentException("Comment text cannot be empty.");
        }

        var lineComment = new QuotationLineComment
        {
            QuotationLineId = lineId,
            UserId = userId,
            Comment = comment.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.QuotationLineComments.Add(lineComment);

        if (quotation.Status == QuoteStatus.Draft || quotation.Status == QuoteStatus.Sent)
        {
            quotation.Status = QuoteStatus.UnderNegotiation;
        }
        quotation.UpdatedAtUtc = DateTime.UtcNow;

        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> NegotiateLinePriceAsync(int quotationId, int lineId, NegotiatePriceRequest request, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.Confirmed || quotation.Status == QuoteStatus.ConvertedToOrder || quotation.Status == QuoteStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot negotiate prices on a confirmed or converted quotation. Commercial terms are locked.");
        }

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) throw new KeyNotFoundException($"Quotation line {lineId} not found.");

        var product = await _context.Products.FindAsync(line.ProductId);
        if (product == null) throw new KeyNotFoundException($"Product {line.ProductId} not found.");

        decimal oldPrice = line.UnitPrice;
        decimal oldDiscount = line.DiscountPercent;
        decimal oldQty = line.Quantity;

        if (request.Quantity.HasValue && request.Quantity.Value > 0)
        {
            line.Quantity = request.Quantity.Value;
        }

        decimal? targetPrice = request.TargetUnitPrice ?? request.ProposedUnitPrice;
        decimal? targetDisc = request.TargetDiscountPercent ?? request.ProposedDiscountPercent;

        if (targetPrice.HasValue && targetPrice.Value > 0)
        {
            line.UnitPrice = targetPrice.Value;
        }

        if (targetDisc.HasValue && targetDisc.Value >= 0)
        {
            line.DiscountPercent = targetDisc.Value;
        }

        _marginEngine.CalculateLine(line, product);

        // Record negotiation audit thread comment
        var note = string.IsNullOrWhiteSpace(request.Reason) ? "Commercial counter-proposal applied." : request.Reason.Trim();
        var commentText = $"[Sales Rep Counter-Offer] Price updated to {quotation.CurrencyCode} {line.UnitPrice:N2} with {line.DiscountPercent}% discount. Note: {note}";

        var lineComment = new QuotationLineComment
        {
            QuotationLineId = lineId,
            UserId = userId,
            Comment = commentText,
            CreatedAtUtc = DateTime.UtcNow
        };
        _context.QuotationLineComments.Add(lineComment);

        string changeType = (quotation.Status == QuoteStatus.Sent || quotation.Status == QuoteStatus.UnderNegotiation)
            ? "CustomerCounterOffer"
            : "RepCounterOffer";

        _context.QuotationChanges.Add(new QuotationChange
        {
            QuotationId = quotationId,
            ChangeType = changeType,
            Description = $"Target unit price: {line.UnitPrice:N2}, Discount: {line.DiscountPercent}%. Note: {note}",
            RequestedByUserId = userId,
            OldValueJson = $"{{\"unitPrice\":{oldPrice},\"discount\":{oldDiscount},\"quantity\":{oldQty}}}",
            NewValueJson = System.Text.Json.JsonSerializer.Serialize(new {
                unitPrice = line.UnitPrice,
                discount = line.DiscountPercent,
                DiscountPercent = line.DiscountPercent,
                quantity = line.Quantity,
                LineId = lineId,
                Reason = note
            }),
            CreatedAtUtc = DateTime.UtcNow
        });

        // Check if discount triggers approval
        decimal tierCeiling = quotation.Customer?.Tier?.MaxDiscountPercent ?? 5.0m;
        string tierName = quotation.Customer?.Tier?.Name ?? "Bronze";
        bool anyExceeds = quotation.Lines.Any(l => l.DiscountPercent > tierCeiling);
        if (anyExceeds)
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;
            await EnsureManagerApprovalRequestAsync(quotation, tierCeiling, tierName, quotation.Lines.Max(l => l.DiscountPercent));
        }
        else
        {
            if (quotation.Status == QuoteStatus.Sent || quotation.Status == QuoteStatus.UnderNegotiation)
            {
                quotation.Status = QuoteStatus.UnderNegotiation;
            }
            else
            {
                quotation.Status = QuoteStatus.Approved;
                quotation.ApprovalStatus = ApprovalStatus.Approved;
            }
            var pendingApprovals = await _context.ApprovalRequests
                .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                .ToListAsync();
            if (pendingApprovals.Any())
            {
                _context.ApprovalRequests.RemoveRange(pendingApprovals);
            }
        }

        quotation.Version++;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);
        await RecalculateAndSaveQuotationAsync(quotation);
        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> NegotiateDealAsync(int quotationId, NegotiateDealRequest request, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.Confirmed || quotation.Status == QuoteStatus.ConvertedToOrder || quotation.Status == QuoteStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot negotiate deal terms on a confirmed or converted quotation. Commercial terms are locked.");
        }

        decimal discount = Math.Max(0, Math.Min(100, request.OverallDiscountPercent));

        foreach (var line in quotation.Lines)
        {
            line.DiscountPercent = discount;
            var prod = await _context.Products.FindAsync(line.ProductId);
            if (prod != null)
            {
                _marginEngine.CalculateLine(line, prod);
            }
        }

        _marginEngine.CalculateQuotationTotals(quotation);

        var note = string.IsNullOrWhiteSpace(request.Reason) ? "Deal-wide discount counter-proposal." : request.Reason.Trim();
        _context.QuotationChanges.Add(new QuotationChange
        {
            QuotationId = quotationId,
            ChangeType = "RepCounterOffer",
            Description = $"Deal-wide discount updated to {discount}%. Note: {note}",
            RequestedByUserId = userId,
            NewValueJson = $"{{\"dealDiscount\":{discount}}}",
            CreatedAtUtc = DateTime.UtcNow
        });

        decimal tierCeiling = quotation.Customer?.Tier?.MaxDiscountPercent ?? 5.0m;
        string tierName = quotation.Customer?.Tier?.Name ?? "Bronze";
        if (discount > tierCeiling)
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;
            await EnsureManagerApprovalRequestAsync(quotation, tierCeiling, tierName, discount);
        }
        else
        {
            if (quotation.Status == QuoteStatus.Sent || quotation.Status == QuoteStatus.UnderNegotiation)
            {
                quotation.Status = QuoteStatus.UnderNegotiation;
            }
            else
            {
                quotation.Status = QuoteStatus.Approved;
                quotation.ApprovalStatus = ApprovalStatus.Approved;
            }
            var pendingApprovals = await _context.ApprovalRequests
                .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                .ToListAsync();
            if (pendingApprovals.Any())
            {
                _context.ApprovalRequests.RemoveRange(pendingApprovals);
            }
        }

        quotation.Version++;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);
        await RecalculateAndSaveQuotationAsync(quotation);
        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> SendQuotationAsync(int quotationId, SendQuotationRequest request, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder || quotation.Status == QuoteStatus.Confirmed)
        {
            throw new InvalidOperationException("Cannot send an order-confirmed quotation.");
        }

        quotation.Status = QuoteStatus.Sent;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(request?.Notes))
        {
            quotation.Notes = request.Notes;
        }

        _context.QuotationChanges.Add(new QuotationChange
        {
            QuotationId = quotationId,
            ChangeType = "SentToCustomer",
            Description = $"Quotation officially sent to client ({quotation.Customer?.Name}) for review and negotiation.",
            RequestedByUserId = userId,
            CreatedAtUtc = DateTime.UtcNow
        });

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "SendQuotation",
            Reason = $"Quotation #{quotation.QuotationNumber} sent to client {quotation.Customer?.Name}.",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> AcceptCounterOfferAsync(int quotationId, AcceptCounterOfferRequest request, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .Include(q => q.Changes)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder || quotation.Status == QuoteStatus.Confirmed)
        {
            throw new InvalidOperationException("Cannot accept counter offers on an order-confirmed quotation.");
        }

        // Identify counter offer from latest CounterDiscount change or request
        var latestCounter = quotation.Changes
            .Where(c => c.ChangeType == "CounterDiscount" || c.ChangeType == "CustomerCounterOffer" || c.ChangeType == "RepCounterOffer")
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefault();

        decimal targetDiscount = request?.CounterDiscountPercent ?? 0;
        int? targetLineId = request?.LineId;

        if (latestCounter != null && !string.IsNullOrEmpty(latestCounter.NewValueJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(latestCounter.NewValueJson);
                if (targetDiscount <= 0)
                {
                    if (doc.RootElement.TryGetProperty("DiscountPercent", out var dp))
                        targetDiscount = dp.GetDecimal();
                    else if (doc.RootElement.TryGetProperty("discount", out var dp2))
                        targetDiscount = dp2.GetDecimal();
                    else if (doc.RootElement.TryGetProperty("CounterDiscount", out var dp3))
                        targetDiscount = dp3.GetDecimal();
                }

                if (!targetLineId.HasValue)
                {
                    if (doc.RootElement.TryGetProperty("LineId", out var li))
                        targetLineId = li.GetInt32();
                    else if (doc.RootElement.TryGetProperty("lineId", out var li2))
                        targetLineId = li2.GetInt32();
                }
            }
            catch { }
        }

        // Apply discount to the line or all lines
        if (targetLineId.HasValue)
        {
            var line = quotation.Lines.FirstOrDefault(l => l.Id == targetLineId.Value);
            if (line != null && targetDiscount > 0)
            {
                line.DiscountPercent = targetDiscount;
                if (line.Product != null) _marginEngine.CalculateLine(line, line.Product);
            }
        }
        else if (targetDiscount > 0)
        {
            foreach (var l in quotation.Lines)
            {
                l.DiscountPercent = targetDiscount;
                if (l.Product != null) _marginEngine.CalculateLine(l, l.Product);
            }
        }

        _marginEngine.CalculateQuotationTotals(quotation);

        decimal tierLimit = quotation.Customer?.Tier?.MaxDiscountPercent ?? 5.00m;
        string tierName = quotation.Customer?.Tier?.Name ?? "Silver";
        bool exceedsTier = quotation.Lines.Any(l => l.DiscountPercent > tierLimit);

        if (!exceedsTier)
        {
            // CRITICAL RULE: Within tier ceiling -> Auto-approved immediately, remove approval requests!
            quotation.Status = QuoteStatus.Approved;
            quotation.ApprovalStatus = ApprovalStatus.Approved;

            var pendingApprovals = await _context.ApprovalRequests
                .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                .ToListAsync();
            if (pendingApprovals.Any())
            {
                _context.ApprovalRequests.RemoveRange(pendingApprovals);
            }
        }
        else
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;
            await EnsureManagerApprovalRequestAsync(quotation, tierLimit, tierName, quotation.Lines.Max(l => l.DiscountPercent));
        }

        quotation.Version++;
        quotation.UpdatedAtUtc = DateTime.UtcNow;

        _context.QuotationChanges.Add(new QuotationChange
        {
            QuotationId = quotation.Id,
            ChangeType = "RepAcceptedCounterOffer",
            Description = $"Sales Representative accepted customer counter-offer at {targetDiscount:F1}% discount. Reason: {request?.Reason ?? "Commercial agreement reached."}",
            RequestedByUserId = userId,
            NewValueJson = System.Text.Json.JsonSerializer.Serialize(new { AcceptedDiscount = targetDiscount, LineId = targetLineId, Reason = request?.Reason }),
            CreatedAtUtc = DateTime.UtcNow
        });

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "RepAcceptedCounterOffer",
            Reason = $"Accepted customer counter offer at {targetDiscount:F1}% discount. Tier Limit: {tierLimit}%. Status: {quotation.Status}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        await RecalculateAndSaveQuotationAsync(quotation);
        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> RejectCounterOfferAsync(int quotationId, RejectCounterOfferRequest request, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.Status == QuoteStatus.ConvertedToOrder || quotation.Status == QuoteStatus.Confirmed)
        {
            throw new InvalidOperationException("Cannot reject terms on an order-confirmed quotation.");
        }

        if (request.DisqualifyDeal)
        {
            quotation.Status = QuoteStatus.Cancelled;
            quotation.UpdatedAtUtc = DateTime.UtcNow;

            _context.QuotationChanges.Add(new QuotationChange
            {
                QuotationId = quotation.Id,
                ChangeType = "DealDisqualified",
                Description = $"Deal disqualified / closed lost during negotiation. Reason: {request.Reason ?? "Terms rejected."}",
                RequestedByUserId = userId,
                CreatedAtUtc = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                EntityName = "Quotation",
                EntityId = quotation.Id,
                Action = "DealDisqualified",
                Reason = $"Quotation #{quotation.QuotationNumber} disqualified: {request.Reason ?? "Customer terms rejected."}",
                CreatedAtUtc = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return await GetQuotationByIdAsync(quotationId);
        }

        // Sales Rep Counter-Offer branch
        if (request.CounterDiscountPercent.HasValue || request.CounterUnitPrice.HasValue)
        {
            var line = request.LineId.HasValue
                ? quotation.Lines.FirstOrDefault(l => l.Id == request.LineId.Value)
                : quotation.Lines.FirstOrDefault();

            if (line != null)
            {
                if (request.CounterDiscountPercent.HasValue)
                {
                    line.DiscountPercent = request.CounterDiscountPercent.Value;
                }
                if (request.CounterUnitPrice.HasValue && request.CounterUnitPrice.Value > 0)
                {
                    line.UnitPrice = request.CounterUnitPrice.Value;
                }
                if (line.Product != null) _marginEngine.CalculateLine(line, line.Product);
            }

            _marginEngine.CalculateQuotationTotals(quotation);

            decimal tierLimit = quotation.Customer?.Tier?.MaxDiscountPercent ?? 5.00m;
            string tierName = quotation.Customer?.Tier?.Name ?? "Silver";
            decimal maxDisc = quotation.Lines.Any() ? quotation.Lines.Max(l => l.DiscountPercent) : 0m;

            if (maxDisc <= tierLimit)
            {
                quotation.Status = QuoteStatus.UnderNegotiation;
                quotation.ApprovalStatus = ApprovalStatus.None;
                var pendingApprovals = await _context.ApprovalRequests
                    .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                    .ToListAsync();
                if (pendingApprovals.Any())
                {
                    _context.ApprovalRequests.RemoveRange(pendingApprovals);
                }
            }
            else
            {
                quotation.Status = QuoteStatus.PendingApproval;
                quotation.ApprovalStatus = ApprovalStatus.Pending;
                await EnsureManagerApprovalRequestAsync(quotation, tierLimit, tierName, maxDisc);
            }

            quotation.Version++;
            quotation.UpdatedAtUtc = DateTime.UtcNow;

            _context.QuotationChanges.Add(new QuotationChange
            {
                QuotationId = quotation.Id,
                ChangeType = "RepCounterOffer",
                Description = $"Customer offer rejected. Sales Rep proposed counter-discount of {request.CounterDiscountPercent ?? maxDisc:F1}%. Note: {request.Reason ?? "Best commercial compromise offered."}",
                RequestedByUserId = userId,
                NewValueJson = System.Text.Json.JsonSerializer.Serialize(new { CounterDiscount = request.CounterDiscountPercent, LineId = line?.Id, Reason = request.Reason }),
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        else
        {
            _context.QuotationChanges.Add(new QuotationChange
            {
                QuotationId = quotation.Id,
                ChangeType = "RepRejectedCounterOffer",
                Description = $"Customer counter-offer rejected. Reason: {request.Reason ?? "Terms cannot be accommodated."}",
                RequestedByUserId = userId,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        await RecalculateAndSaveQuotationAsync(quotation);
        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<QuotationDetailResponse> DisqualifyQuotationAsync(int quotationId, DisqualifyQuotationRequest request, int userId)
    {
        return await RejectCounterOfferAsync(quotationId, new RejectCounterOfferRequest
        {
            DisqualifyDeal = true,
            Reason = request.Reason
        }, userId);
    }

    public async Task<QuotationDetailResponse> RecalculateQuotationAsync(int id)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {id} not found.");

        foreach (var line in quotation.Lines)
        {
            if (line.Product != null)
            {
                var currentPrice = await ResolveProductPriceAsync(quotation.PriceListId, quotation.CustomerId, line.Product, line.VariantId);
                line.UnitPrice = currentPrice;
                _marginEngine.CalculateLine(line, line.Product);
            }
        }

        await RecalculateAndSaveQuotationAsync(quotation);
        return await GetQuotationByIdAsync(id);
    }

    public async Task<QuotationDetailResponse> SubmitForApprovalAsync(int id, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {id} not found.");

        if (quotation.Status == QuoteStatus.Approved || quotation.ApprovalStatus == ApprovalStatus.Approved || quotation.Status == QuoteStatus.Confirmed || quotation.Status == QuoteStatus.ConvertedToOrder)
        {
            throw new InvalidOperationException("Cannot submit an already approved or confirmed quotation for approval.");
        }

        await RecalculateAndSaveQuotationAsync(quotation);

        var discountRules = await _context.DiscountRules.Where(r => r.IsActive).ToListAsync();
        var approvalRules = await _context.ApprovalRules.Where(r => r.IsActive).OrderBy(r => r.Sequence).ToListAsync();
        var evalResult = _governanceEngine.EvaluateDiscounts(quotation.Customer, quotation.Lines, discountRules);
        var riskResult = _riskEngine.CalculateRiskScore(evalResult.PeakLineViolation, evalResult.WeightedMarginLoss, quotation.MarginPercent, approvalRules);

        decimal tierLimit = quotation.Customer?.Tier?.MaxDiscountPercent ?? 5.00m;
        string tierName = quotation.Customer?.Tier?.Name ?? "Silver";
        bool exceedsTier = quotation.Lines.Any(l => l.DiscountPercent > tierLimit);
        bool requiresApproval = exceedsTier || evalResult.RequiresApproval || riskResult.RiskScore >= 70.00m;

        if (requiresApproval)
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;

            var requiredLevel = (riskResult.RiskScore >= 70.00m || riskResult.RequiredLevel == ApprovalLevel.Finance)
                ? ApprovalLevel.Finance
                : ApprovalLevel.Manager;

            var existingPending = await _context.ApprovalRequests
                .FirstOrDefaultAsync(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending);

            decimal maxLineDiscount = quotation.Lines.Any() ? quotation.Lines.Max(l => l.DiscountPercent) : 0m;
            string reason = exceedsTier
                ? $"Discount of {maxLineDiscount:F2}% exceeds customer {tierName} Tier ceiling ({tierLimit:F2}%). Automatically routed to Sales Manager for verification and approval."
                : $"Submitted for governance authorization (Risk Score: {riskResult.RiskScore:F2}, Target Level: {requiredLevel})";

            if (existingPending == null)
            {
                var approvalRequest = new ApprovalRequest
                {
                    QuotationId = quotation.Id,
                    Level = requiredLevel,
                    Status = ApprovalStatus.Pending,
                    Sequence = 1,
                    RequestedAtUtc = DateTime.UtcNow,
                    Reason = reason
                };

                _context.ApprovalRequests.Add(approvalRequest);
            }
            else
            {
                existingPending.Level = requiredLevel;
                existingPending.Reason = reason;
                existingPending.RequestedAtUtc = DateTime.UtcNow;
                _context.ApprovalRequests.Update(existingPending);
            }
        }
        else
        {
            // Discount is within tier limit (<= 10% for Silver Tier) -> No approval required ("koi issue nahi") -> Auto-approved!
            quotation.Status = QuoteStatus.Approved;
            quotation.ApprovalStatus = ApprovalStatus.Approved;

            var pendingRequests = await _context.ApprovalRequests
                .Where(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending)
                .ToListAsync();
            if (pendingRequests.Any())
            {
                _context.ApprovalRequests.RemoveRange(pendingRequests);
            }
        }

        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        return await GetQuotationByIdAsync(id);
    }

    public async Task<List<RecommendationResponse>> GetUpsellRecommendationsAsync(int id)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {id} not found.");

        var cartProductIds = quotation.Lines.Select(l => l.ProductId).ToHashSet();
        var cartProductIdsList = cartProductIds.ToList();

        var ordersWithCartProducts = await _context.OrderLines
            .Where(ol => cartProductIdsList.Contains(ol.ProductId))
            .Select(ol => ol.OrderId)
            .Distinct()
            .ToListAsync();

        var coPurchases = await _context.OrderLines
            .Where(ol => ordersWithCartProducts.Contains(ol.OrderId) && !cartProductIdsList.Contains(ol.ProductId))
            .GroupBy(ol => ol.ProductId)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.Count);

        var customerPastProductIds = await _context.Orders
            .Where(o => o.CustomerId == quotation.CustomerId)
            .SelectMany(o => o.Lines)
            .Select(ol => ol.ProductId)
            .Distinct()
            .ToListAsync();

        var incompatibleRules = await _context.UpsellCrossSellRules
            .Where(r => r.IsActive && r.RuleType == "Incompatible" &&
                  (cartProductIdsList.Contains(r.TriggerProductId) || cartProductIdsList.Contains(r.SuggestedProductId)))
            .ToListAsync();

        var incompatibleProductIds = incompatibleRules
            .Select(r => cartProductIdsList.Contains(r.TriggerProductId) ? r.SuggestedProductId : r.TriggerProductId)
            .ToHashSet();

        var dismissedProductLogs = await _context.AuditLogs
            .Where(a => a.EntityName == "Quotation" && a.EntityId == quotation.Id && a.Action == "RecommendationDismissed")
            .ToListAsync();

        var dismissedProductIds = new HashSet<int>();
        foreach (var log in dismissedProductLogs)
        {
            if (int.TryParse(log.NewValueJson, out var dId))
            {
                dismissedProductIds.Add(dId);
            }
        }

        var context = new RecommendationContext
        {
            QuotationId = quotation.Id,
            CustomerId = quotation.CustomerId,
            CartProductIds = cartProductIds,
            CurrentRevenue = quotation.SubTotal - quotation.DiscountTotal,
            CurrentCost = quotation.Lines.Sum(l => l.Product != null ? l.Product.CostPrice * l.Quantity : 0m),
            MinimumMarginThreshold = 15.0m,
            HistoricalCoPurchases = coPurchases,
            CustomerHistoricalProductIds = customerPastProductIds.ToHashSet(),
            IncompatibleProductIds = incompatibleProductIds,
            DismissedProductIds = dismissedProductIds
        };

        var rules = await _context.UpsellCrossSellRules.Include(r => r.TriggerProduct).Include(r => r.SuggestedProduct).ToListAsync();
        var products = await _context.Products.Include(p => p.Category).ToListAsync();

        return _upsellEngine.GetRecommendations(context, rules, products);
    }

    public async Task<List<RecommendationResponse>> PreviewCartRecommendationsAsync(List<int> productIds, int? customerId = null, decimal? minMargin = null)
    {
        if (productIds == null || !productIds.Any()) return new List<RecommendationResponse>();

        var cartProductIds = productIds.ToHashSet();
        var cartProductIdsList = cartProductIds.ToList();

        var ordersWithCartProducts = await _context.OrderLines
            .Where(ol => cartProductIdsList.Contains(ol.ProductId))
            .Select(ol => ol.OrderId)
            .Distinct()
            .ToListAsync();

        var coPurchases = await _context.OrderLines
            .Where(ol => ordersWithCartProducts.Contains(ol.OrderId) && !cartProductIdsList.Contains(ol.ProductId))
            .GroupBy(ol => ol.ProductId)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.Count);

        var customerPastProductIds = new List<int>();
        if (customerId.HasValue && customerId.Value > 0)
        {
            customerPastProductIds = await _context.Orders
                .Where(o => o.CustomerId == customerId.Value)
                .SelectMany(o => o.Lines)
                .Select(ol => ol.ProductId)
                .Distinct()
                .ToListAsync();
        }

        var incompatibleRules = await _context.UpsellCrossSellRules
            .Where(r => r.IsActive && r.RuleType == "Incompatible" &&
                  (cartProductIdsList.Contains(r.TriggerProductId) || cartProductIdsList.Contains(r.SuggestedProductId)))
            .ToListAsync();

        var incompatibleProductIds = incompatibleRules
            .Select(r => cartProductIdsList.Contains(r.TriggerProductId) ? r.SuggestedProductId : r.TriggerProductId)
            .ToHashSet();

        var context = new RecommendationContext
        {
            CustomerId = customerId,
            CartProductIds = cartProductIds,
            MinimumMarginThreshold = minMargin ?? 15.0m,
            HistoricalCoPurchases = coPurchases,
            CustomerHistoricalProductIds = customerPastProductIds.ToHashSet(),
            IncompatibleProductIds = incompatibleProductIds
        };

        var rules = await _context.UpsellCrossSellRules.Include(r => r.TriggerProduct).Include(r => r.SuggestedProduct).ToListAsync();
        var products = await _context.Products.Include(p => p.Category).ToListAsync();

        return _upsellEngine.GetRecommendations(context, rules, products);
    }

    public async Task<QuotationDetailResponse> AddRecommendationToQuoteAsync(int quotationId, int productId, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        var product = await _context.Products.FindAsync(productId);
        if (product == null) throw new KeyNotFoundException($"Product {productId} not found.");

        var existingLine = quotation.Lines.FirstOrDefault(l => l.ProductId == productId);
        if (existingLine != null)
        {
            existingLine.Quantity += 1;
            _marginEngine.CalculateLine(existingLine, product);
        }
        else
        {
            decimal currentTierDiscount = quotation.Customer?.Tier?.MaxDiscountPercent ?? 0m;
            var unitPrice = await ResolveProductPriceAsync(quotation.PriceListId, quotation.CustomerId, product, null);

            var newLine = new QuotationLine
            {
                QuotationId = quotation.Id,
                ProductId = product.Id,
                Quantity = 1,
                UnitPrice = unitPrice,
                DiscountPercent = currentTierDiscount,
                CreatedAtUtc = DateTime.UtcNow
            };
            _marginEngine.CalculateLine(newLine, product);
            quotation.Lines.Add(newLine);
            _context.QuotationLines.Add(newLine);
        }

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotation.Id,
            UserId = userId,
            Action = "RecommendationAdded",
            Reason = $"Added recommended product {product.Name} (SKU: {product.SKU}) to quote.",
            NewValueJson = productId.ToString(),
            CreatedAtUtc = DateTime.UtcNow
        });

        await RecalculateAndSaveQuotationAsync(quotation);
        return await GetQuotationByIdAsync(quotationId);
    }

    public async Task<bool> DismissRecommendationAsync(int quotationId, int productId, int userId)
    {
        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Quotation",
            EntityId = quotationId,
            UserId = userId,
            Action = "RecommendationDismissed",
            Reason = $"Dismissed recommended product ID {productId} for quotation.",
            NewValueJson = productId.ToString(),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }


    public async Task<string> GeneratePortalLinkAsync(int quotationId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        var token = _jwtService.GeneratePortalToken(quotation.Id, quotation.Customer.Email ?? "customer@dealflow360.io");
        return $"/portal/quote/{token}";
    }

    public async Task<OrderDetailResponse> ConvertToOrderAsync(int quotationId, int userId)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Lines).ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        if (quotation.ApprovalStatus != ApprovalStatus.Approved && quotation.Status != QuoteStatus.Approved && quotation.Status != QuoteStatus.Confirmed)
        {
            throw new InvalidOperationException($"Quotation {quotationId} must be fully approved or confirmed before converting to an order.");
        }

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

        quotation.Status = QuoteStatus.ConvertedToOrder;
        quotation.UpdatedAtUtc = DateTime.UtcNow;

        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        // Trigger Warehouse Fulfillment Allocation
        try
        {
            await _fulfillmentService.ExecuteAllocationAsync(order.Id);
        }
        catch (Exception)
        {
            // Non-storable product or already allocated
        }

        // Trigger Hybrid Billing (Commercial Invoice + Recurring Subscriptions)
        try
        {
            await _billingService.GenerateBillingForOrderAsync(order.Id);
        }
        catch (Exception)
        {
            // Already generated
        }

        order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .FirstOrDefaultAsync(o => o.Id == order.Id) ?? order;

        return new OrderDetailResponse
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            QuotationId = order.QuotationId,
            QuotationNumber = quotation.QuotationNumber,
            CustomerId = order.CustomerId,
            CustomerName = quotation.Customer.Name,
            Status = order.Status.ToString(),
            Total = order.Total,
            CreatedAtUtc = order.CreatedAtUtc,
            Lines = order.Lines.Select(ol => new OrderLineResponse
            {
                Id = ol.Id,
                ProductId = ol.ProductId,
                ProductName = ol.Product?.Name ?? string.Empty,
                ProductSKU = ol.Product?.SKU ?? string.Empty,
                ProductType = ol.ProductType.ToString(),
                Quantity = ol.Quantity,
                UnitPrice = ol.UnitPrice,
                DiscountPercent = ol.DiscountPercent,
                NetAmount = ol.NetAmount,
                TaxAmount = ol.TaxAmount
            }).ToList()
        };
    }

    private async Task RecalculateAndSaveQuotationAsync(Quotation quotation)
    {
        var customer = await _context.Customers
            .Include(c => c.Tier)
            .FirstOrDefaultAsync(c => c.Id == quotation.CustomerId);

        if (customer != null)
        {
            quotation.Customer = customer;
        }

        _marginEngine.CalculateQuotationTotals(quotation);

        var discountRules = await _context.DiscountRules.Where(r => r.IsActive).ToListAsync();
        var evalResult = _governanceEngine.EvaluateDiscounts(quotation.Customer, quotation.Lines, discountRules);
        var riskResult = _riskEngine.CalculateRiskScore(evalResult.PeakLineViolation, evalResult.WeightedMarginLoss, quotation.MarginPercent);

        quotation.RiskScore = riskResult.RiskScore;
        quotation.UpdatedAtUtc = DateTime.UtcNow;

        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();
    }

    private async Task<decimal> ResolveProductPriceAsync(int? priceListId, int customerId, Product product, int? variantId = null)
    {
        decimal baseResolved = product.BasePrice;
        if (priceListId.HasValue)
        {
            var pli = await _context.PriceListItems.FirstOrDefaultAsync(p => p.PriceListId == priceListId.Value && p.ProductId == product.Id);
            if (pli != null && pli.UnitPrice > 0) baseResolved = pli.UnitPrice;
        }
        else
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer?.TierId != null)
            {
                var tierPriceList = await _context.PriceLists.FirstOrDefaultAsync(pl => pl.TierId == customer.TierId && pl.IsActive);
                if (tierPriceList != null)
                {
                    var pli = await _context.PriceListItems.FirstOrDefaultAsync(p => p.PriceListId == tierPriceList.Id && p.ProductId == product.Id);
                    if (pli != null && pli.UnitPrice > 0) baseResolved = pli.UnitPrice;
                }
            }
        }

        if (variantId.HasValue)
        {
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId.Value && v.ProductId == product.Id);
            if (variant != null && variant.IsActive)
            {
                baseResolved += variant.AdditionalPrice;
            }
        }

        return baseResolved;
    }

    private async Task EnsureManagerApprovalRequestAsync(Quotation quotation, decimal tierCeiling, string tierName, decimal? specificDiscount = null)
    {
        var existing = await _context.ApprovalRequests
            .FirstOrDefaultAsync(ar => ar.QuotationId == quotation.Id && ar.Status == ApprovalStatus.Pending);

        decimal disc = specificDiscount ?? (quotation.Lines.Any() ? quotation.Lines.Max(l => l.DiscountPercent) : 0);
        string reason = $"Discount of {disc:F2}% exceeds customer {tierName} Tier ceiling ({tierCeiling:F2}%). Automatically routed to Sales Manager for verification and approval.";

        if (existing != null)
        {
            existing.Reason = reason;
            existing.Level = ApprovalLevel.Manager;
            existing.RequestedAtUtc = DateTime.UtcNow;
            _context.ApprovalRequests.Update(existing);
        }
        else
        {
            var approvalRequest = new ApprovalRequest
            {
                QuotationId = quotation.Id,
                Level = ApprovalLevel.Manager,
                Status = ApprovalStatus.Pending,
                Sequence = 1,
                RequestedAtUtc = DateTime.UtcNow,
                Reason = reason
            };
            _context.ApprovalRequests.Add(approvalRequest);
        }
    }

    private static QuotationDetailResponse MapToDetailResponse(Quotation q, Order? order = null)
    {
        var changesList = q.Changes?
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new QuotationChangeResponse
            {
                Id = c.Id,
                QuotationId = c.QuotationId,
                ChangeType = c.ChangeType,
                Description = c.Description,
                RequestedByUserId = c.RequestedByUserId,
                RequestedByUserName = c.RequestedBy?.FullName ?? "Client User",
                OldValueJson = c.OldValueJson,
                NewValueJson = c.NewValueJson,
                CreatedAtUtc = c.CreatedAtUtc
            }).ToList() ?? new List<QuotationChangeResponse>();

        var latestCounter = q.Changes?
            .Where(c => c.ChangeType == "CounterDiscount" || c.ChangeType == "CustomerCounterOffer" || c.ChangeType == "RepCounterOffer")
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefault();

        decimal? counterDisc = null;
        string? counterReason = null;
        int? counterLineId = null;

        if (latestCounter != null)
        {
            try
            {
                if (!string.IsNullOrEmpty(latestCounter.NewValueJson))
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(latestCounter.NewValueJson);
                    if (doc.RootElement.TryGetProperty("DiscountPercent", out var dp))
                        counterDisc = dp.GetDecimal();
                    else if (doc.RootElement.TryGetProperty("discount", out var dp2))
                        counterDisc = dp2.GetDecimal();
                    else if (doc.RootElement.TryGetProperty("CounterDiscount", out var dp3))
                        counterDisc = dp3.GetDecimal();
                    else if (doc.RootElement.TryGetProperty("dealDiscount", out var dp4))
                        counterDisc = dp4.GetDecimal();

                    if (doc.RootElement.TryGetProperty("LineId", out var li))
                        counterLineId = li.GetInt32();
                    else if (doc.RootElement.TryGetProperty("lineId", out var li2))
                        counterLineId = li2.GetInt32();

                    if (doc.RootElement.TryGetProperty("Reason", out var r))
                        counterReason = r.GetString();
                    else if (doc.RootElement.TryGetProperty("reason", out var r2))
                        counterReason = r2.GetString();
                }
            }
            catch { }

            if (string.IsNullOrEmpty(counterReason) && !string.IsNullOrEmpty(latestCounter.Description))
            {
                counterReason = latestCounter.Description;
            }
        }

        bool wasNegotiatedAccepted = q.Changes != null && q.Changes.Any(c => c.ChangeType == "RepAcceptedCounterOffer");
        bool isDiscountLocked = wasNegotiatedAccepted || (q.Status == QuoteStatus.Approved && q.ApprovalStatus == ApprovalStatus.Approved);
        bool hasPendingCounter = (q.Status == QuoteStatus.UnderNegotiation || q.Status == QuoteStatus.Sent) && latestCounter != null && !wasNegotiatedAccepted;

        return new QuotationDetailResponse
        {
            Id = q.Id,
            QuotationNumber = q.QuotationNumber,
            Version = q.Version,
            CustomerId = q.CustomerId,
            CustomerName = q.Customer?.Name ?? string.Empty,
            CustomerTierName = q.Customer?.Tier?.Name ?? "Silver",
            CustomerTierMaxDiscount = q.Customer?.Tier?.MaxDiscountPercent ?? 5.0m,
            SalesRepId = q.SalesRepId,
            SalesRepName = q.SalesRep?.FullName ?? string.Empty,
            PriceListId = q.PriceListId,
            Status = q.Status.ToString(),
            ApprovalStatus = q.ApprovalStatus.ToString(),
            SubTotal = q.SubTotal,
            DiscountTotal = q.DiscountTotal,
            TaxTotal = q.TaxTotal,
            GrandTotal = q.GrandTotal,
            CostTotal = q.CostTotal,
            MarginAmount = q.MarginAmount,
            MarginPercent = q.MarginPercent,
            RiskScore = q.RiskScore,
            ExpectedCloseDate = q.ExpectedCloseDate,
            Notes = q.Notes,
            CurrencyCode = q.CurrencyCode,
            CreatedAtUtc = q.CreatedAtUtc,
            UpdatedAtUtc = q.UpdatedAtUtc,
            OrderId = order?.Id,
            OrderNumber = order?.OrderNumber,
            OrderStatus = order?.Status.ToString(),
            ChangeRequests = changesList,
            HasPendingCounterOffer = hasPendingCounter,
            LatestCounterDiscount = counterDisc,
            LatestCounterReason = counterReason,
            LatestCounterLineId = counterLineId,
            IsDiscountLocked = isDiscountLocked,
            IsAutoApproved = (q.Status == QuoteStatus.Approved && q.ApprovalStatus == ApprovalStatus.Approved),
            Lines = q.Lines.Select(l => new QuotationLineResponse
            {
                Id = l.Id,
                ProductId = l.ProductId,
                ProductName = l.Product?.Name ?? string.Empty,
                SKU = l.Product?.SKU ?? string.Empty,
                ProductSKU = l.Product?.SKU ?? string.Empty,
                ProductType = l.Product?.ProductType.ToString() ?? string.Empty,
                VariantId = l.VariantId,
                VariantName = l.Variant?.Name,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountPercent = l.DiscountPercent,
                NetAmount = l.NetAmount,
                TaxAmount = l.TaxAmount,
                MarginAmount = l.MarginAmount,
                CostPrice = l.CostPrice,
                SubscriptionPlanId = l.SubscriptionPlanId,
                IsNegotiatedLocked = isDiscountLocked,
                CounterDiscountPercent = (counterLineId == l.Id) ? counterDisc : null,
                CounterReason = (counterLineId == l.Id) ? counterReason : null,
                Comments = l.Comments?.OrderBy(c => c.CreatedAtUtc).Select(c => new LineCommentResponse
                {
                    Id = c.Id,
                    QuotationLineId = c.QuotationLineId,
                    UserId = c.UserId,
                    AuthorName = c.User != null ? c.User.FullName : "Customer Representative",
                    AuthorRole = c.User != null ? c.User.Role.ToString() : "Customer",
                    Comment = c.Comment,
                    CreatedAtUtc = c.CreatedAtUtc
                }).ToList() ?? new List<LineCommentResponse>()
            }).ToList(),
            ApprovalSteps = q.ApprovalRequests?.OrderBy(a => a.Sequence).Select(a => new ApprovalStepResponse
            {
                Id = a.Id,
                Level = a.Level.ToString(),
                Status = a.Status.ToString(),
                Sequence = a.Sequence,
                RequestedAtUtc = a.RequestedAtUtc,
                ActedAtUtc = a.ActedAtUtc,
                ActedByName = a.ActedBy?.FullName,
                Reason = a.Actions?.OrderByDescending(x => x.CreatedAtUtc).Select(x => x.Reason).FirstOrDefault(r => !string.IsNullOrEmpty(r)) ?? a.Reason
            }).ToList() ?? new List<ApprovalStepResponse>()
        };
    }
}
