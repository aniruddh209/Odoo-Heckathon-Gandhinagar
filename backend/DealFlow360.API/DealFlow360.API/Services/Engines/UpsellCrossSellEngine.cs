using DealFlow360.API.DTOs.Quotations;
using DealFlow360.API.Models;

namespace DealFlow360.API.Services.Engines;

public class RecommendationContext
{
    public int? QuotationId { get; set; }
    public int? CustomerId { get; set; }
    public HashSet<int> CartProductIds { get; set; } = new();
    public decimal CurrentRevenue { get; set; }
    public decimal CurrentCost { get; set; }
    public decimal MinimumMarginThreshold { get; set; } = 15.0m;
    public Dictionary<int, int> HistoricalCoPurchases { get; set; } = new();
    public HashSet<int> CustomerHistoricalProductIds { get; set; } = new();
    public HashSet<int> IncompatibleProductIds { get; set; } = new();
    public HashSet<int> DismissedProductIds { get; set; } = new();
}

public interface IUpsellCrossSellEngine
{
    List<RecommendationResponse> GetRecommendations(RecommendationContext context, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts);
    List<RecommendationResponse> GetRecommendations(Quotation quotation, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts);
    List<RecommendationResponse> GetRecommendationsForProductIds(IEnumerable<int> productIds, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts);
}

public class UpsellCrossSellEngine : IUpsellCrossSellEngine
{
    public List<RecommendationResponse> GetRecommendations(RecommendationContext context, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts)
    {
        if (context.CartProductIds == null || !context.CartProductIds.Any())
        {
            return new List<RecommendationResponse>();
        }

        var productsDict = allProducts.ToDictionary(p => p.Id);
        var activeRules = rules.Where(r => r.IsActive).ToList();

        // Index rules by Trigger -> Suggested
        var rulesByTrigger = activeRules
            .GroupBy(r => r.TriggerProductId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Index rules by Suggested -> Trigger
        var rulesBySuggested = activeRules
            .GroupBy(r => r.SuggestedProductId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Incompatibility check from rules
        var effectiveIncompatible = new HashSet<int>(context.IncompatibleProductIds);
        foreach (var triggerId in context.CartProductIds)
        {
            if (rulesByTrigger.TryGetValue(triggerId, out var trRules))
            {
                foreach (var r in trRules.Where(r => r.RuleType.Equals("Incompatible", StringComparison.OrdinalIgnoreCase)))
                {
                    effectiveIncompatible.Add(r.SuggestedProductId);
                }
            }
            if (rulesBySuggested.TryGetValue(triggerId, out var sugRules))
            {
                foreach (var r in sugRules.Where(r => r.RuleType.Equals("Incompatible", StringComparison.OrdinalIgnoreCase)))
                {
                    effectiveIncompatible.Add(r.TriggerProductId);
                }
            }
        }

        decimal currentRevenue = context.CurrentRevenue;
        decimal currentCost = context.CurrentCost;
        if (currentRevenue == 0 && currentCost == 0)
        {
            foreach (var pid in context.CartProductIds)
            {
                if (productsDict.TryGetValue(pid, out var p))
                {
                    currentRevenue += p.BasePrice;
                    currentCost += p.CostPrice;
                }
            }
        }
        decimal currentMarginAmount = currentRevenue - currentCost;
        decimal currentMarginPercent = currentRevenue > 0 ? (currentMarginAmount / currentRevenue) * 100m : 0m;

        var recommendations = new List<RecommendationResponse>();

        foreach (var product in allProducts)
        {
            // HARD FILTER 1: Skip if already in cart (Duplicate prevention - Test 4)
            if (context.CartProductIds.Contains(product.Id)) continue;

            // HARD FILTER 2: Skip if inactive
            if (!product.IsActive) continue;

            // HARD FILTER 3: Skip if dismissed in this quotation session
            if (context.DismissedProductIds.Contains(product.Id)) continue;

            // HARD FILTER 4: Skip if incompatible with ANY item in cart (Test 7)
            if (effectiveIncompatible.Contains(product.Id)) continue;

            // HARD FILTER 5: Minimum margin threshold filter (Test 3)
            decimal productMarginPercent = product.BasePrice > 0
                ? ((product.BasePrice - product.CostPrice) / product.BasePrice) * 100m
                : 0m;

            if (productMarginPercent < context.MinimumMarginThreshold)
            {
                continue; // Below acceptable margin threshold (e.g. 15%)
            }

            // SIGNAL 1: Explicit Admin Rules
            var matchedRules = new List<UpsellCrossSellRule>();
            foreach (var cartPid in context.CartProductIds)
            {
                if (rulesByTrigger.TryGetValue(cartPid, out var trRules))
                {
                    var match = trRules.FirstOrDefault(r => r.SuggestedProductId == product.Id && !r.RuleType.Equals("Incompatible", StringComparison.OrdinalIgnoreCase));
                    if (match != null) matchedRules.Add(match);
                }
            }

            decimal ruleScore = 0m;
            bool isPromoted = false;
            string primaryRuleType = "CrossSell";

            if (matchedRules.Any())
            {
                var bestRule = matchedRules.OrderByDescending(r => r.Score).First();
                ruleScore = bestRule.Score > 0 ? bestRule.Score : 40m;
                isPromoted = matchedRules.Any(r => r.IsPromoted);
                primaryRuleType = bestRule.RuleType;
            }

            // SIGNAL 2: Historical Co-Purchases (Test 5)
            int coPurchaseCount = context.HistoricalCoPurchases.GetValueOrDefault(product.Id, 0);
            decimal coPurchaseScore = 0m;
            if (coPurchaseCount > 0)
            {
                // Scaled co-purchase score (e.g. 500 co-purchases -> 60 pts; 3 co-purchases -> 6 pts)
                coPurchaseScore = Math.Min(70m, coPurchaseCount * 2m);
            }

            // SIGNAL 3: Customer History Context (Test 6)
            bool hasCustomerAffinity = context.CustomerHistoricalProductIds.Contains(product.Id);
            decimal customerAffinityScore = hasCustomerAffinity ? 30m : 0m;

            // SIGNAL 4: Category / Family Compatibility
            decimal categoryScore = 0m;
            var cartCategories = context.CartProductIds
                .Where(id => productsDict.ContainsKey(id))
                .Select(id => productsDict[id].CategoryId)
                .ToHashSet();

            if (cartCategories.Contains(product.CategoryId))
            {
                categoryScore = 15m;
            }

            // BASE RELEVANCE AGGREGATION
            decimal baseRelevance = ruleScore + coPurchaseScore + customerAffinityScore + categoryScore;

            // HARD FILTER 6: RELEVANCE GATE (Test 1, Test 2, Test 7)
            // If base relevance is 0, this product is completely UNRELATED to the quote!
            // Promotions MUST NEVER turn an unrelated product into a recommendation.
            if (baseRelevance <= 0)
            {
                continue; // Strictly reject unrelated items
            }

            // SIGNAL 5: Promotion Boost (Test 2)
            // Promoted products receive a boost, but ONLY IF already verified relevant!
            decimal promotionScore = isPromoted ? 15m : 0m;

            // Margin Delta Impact
            var addedRevenue = product.BasePrice;
            var addedCost = product.CostPrice;
            var addedMargin = addedRevenue - addedCost;

            var newTotalRevenue = currentRevenue + addedRevenue;
            var newTotalMarginAmount = currentMarginAmount + addedMargin;
            var newMarginPercent = newTotalRevenue > 0 ? (newTotalMarginAmount / newTotalRevenue) * 100m : 0m;
            var marginDelta = newMarginPercent - currentMarginPercent;

            // SIGNAL 6: Margin Quality Score
            decimal marginQualityScore = Math.Max(0m, (productMarginPercent - context.MinimumMarginThreshold) * 0.5m)
                                       + Math.Max(0m, marginDelta * 2m);

            // TOTAL RANKING SCORE: Relevance > Relationship > Customer Context > Business Value > Promotion
            decimal finalScore = baseRelevance + promotionScore + marginQualityScore;

            // HUMAN-READABLE REASONS (Section A14)
            string reason;
            if (coPurchaseCount >= 2)
            {
                reason = $"Frequently purchased with your selected configuration ({coPurchaseCount} verified orders).";
            }
            else if (coPurchaseCount == 1)
            {
                reason = $"Co-purchased with your selected configuration (1 verified order).";
            }
            else if (hasCustomerAffinity)
            {
                reason = $"Recommended based on your organization's prior purchase history.";
            }
            else if (primaryRuleType.Equals("Upsell", StringComparison.OrdinalIgnoreCase))
            {
                reason = $"Recommended performance upgrade with high margin profile.";
            }
            else if (primaryRuleType.Equals("Compatible", StringComparison.OrdinalIgnoreCase) || categoryScore > 0)
            {
                reason = $"Certified compatible accessory for your configuration.";
            }
            else
            {
                reason = $"Complementary addition that increases overall deal margin by {marginDelta:F2}%.";
            }

            if (isPromoted)
            {
                reason += " [Promoted Offer]";
            }

            recommendations.Add(new RecommendationResponse
            {
                ProductId = product.Id,
                ProductName = product.Name,
                SKU = product.SKU,
                CategoryName = product.Category?.Name,
                UnitPrice = product.BasePrice,
                CostPrice = product.CostPrice,
                MarginPerUnit = addedMargin,
                ProductMarginPercent = Math.Round(productMarginPercent, 2),
                CurrentQuoteMargin = Math.Round(currentMarginPercent, 2),
                MarginAfterAddition = Math.Round(newMarginPercent, 2),
                MarginDeltaPercent = Math.Round(marginDelta, 2),
                BaseRelevanceScore = Math.Round(baseRelevance, 2),
                PromotionScore = promotionScore,
                Score = Math.Round(finalScore, 2),
                IsPromoted = isPromoted,
                RuleType = primaryRuleType,
                Reason = reason,
                CoPurchaseCount = coPurchaseCount,
                HasCustomerAffinity = hasCustomerAffinity
            });
        }

        // Rank strictly: Score descending, BaseRelevance descending, Promotion descending
        return recommendations
            .OrderByDescending(r => r.Score)
            .ThenByDescending(r => r.BaseRelevanceScore)
            .ThenByDescending(r => r.IsPromoted)
            .Take(6)
            .ToList();
    }

    public List<RecommendationResponse> GetRecommendations(Quotation quotation, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts)
    {
        var cartProductIds = quotation.Lines.Select(l => l.ProductId).ToHashSet();
        var context = new RecommendationContext
        {
            QuotationId = quotation.Id,
            CustomerId = quotation.CustomerId,
            CartProductIds = cartProductIds,
            CurrentRevenue = quotation.SubTotal - quotation.DiscountTotal,
            CurrentCost = quotation.Lines.Sum(l => l.Product != null ? l.Product.CostPrice * l.Quantity : 0m),
            MinimumMarginThreshold = 15.0m
        };

        return GetRecommendations(context, rules, allProducts);
    }

    public List<RecommendationResponse> GetRecommendationsForProductIds(IEnumerable<int> productIds, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts)
    {
        var context = new RecommendationContext
        {
            CartProductIds = productIds?.ToHashSet() ?? new HashSet<int>(),
            MinimumMarginThreshold = 15.0m
        };

        return GetRecommendations(context, rules, allProducts);
    }
}

