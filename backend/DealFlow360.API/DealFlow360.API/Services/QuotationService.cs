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
    Task<string> GeneratePortalLinkAsync(int quotationId);
    Task<OrderDetailResponse> ConvertToOrderAsync(int quotationId, int userId);
    Task<QuotationDetailResponse> AddLineCommentAsync(int quotationId, int lineId, string comment, int userId);
}

public class QuotationService : IQuotationService
{
    private readonly AppDbContext _context;
    private readonly IMarginCalculationEngine _marginEngine;
    private readonly IDiscountGovernanceEngine _governanceEngine;
    private readonly IBlendedDiscountRiskEngine _riskEngine;
    private readonly IUpsellCrossSellEngine _upsellEngine;
    private readonly IJwtService _jwtService;

    public QuotationService(
        AppDbContext context,
        IMarginCalculationEngine marginEngine,
        IDiscountGovernanceEngine governanceEngine,
        IBlendedDiscountRiskEngine riskEngine,
        IUpsellCrossSellEngine upsellEngine,
        IJwtService jwtService)
    {
        _context = context;
        _marginEngine = marginEngine;
        _governanceEngine = governanceEngine;
        _riskEngine = riskEngine;
        _upsellEngine = upsellEngine;
        _jwtService = jwtService;
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

        // Invalidate previous approval on line changes
        if (quotation.Status == QuoteStatus.Approved || quotation.ApprovalStatus == ApprovalStatus.Approved)
        {
            quotation.Status = QuoteStatus.Draft;
            quotation.ApprovalStatus = ApprovalStatus.None;
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

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) throw new KeyNotFoundException($"Line item {lineId} not found.");

        var product = await _context.Products.FindAsync(line.ProductId);
        if (product == null) throw new KeyNotFoundException($"Product {line.ProductId} not found.");

        line.Quantity = request.Quantity;
        line.DiscountPercent = request.DiscountPercent;
        if (request.UnitPrice.HasValue) line.UnitPrice = request.UnitPrice.Value;

        _marginEngine.CalculateLine(line, product);

        // Invalidate previous approval on line changes
        if (quotation.Status == QuoteStatus.Approved || quotation.ApprovalStatus == ApprovalStatus.Approved)
        {
            quotation.Status = QuoteStatus.Draft;
            quotation.ApprovalStatus = ApprovalStatus.None;
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

        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line != null)
        {
            _context.QuotationLines.Remove(line);
            quotation.Lines.Remove(line);

            // Invalidate previous approval on line removal
            if (quotation.Status == QuoteStatus.Approved || quotation.ApprovalStatus == ApprovalStatus.Approved)
            {
                quotation.Status = QuoteStatus.Draft;
                quotation.ApprovalStatus = ApprovalStatus.None;
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

        await RecalculateAndSaveQuotationAsync(quotation);

        var discountRules = await _context.DiscountRules.Where(r => r.IsActive).ToListAsync();
        var approvalRules = await _context.ApprovalRules.Where(r => r.IsActive).OrderBy(r => r.Sequence).ToListAsync();
        var evalResult = _governanceEngine.EvaluateDiscounts(quotation.Customer, quotation.Lines, discountRules);
        var riskResult = _riskEngine.CalculateRiskScore(evalResult.PeakLineViolation, evalResult.WeightedMarginLoss, quotation.MarginPercent, approvalRules);

        if (riskResult.IsAutoApproved)
        {
            quotation.Status = QuoteStatus.Approved;
            quotation.ApprovalStatus = ApprovalStatus.Approved;
        }
        else
        {
            quotation.Status = QuoteStatus.PendingApproval;
            quotation.ApprovalStatus = ApprovalStatus.Pending;

            var approvalRequest = new ApprovalRequest
            {
                QuotationId = quotation.Id,
                Level = ApprovalLevel.Manager,
                Status = ApprovalStatus.Pending,
                Sequence = 1,
                RequestedAtUtc = DateTime.UtcNow,
                Reason = $"Triggered by risk score of {riskResult.RiskScore:F2} (Target level: {riskResult.RequiredLevel})"
            };

            _context.ApprovalRequests.Add(approvalRequest);
        }

        quotation.UpdatedAtUtc = DateTime.UtcNow;
        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        return await GetQuotationByIdAsync(id);
    }

    public async Task<List<RecommendationResponse>> GetUpsellRecommendationsAsync(int id)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {id} not found.");

        var rules = await _context.UpsellCrossSellRules.ToListAsync();
        var products = await _context.Products.ToListAsync();

        return _upsellEngine.GetRecommendations(quotation, rules, products);
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

        if (quotation.ApprovalStatus != ApprovalStatus.Approved && quotation.Status != QuoteStatus.Approved)
        {
            throw new InvalidOperationException($"Quotation {quotationId} must be fully approved before converting to an order.");
        }

        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var order = new Order
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

        quotation.Status = QuoteStatus.ConvertedToOrder;
        quotation.UpdatedAtUtc = DateTime.UtcNow;

        _context.Orders.Add(order);
        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

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

    private static QuotationDetailResponse MapToDetailResponse(Quotation q, Order? order = null)
    {
        return new QuotationDetailResponse
        {
            Id = q.Id,
            QuotationNumber = q.QuotationNumber,
            CustomerId = q.CustomerId,
            CustomerName = q.Customer?.Name ?? string.Empty,
            CustomerTierName = q.Customer?.Tier?.Name ?? string.Empty,
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
