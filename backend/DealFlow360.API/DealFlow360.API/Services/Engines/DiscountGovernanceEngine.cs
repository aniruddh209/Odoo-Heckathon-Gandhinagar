using DealFlow360.API.Models;

namespace DealFlow360.API.Services.Engines;

public class DiscountEvaluationResult
{
    public decimal PeakLineViolation { get; set; }
    public decimal WeightedMarginLoss { get; set; }
    public bool RequiresApproval { get; set; }
    public List<string> Violations { get; set; } = new();
}

public interface IDiscountGovernanceEngine
{
    DiscountEvaluationResult EvaluateDiscounts(Customer customer, IEnumerable<QuotationLine> lines, IEnumerable<DiscountRule> discountRules);
}

public class DiscountGovernanceEngine : IDiscountGovernanceEngine
{
    public DiscountEvaluationResult EvaluateDiscounts(Customer customer, IEnumerable<QuotationLine> lines, IEnumerable<DiscountRule> discountRules)
    {
        var result = new DiscountEvaluationResult();
        decimal totalGrossAmount = 0;
        decimal weightedViolationSum = 0;
        decimal peakViolation = 0;

        var tierMaxDiscount = customer?.Tier?.MaxDiscountPercent ?? 0m;
        var rulesList = discountRules.ToList();

        foreach (var line in lines)
        {
            var grossLineAmount = line.UnitPrice * line.Quantity;
            totalGrossAmount += grossLineAmount;

            var matchingRule = rulesList
                .Where(r => r.TierId == customer?.TierId && r.IsActive &&
                    (!r.CategoryId.HasValue || (line.Product != null && r.CategoryId == line.Product.CategoryId)))
                .OrderByDescending(r => r.CategoryId.HasValue)
                .FirstOrDefault();

            decimal maxAllowedDiscount = matchingRule != null ? Math.Min(tierMaxDiscount, matchingRule.MaxDiscountPercent) : tierMaxDiscount;

            var excessDiscount = Math.Max(0, line.DiscountPercent - maxAllowedDiscount);

            if (excessDiscount > 0)
            {
                var violationMsg = $"Line item for product '{line.Product?.Name ?? line.ProductId.ToString()}' requested discount {line.DiscountPercent:F2}% exceeds ceiling of {maxAllowedDiscount:F2}%.";
                result.Violations.Add(violationMsg);

                weightedViolationSum += excessDiscount * grossLineAmount;
                if (excessDiscount > peakViolation)
                {
                    peakViolation = excessDiscount;
                }
            }
        }

        result.PeakLineViolation = peakViolation;
        result.WeightedMarginLoss = totalGrossAmount > 0 ? Math.Round(weightedViolationSum / totalGrossAmount, 2) : 0m;
        result.RequiresApproval = result.Violations.Any();

        return result;
    }
}
