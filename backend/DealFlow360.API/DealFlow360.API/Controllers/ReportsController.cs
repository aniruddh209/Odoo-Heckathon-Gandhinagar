using System.Security.Claims;
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

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardMetrics([FromQuery] int? salesRepId)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role == "SalesRep")
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var currentUserId))
            {
                salesRepId = currentUserId;
            }
        }

        var result = await _reportService.GetDashboardMetricsAsync(salesRepId);
        return Ok(result);
    }

    [HttpGet("pipeline")]
    public async Task<IActionResult> GetPipelineOverview()
    {
        var result = await _reportService.GetPipelineOverviewAsync();
        return Ok(result);
    }

    [HttpGet("export/xls")]
    [Authorize(Roles = "SalesManager,FinanceOperations,Admin")]
    public async Task<IActionResult> ExportXls()
    {
        var bytes = await _reportService.GenerateSalesReportXlsAsync();
        return File(bytes, "application/vnd.ms-excel", $"DealFlow360_SalesReport_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("export/pdf")]
    [Authorize(Roles = "SalesManager,FinanceOperations,Admin")]
    public async Task<IActionResult> ExportPdf()
    {
        var bytes = await _reportService.GenerateSalesReportPdfAsync();
        return File(bytes, "application/pdf", $"DealFlow360_SalesReport_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }
}
