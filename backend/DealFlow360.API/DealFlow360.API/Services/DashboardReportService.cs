using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Pipeline;
using DealFlow360.API.DTOs.Reports;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IDashboardReportService
{
    Task<DashboardResponse> GetDashboardMetricsAsync(int? salesRepId = null);
    Task<PipelineResponse> GetPipelineOverviewAsync();
}

public class DashboardReportService : IDashboardReportService
{
    private readonly AppDbContext _context;

    public DashboardReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardResponse> GetDashboardMetricsAsync(int? salesRepId = null)
    {
        var query = _context.Quotations.AsQueryable();
        if (salesRepId.HasValue)
        {
            query = query.Where(q => q.SalesRepId == salesRepId.Value);
        }

        var quotes = await query.ToListAsync();
        var orders = await _context.Orders.ToListAsync();
        var invoices = await _context.Invoices.ToListAsync();

        var totalQuotedRevenue = quotes.Sum(q => q.GrandTotal);
        var totalBookedRevenue = orders.Sum(o => o.Total);
        var totalInvoiced = invoices.Sum(i => i.Total);
        var totalPaid = invoices.Sum(i => i.PaidAmount);

        var avgMarginPercent = quotes.Any() ? quotes.Average(q => q.MarginPercent) : 0m;
        var avgRiskScore = quotes.Any() ? quotes.Average(q => q.RiskScore) : 0m;

        return new DashboardResponse
        {
            TotalQuotationsCount = quotes.Count,
            TotalQuotedRevenue = totalQuotedRevenue,
            TotalBookedRevenue = totalBookedRevenue,
            TotalInvoiced = totalInvoiced,
            TotalPaid = totalPaid,
            AverageMarginPercent = Math.Round(avgMarginPercent, 2),
            AverageRiskScore = Math.Round(avgRiskScore, 2),
            PendingApprovalsCount = quotes.Count(q => q.Status == QuoteStatus.PendingApproval),
            ActiveOrdersCount = orders.Count(o => o.Status != OrderStatus.Fulfilled && o.Status != OrderStatus.Cancelled)
        };
    }

    public async Task<PipelineResponse> GetPipelineOverviewAsync()
    {
        var quotes = await _context.Quotations.ToListAsync();

        var stages = quotes.GroupBy(q => q.Status.ToString())
            .Select(g => new PipelineStageDto
            {
                StageName = g.Key,
                Count = g.Count(),
                TotalValue = g.Sum(q => q.GrandTotal)
            }).ToList();

        return new PipelineResponse
        {
            TotalPipelineValue = quotes.Sum(q => q.GrandTotal),
            TotalDeals = quotes.Count,
            Stages = stages
        };
    }
}
