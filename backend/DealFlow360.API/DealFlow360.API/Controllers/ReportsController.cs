using System.Security.Claims;
using DealFlow360.API.DTOs.Reports;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
public class ReportsController : ControllerBase
{
    private readonly IDashboardReportService _reportService;

    public ReportsController(IDashboardReportService reportService)
    {
        _reportService = reportService;
    }

    private void EnforceRoleIsolation(ReportFilterRequest filter)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role == "SalesRep")
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var currentUserId))
            {
                filter.SalesRepId = currentUserId; // Reps can only query their own data
            }
        }
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardMetrics([FromQuery] ReportFilterRequest? filter)
    {
        filter ??= new ReportFilterRequest();
        EnforceRoleIsolation(filter);

        var result = await _reportService.GetDashboardMetricsAsync(filter);
        return Ok(result);
    }

    [HttpGet("pipeline")]
    public async Task<IActionResult> GetPipelineOverview([FromQuery] ReportFilterRequest? filter)
    {
        filter ??= new ReportFilterRequest();
        EnforceRoleIsolation(filter);

        var result = await _reportService.GetPipelineOverviewAsync(filter);
        return Ok(result);
    }

    [HttpGet("export/xls")]
    [Authorize(Roles = "SalesManager,FinanceOperations,Admin,SalesRep")]
    public async Task<IActionResult> ExportXls([FromQuery] ReportFilterRequest? filter)
    {
        filter ??= new ReportFilterRequest();
        EnforceRoleIsolation(filter);

        var bytes = await _reportService.GenerateSalesReportXlsAsync(filter);
        return File(bytes, "application/vnd.ms-excel", $"DealFlow360_SalesReport_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("export/pdf")]
    [Authorize(Roles = "SalesManager,FinanceOperations,Admin,SalesRep")]
    public async Task<IActionResult> ExportPdf([FromQuery] ReportFilterRequest? filter)
    {
        filter ??= new ReportFilterRequest();
        EnforceRoleIsolation(filter);

        var bytes = await _reportService.GenerateSalesReportPdfAsync(filter);
        return File(bytes, "application/pdf", $"DealFlow360_SalesReport_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }
}
