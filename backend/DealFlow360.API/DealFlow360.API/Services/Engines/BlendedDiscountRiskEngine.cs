using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public class RiskEvaluationResult
{
    public decimal RiskScore { get; set; }
    public ApprovalLevel RequiredLevel { get; set; }
    public bool IsAutoApproved { get; set; }
}

public interface IBlendedDiscountRiskEngine
{
    RiskEvaluationResult CalculateRiskScore(decimal peakViolation, decimal weightedLoss, decimal orderGrossMarginPercent);
}

public class BlendedDiscountRiskEngine : IBlendedDiscountRiskEngine
{
    private const decimal TargetGrossMargin = 30.00m;

    public RiskEvaluationResult CalculateRiskScore(decimal peakViolation, decimal weightedLoss, decimal orderGrossMarginPercent)
    {
        var marginDeficit = Math.Max(0m, TargetGrossMargin - orderGrossMarginPercent);

        var rawScore = (0.40m * peakViolation) + (0.35m * weightedLoss) + (0.25m * marginDeficit);
        var boundedScore = Math.Min(100.00m, Math.Max(0.00m, rawScore));
        var roundedScore = Math.Round(boundedScore, 2);

        ApprovalLevel level;
        if (roundedScore < 30.00m)
        {
            level = ApprovalLevel.None; // Auto-approved
        }
        else if (roundedScore < 70.00m)
        {
            level = ApprovalLevel.Manager;
        }
        else
        {
            level = ApprovalLevel.Finance;
        }

        return new RiskEvaluationResult
        {
            RiskScore = roundedScore,
            RequiredLevel = level,
            IsAutoApproved = level == ApprovalLevel.None
        };
    }
}
