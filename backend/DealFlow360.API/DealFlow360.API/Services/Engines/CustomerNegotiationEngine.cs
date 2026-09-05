using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public class NegotiationEvaluationResult
{
    public bool RequiresReApproval { get; set; }
    public decimal NewRiskScore { get; set; }
    public ApprovalLevel NewApprovalLevel { get; set; }
    public QuoteStatus NewStatus { get; set; }
    public string SummaryMessage { get; set; } = string.Empty;
}

public interface ICustomerNegotiationEngine
{
    NegotiationEvaluationResult EvaluateCounterOffer(
        Quotation quotation,
        Customer customer,
        int lineId,
        decimal proposedDiscountPercent,
        IEnumerable<DiscountRule> discountRules,
        IDiscountGovernanceEngine governanceEngine,
        IBlendedDiscountRiskEngine riskEngine,
        IMarginCalculationEngine marginEngine);
}

public class CustomerNegotiationEngine : ICustomerNegotiationEngine
{
    public NegotiationEvaluationResult EvaluateCounterOffer(
        Quotation quotation,
        Customer customer,
        int lineId,
        decimal proposedDiscountPercent,
        IEnumerable<DiscountRule> discountRules,
        IDiscountGovernanceEngine governanceEngine,
        IBlendedDiscountRiskEngine riskEngine,
        IMarginCalculationEngine marginEngine)
    {
        var line = quotation.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null)
        {
            throw new KeyNotFoundException($"Quotation line {lineId} not found.");
        }

        // Apply proposed discount
        line.DiscountPercent = proposedDiscountPercent;
        if (line.Product != null)
        {
            marginEngine.CalculateLine(line, line.Product);
        }

        marginEngine.CalculateQuotationTotals(quotation);

        // Run governance and risk evaluation
        var evalResult = governanceEngine.EvaluateDiscounts(customer, quotation.Lines, discountRules);
        var riskResult = riskEngine.CalculateRiskScore(evalResult.PeakLineViolation, evalResult.WeightedMarginLoss, quotation.MarginPercent);

        quotation.RiskScore = riskResult.RiskScore;

        decimal tierCeiling = customer?.Tier?.MaxDiscountPercent ?? 5.00m;
        bool exceedsTier = proposedDiscountPercent > tierCeiling;
        bool requiresReApproval = exceedsTier || evalResult.RequiresApproval;

        QuoteStatus nextStatus = requiresReApproval ? QuoteStatus.PendingApproval : QuoteStatus.UnderNegotiation;
        ApprovalStatus nextApprovalStatus = requiresReApproval ? ApprovalStatus.Pending : ApprovalStatus.None;

        quotation.Status = nextStatus;
        quotation.ApprovalStatus = nextApprovalStatus;

        return new NegotiationEvaluationResult
        {
            RequiresReApproval = requiresReApproval,
            NewRiskScore = riskResult.RiskScore,
            NewApprovalLevel = ApprovalLevel.Manager,
            NewStatus = nextStatus,
            SummaryMessage = requiresReApproval
                ? $"Counter-offer of {proposedDiscountPercent:F2}% exceeds customer {customer?.Tier?.Name ?? "Bronze"} Tier limit ({tierCeiling:F2}%). Automatically routed to Sales Manager for verification."
                : $"Counter-offer of {proposedDiscountPercent:F2}% applied within {customer?.Tier?.Name ?? "Bronze"} Tier limit ({tierCeiling:F2}%)."
        };
    }
}
