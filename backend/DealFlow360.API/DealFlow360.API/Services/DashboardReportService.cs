using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Pipeline;
using DealFlow360.API.DTOs.Reports;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IDashboardReportService
{
    Task<DashboardResponse> GetDashboardMetricsAsync(ReportFilterRequest? filter = null);
    Task<PipelineResponse> GetPipelineOverviewAsync(ReportFilterRequest? filter = null);
    Task<byte[]> GenerateSalesReportXlsAsync(ReportFilterRequest? filter = null);
    Task<byte[]> GenerateSalesReportPdfAsync(ReportFilterRequest? filter = null);
}

public class DashboardReportService : IDashboardReportService
{
    private readonly AppDbContext _context;

    public DashboardReportService(AppDbContext context)
    {
        _context = context;
    }

    private IQueryable<Quotation> ApplyFilters(IQueryable<Quotation> query, ReportFilterRequest? filter)
    {
        if (filter == null) return query;

        if (filter.StartDate.HasValue)
        {
            query = query.Where(q => q.CreatedAtUtc >= filter.StartDate.Value);
        }
        else if (!string.IsNullOrWhiteSpace(filter.Period))
        {
            var now = DateTime.UtcNow;
            if (filter.Period.Equals("today", StringComparison.OrdinalIgnoreCase))
                query = query.Where(q => q.CreatedAtUtc >= now.Date);
            else if (filter.Period.Equals("7d", StringComparison.OrdinalIgnoreCase) || filter.Period.Equals("week", StringComparison.OrdinalIgnoreCase))
                query = query.Where(q => q.CreatedAtUtc >= now.AddDays(-7));
            else if (filter.Period.Equals("30d", StringComparison.OrdinalIgnoreCase) || filter.Period.Equals("month", StringComparison.OrdinalIgnoreCase))
                query = query.Where(q => q.CreatedAtUtc >= now.AddDays(-30));
        }

        if (filter.EndDate.HasValue)
        {
            query = query.Where(q => q.CreatedAtUtc <= filter.EndDate.Value);
        }

        if (filter.SalesRepId.HasValue)
        {
            query = query.Where(q => q.SalesRepId == filter.SalesRepId.Value);
        }

        if (filter.SalesTeamId.HasValue)
        {
            query = query.Where(q => q.SalesRep != null && q.SalesRep.SalesTeamId == filter.SalesTeamId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (Enum.TryParse<QuoteStatus>(filter.Status, true, out var st))
            {
                query = query.Where(q => q.Status == st);
            }
        }

        if (!string.IsNullOrWhiteSpace(filter.ApprovalStatus))
        {
            if (Enum.TryParse<ApprovalStatus>(filter.ApprovalStatus, true, out var appSt))
            {
                query = query.Where(q => q.ApprovalStatus == appSt);
            }
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(q => q.Lines.Any(l => l.Product != null && l.Product.CategoryId == filter.CategoryId.Value));
        }

        return query;
    }

    public async Task<DashboardResponse> GetDashboardMetricsAsync(ReportFilterRequest? filter = null)
    {
        var query = _context.Quotations.AsQueryable();
        query = ApplyFilters(query, filter);

        var quotes = await query.ToListAsync();
        var quoteIds = quotes.Select(q => q.Id).ToHashSet();
        var orders = await _context.Orders.Where(o => quoteIds.Contains(o.QuotationId)).ToListAsync();
        var orderIds = orders.Select(o => o.Id).ToHashSet();
        var invoices = await _context.Invoices.Where(i => orderIds.Contains(i.OrderId)).ToListAsync();

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

    public async Task<PipelineResponse> GetPipelineOverviewAsync(ReportFilterRequest? filter = null)
    {
        var query = _context.Quotations.AsQueryable();
        query = ApplyFilters(query, filter);

        var quotes = await query.ToListAsync();

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

    public async Task<byte[]> GenerateSalesReportXlsAsync(ReportFilterRequest? filter = null)
    {
        var query = _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.SalesRep)
            .AsQueryable();

        query = ApplyFilters(query, filter);

        var quotes = await query
            .OrderByDescending(q => q.CreatedAtUtc)
            .ToListAsync();

        var quoteIds = quotes.Select(q => q.Id).ToHashSet();
        var orders = await _context.Orders.Where(o => quoteIds.Contains(o.QuotationId)).ToListAsync();
        var orderIds = orders.Select(o => o.Id).ToHashSet();
        var invoices = await _context.Invoices.Where(i => orderIds.Contains(i.OrderId)).ToListAsync();

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("DealFlow360 - Enterprise Sales & Executive Health Report");
        sb.AppendLine($"Generated on,{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        if (filter != null)
        {
            sb.AppendLine($"Filter Applied: Period={filter.Period ?? "All"}, Rep={filter.SalesRepId?.ToString() ?? "All"}, Status={filter.Status ?? "All"}");
        }
        sb.AppendLine();

        sb.AppendLine("--- SALES & FINANCIAL SUMMARY ---");
        sb.AppendLine($"Total Quotations,{quotes.Count}");
        sb.AppendLine($"Total Quoted Pipeline,${quotes.Sum(q => q.GrandTotal):F2}");
        sb.AppendLine($"Total Booked Orders,${orders.Sum(o => o.Total):F2}");
        sb.AppendLine($"Total Invoiced,${invoices.Sum(i => i.Total):F2}");
        sb.AppendLine($"Total Collected / Paid,${invoices.Sum(i => i.PaidAmount):F2}");
        sb.AppendLine($"Average Margin %,{(quotes.Any() ? quotes.Average(q => q.MarginPercent) : 0):F2}%");
        sb.AppendLine($"Average Risk Score,{(quotes.Any() ? quotes.Average(q => q.RiskScore) : 0):F2}");
        sb.AppendLine();

        sb.AppendLine("--- PIPELINE BY STAGE ---");
        sb.AppendLine("Stage,Count,Total Value ($)");
        var stages = quotes.GroupBy(q => q.Status.ToString()).OrderBy(g => g.Key);
        foreach (var stage in stages)
        {
            sb.AppendLine($"\"{stage.Key}\",{stage.Count()},${stage.Sum(q => q.GrandTotal):F2}");
        }
        sb.AppendLine();

        sb.AppendLine("--- QUOTATIONS DETAIL ---");
        sb.AppendLine("Quotation #,Customer,Sales Rep,Status,Approval Status,SubTotal,Discount,Tax,Grand Total,Margin %,Risk Score,Created Date");
        foreach (var q in quotes)
        {
            var custName = (q.Customer?.Name ?? "").Replace("\"", "\"\"");
            var repName = (q.SalesRep?.FullName ?? "").Replace("\"", "\"\"");
            sb.AppendLine($"\"{q.QuotationNumber}\",\"{custName}\",\"{repName}\",\"{q.Status}\",\"{q.ApprovalStatus}\",${q.SubTotal:F2},${q.DiscountTotal:F2},${q.TaxTotal:F2},${q.GrandTotal:F2},{q.MarginPercent:F2}%,{q.RiskScore:F2},{q.CreatedAtUtc:yyyy-MM-dd}");
        }

        var preamble = System.Text.Encoding.UTF8.GetPreamble();
        var bodyBytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + bodyBytes.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(bodyBytes, 0, result, preamble.Length, bodyBytes.Length);
        return result;
    }

    public async Task<byte[]> GenerateSalesReportPdfAsync(ReportFilterRequest? filter = null)
    {
        var query = _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.SalesRep)
            .AsQueryable();

        query = ApplyFilters(query, filter);

        var quotes = await query
            .OrderByDescending(q => q.CreatedAtUtc)
            .Take(25)
            .ToListAsync();

        var quoteIds = quotes.Select(q => q.Id).ToHashSet();
        var orders = await _context.Orders.Where(o => quoteIds.Contains(o.QuotationId)).ToListAsync();
        var orderIds = orders.Select(o => o.Id).ToHashSet();
        var invoices = await _context.Invoices.Where(i => orderIds.Contains(i.OrderId)).ToListAsync();

        var totalQuoted = quotes.Sum(q => q.GrandTotal);
        var totalBooked = orders.Sum(o => o.Total);
        var totalPaid = invoices.Sum(i => i.PaidAmount);
        var avgMargin = quotes.Any() ? quotes.Average(q => q.MarginPercent) : 0m;

        using var ms = new System.IO.MemoryStream();
        using var writer = new System.IO.StreamWriter(ms, System.Text.Encoding.ASCII);

        var objects = new List<long>();

        void WriteObj(string body)
        {
            writer.Flush();
            objects.Add(ms.Position);
            writer.Write($"{objects.Count} 0 obj\n{body}\nendobj\n");
            writer.Flush();
        }

        writer.Write("%PDF-1.4\n");
        writer.Flush();

        WriteObj("<< /Type /Catalog /Pages 2 0 R >>");
        WriteObj("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
        WriteObj("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");

        var sbStream = new System.Text.StringBuilder();
        sbStream.Append("BT\n");
        sbStream.Append("/F1 18 Tf\n");
        sbStream.Append("50 740 Td (DealFlow360 - Executive Sales Report) Tj\n");
        sbStream.Append("/F1 10 Tf\n");
        sbStream.Append($"0 -20 Td (Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC) Tj\n");

        sbStream.Append("/F1 12 Tf\n");
        sbStream.Append("0 -30 Td (KEY PERFORMANCE INDICATORS) Tj\n");
        sbStream.Append("/F1 10 Tf\n");
        sbStream.Append($"0 -18 Td (Total Quoted Pipeline: ${totalQuoted:N2}    Total Booked: ${totalBooked:N2}) Tj\n");
        sbStream.Append($"0 -16 Td (Total Paid Revenue: ${totalPaid:N2}       Average Margin: {avgMargin:F1}%) Tj\n");

        sbStream.Append("/F1 12 Tf\n");
        sbStream.Append("0 -30 Td (RECENT QUOTATIONS) Tj\n");
        sbStream.Append("/F1 9 Tf\n");
        sbStream.Append("0 -18 Td (Quote #        Customer                  Grand Total    Margin   Status) Tj\n");
        sbStream.Append("0 -12 Td (--------------------------------------------------------------------------------) Tj\n");

        foreach (var q in quotes)
        {
            var num = q.QuotationNumber.PadRight(15).Substring(0, 15);
            var cust = (q.Customer?.Name ?? "N/A").PadRight(24).Substring(0, 24);
            var tot = $"${q.GrandTotal:N2}".PadRight(14).Substring(0, 14);
            var mar = $"{q.MarginPercent:F1}%".PadRight(8).Substring(0, 8);
            var st = q.Status.ToString();
            var line = $"{num} {cust} {tot} {mar} {st}";
            line = line.Replace("(", "").Replace(")", "");
            sbStream.Append($"0 -14 Td ({line}) Tj\n");
        }

        sbStream.Append("ET\n");

        var streamBytes = System.Text.Encoding.ASCII.GetBytes(sbStream.ToString());
        WriteObj($"<< /Length {streamBytes.Length} >>\nstream\n{sbStream}\nendstream");
        WriteObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        writer.Flush();
        long startXref = ms.Position;
        writer.Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var pos in objects)
        {
            writer.Write($"{pos:D10} 00000 n \n");
        }
        writer.Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{startXref}\n%%EOF\n");
        writer.Flush();

        return ms.ToArray();
    }
}
