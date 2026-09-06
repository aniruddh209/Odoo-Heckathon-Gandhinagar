using DealFlow360.API.DTOs.DealHealth;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public interface IDealHealthEngine
{
    DealHealthSummaryResponse EvaluateHealth(IEnumerable<Quotation> activeQuotations);
}

public class DealHealthEngine : IDealHealthEngine
{
    public DealHealthSummaryResponse EvaluateHealth(IEnumerable<Quotation> activeQuotations)
    {
        var quotationsList = activeQuotations.ToList();
        var response = new DealHealthSummaryResponse
        {
            TotalActiveDeals = quotationsList.Count
        };

        var now = DateTime.UtcNow;

        foreach (var quote in quotationsList)
        {
            var customerName = quote.Customer?.Name ?? "Direct Deal";
            var lastActivity = quote.UpdatedAtUtc ?? quote.CreatedAtUtc;
            var daysInactive = (now - lastActivity).TotalDays;

            // 1. Stalled deal check: Sent or UnderNegotiation or Draft > 5 days inactive
            if ((quote.Status == QuoteStatus.Sent || quote.Status == QuoteStatus.UnderNegotiation || quote.Status == QuoteStatus.Draft) && daysInactive > 5)
            {
                response.StalledDealsCount++;
                response.Alerts.Add(new DealHealthAlertResponse
                {
                    QuotationId = quote.Id,
                    QuotationNumber = quote.QuotationNumber,
                    CustomerName = customerName,
                    AlertType = "StalledDeal",
                    SignalType = "StalledDeal",
                    Severity = daysInactive > 10 ? "Critical" : "High",
                    Message = $"Proposal '{quote.QuotationNumber}' has been inactive for {daysInactive:F0} days without touch.",
                    CreatedAtUtc = now
                });
            }

            // 2. Discount anomaly check: > 20% discount or exceeding tier ceiling
            var tierCeiling = quote.Customer?.Tier?.MaxDiscountPercent ?? 15.00m;
            var effectiveDiscount = quote.SubTotal > 0 ? (quote.DiscountTotal / quote.SubTotal) * 100m : 0m;
            
            // F-20: Statistical Anomaly
            var repQuotes = quotationsList.Where(q => q.SalesRepId == quote.SalesRepId).ToList();
            decimal anomalyThreshold = 20.00m; // Default fallback
            
            if (repQuotes.Count >= 2)
            {
                var discounts = repQuotes.Select(q => q.SubTotal > 0 ? (q.DiscountTotal / q.SubTotal) * 100m : 0m).ToList();
                var mean = discounts.Average();
                var sumOfSquares = discounts.Sum(d => (d - mean) * (d - mean));
                var stdDev = (decimal)Math.Sqrt((double)(sumOfSquares / (repQuotes.Count - 1)));
                anomalyThreshold = mean + (2 * stdDev);
            }
            else
            {
                anomalyThreshold = tierCeiling + 5.00m;
            }

            if (effectiveDiscount > anomalyThreshold)
            {
                response.DiscountAnomaliesCount++;
                response.Alerts.Add(new DealHealthAlertResponse
                {
                    QuotationId = quote.Id,
                    QuotationNumber = quote.QuotationNumber,
                    CustomerName = customerName,
                    AlertType = "DiscountAnomaly",
                    SignalType = "DiscountAnomaly",
                    Severity = effectiveDiscount > 30.00m ? "Critical" : "High",
                    Message = $"Quotation '{quote.QuotationNumber}' has an unusually deep discount of {effectiveDiscount:F1}% (Ceiling: {tierCeiling:F1}%).",
                    CreatedAtUtc = now
                });
            }

            // 3. Approval stuck check: PendingApproval for > 2 days
            if (quote.Status == QuoteStatus.PendingApproval || quote.ApprovalStatus == ApprovalStatus.Pending)
            {
                var pendingReq = quote.ApprovalRequests?.FirstOrDefault(r => r.Status == ApprovalStatus.Pending);
                var pendingDays = pendingReq != null ? (now - pendingReq.RequestedAtUtc).TotalDays : daysInactive;
                if (pendingDays >= 2.0)
                {
                    response.Alerts.Add(new DealHealthAlertResponse
                    {
                        QuotationId = quote.Id,
                        QuotationNumber = quote.QuotationNumber,
                        CustomerName = customerName,
                        AlertType = "ApprovalStuck",
                        SignalType = "ApprovalStuck",
                        Severity = pendingDays > 5.0 ? "Critical" : "High",
                        Message = $"Quotation '{quote.QuotationNumber}' awaiting governance signoff for {pendingDays:F0} days.",
                        CreatedAtUtc = now
                    });
                }
            }

            // 4. Delivery / Close Promise Slippage
            if (quote.ExpectedCloseDate.HasValue && quote.ExpectedCloseDate.Value < now &&
                quote.Status != QuoteStatus.ConvertedToOrder && quote.Status != QuoteStatus.Rejected)
            {
                var overdueDays = (now - quote.ExpectedCloseDate.Value).TotalDays;
                response.Alerts.Add(new DealHealthAlertResponse
                {
                    QuotationId = quote.Id,
                    QuotationNumber = quote.QuotationNumber,
                    CustomerName = customerName,
                    AlertType = "DeliverySlippage",
                    SignalType = "DeliverySlippage",
                    Severity = overdueDays > 7.0 ? "High" : "Medium",
                    Message = $"Expected close date {quote.ExpectedCloseDate.Value:yyyy-MM-dd} passed {overdueDays:F0} days ago without conversion.",
                    CreatedAtUtc = now
                });
            }

            // 5. Missing Next Action
            if ((quote.Status == QuoteStatus.Draft || quote.Status == QuoteStatus.Sent) && !quote.ExpectedCloseDate.HasValue && daysInactive > 3)
            {
                response.Alerts.Add(new DealHealthAlertResponse
                {
                    QuotationId = quote.Id,
                    QuotationNumber = quote.QuotationNumber,
                    CustomerName = customerName,
                    AlertType = "MissingNextAction",
                    SignalType = "MissingNextAction",
                    Severity = "Medium",
                    Message = $"Proposal '{quote.QuotationNumber}' is open without scheduled follow-up or estimated close date.",
                    CreatedAtUtc = now
                });
            }

            // High risk score count
            if (quote.RiskScore >= 50m)
            {
                response.HighRiskDealsCount++;
            }
        }

        response.CriticalCount = response.Alerts.Count(a => a.Severity == "Critical");
        var atRiskIds = response.Alerts.Select(a => a.QuotationId).Distinct().ToList();
        response.AtRiskCount = atRiskIds.Count;
        response.HealthyCount = Math.Max(0, response.TotalActiveDeals - response.AtRiskCount);

        var penalty = (response.StalledDealsCount * 8m) +
                      (response.DiscountAnomaliesCount * 12m) +
                      (response.Alerts.Count(a => a.SignalType == "ApprovalStuck") * 10m) +
                      (response.Alerts.Count(a => a.SignalType == "DeliverySlippage") * 6m) +
                      (response.Alerts.Count(a => a.SignalType == "MissingNextAction") * 4m);

        response.HealthScore = response.TotalActiveDeals > 0
            ? Math.Max(0m, Math.Round(100m - (penalty / Math.Max(1, response.TotalActiveDeals) * 2.5m), 1))
            : 100m;

        return response;
    }
}

