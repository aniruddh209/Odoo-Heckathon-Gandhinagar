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
            var lastActivity = quote.UpdatedAtUtc ?? quote.CreatedAtUtc;
            var daysInactive = (now - lastActivity).TotalDays;

            // Stalled deal check: Sent or UnderNegotiation > 5 days inactive
            if ((quote.Status == QuoteStatus.Sent || quote.Status == QuoteStatus.UnderNegotiation) && daysInactive > 5)
            {
                response.StalledDealsCount++;
                response.Alerts.Add(new DealHealthAlertResponse
                {
                    QuotationId = quote.Id,
                    QuotationNumber = quote.QuotationNumber,
                    AlertType = "StalledDeal",
                    Severity = daysInactive > 10 ? "High" : "Medium",
                    Message = $"Quotation '{quote.QuotationNumber}' has been inactive for {daysInactive:F0} days.",
                    CreatedAtUtc = now
                });
            }

            // Discount anomaly check: > 25% average discount on high value quote
            if (quote.DiscountTotal > (quote.SubTotal * 0.25m) && quote.SubTotal > 5000m)
            {
                response.DiscountAnomaliesCount++;
                response.Alerts.Add(new DealHealthAlertResponse
                {
                    QuotationId = quote.Id,
                    QuotationNumber = quote.QuotationNumber,
                    AlertType = "DiscountAnomaly",
                    Severity = "High",
                    Message = $"Quotation '{quote.QuotationNumber}' has an unusually high discount total of {quote.DiscountTotal:C2} ({quote.DiscountTotal / quote.SubTotal * 100:F1}% of subtotal).",
                    CreatedAtUtc = now
                });
            }

            // High risk score check
            if (quote.RiskScore >= 70m)
            {
                response.HighRiskDealsCount++;
            }
        }

        response.HealthScore = response.TotalActiveDeals > 0
            ? Math.Max(0m, 100m - (response.StalledDealsCount * 10m) - (response.DiscountAnomaliesCount * 15m))
            : 100m;

        return response;
    }
}
