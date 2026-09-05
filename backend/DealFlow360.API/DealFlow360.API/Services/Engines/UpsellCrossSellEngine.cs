using DealFlow360.API.DTOs.Quotations;
using DealFlow360.API.Models;

namespace DealFlow360.API.Services.Engines;

public interface IUpsellCrossSellEngine
{
    List<RecommendationResponse> GetRecommendations(Quotation quotation, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts);
}

public class UpsellCrossSellEngine : IUpsellCrossSellEngine
{
    public List<RecommendationResponse> GetRecommendations(Quotation quotation, IEnumerable<UpsellCrossSellRule> rules, IEnumerable<Product> allProducts)
    {
        var cartProductIds = quotation.Lines.Select(l => l.ProductId).ToHashSet();
        var matchingRules = rules
            .Where(r => cartProductIds.Contains(r.TriggerProductId) && !cartProductIds.Contains(r.SuggestedProductId) && r.IsActive)
            .ToList();

        var productsDict = allProducts.ToDictionary(p => p.Id);
        var recommendations = new List<RecommendationResponse>();

        var currentRevenue = quotation.SubTotal - quotation.DiscountTotal;
        var currentMarginAmount = quotation.MarginAmount;
        var currentMarginPercent = currentRevenue > 0 ? (currentMarginAmount / currentRevenue) * 100m : 0m;

        foreach (var rule in matchingRules)
        {
            if (!productsDict.TryGetValue(rule.SuggestedProductId, out var suggestedProduct)) continue;

            var addedRevenue = suggestedProduct.BasePrice;
            var addedCost = suggestedProduct.CostPrice;
            var addedMargin = addedRevenue - addedCost;

            var newTotalRevenue = currentRevenue + addedRevenue;
            var newTotalMarginAmount = currentMarginAmount + addedMargin;
            var newMarginPercent = newTotalRevenue > 0 ? (newTotalMarginAmount / newTotalRevenue) * 100m : 0m;
            var marginDelta = newMarginPercent - currentMarginPercent;

            var rankScore = (rule.Score * 0.6m) + (marginDelta * 0.4m);

            recommendations.Add(new RecommendationResponse
            {
                ProductId = suggestedProduct.Id,
                ProductName = suggestedProduct.Name,
                SKU = suggestedProduct.SKU,
                UnitPrice = suggestedProduct.BasePrice,
                CostPrice = suggestedProduct.CostPrice,
                MarginPerUnit = addedMargin,
                CurrentQuoteMargin = Math.Round(currentMarginPercent, 2),
                MarginAfterAddition = Math.Round(newMarginPercent, 2),
                MarginDeltaPercent = Math.Round(marginDelta, 2),
                RuleType = rule.RuleType,
                Score = Math.Round(rankScore, 2),
                IsPromoted = rule.IsPromoted,
                Reason = $"Adding {suggestedProduct.Name} increases overall deal margin by {marginDelta:F2}%."
            });
        }

        return recommendations.OrderByDescending(r => r.Score).ThenByDescending(r => r.IsPromoted).ToList();
    }
}
