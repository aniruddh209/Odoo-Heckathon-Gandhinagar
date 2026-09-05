using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesManager,FinanceOperations,Admin")]
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
        var result = await _reportService.GetDashboardMetricsAsync(salesRepId);
        return Ok(result);
    }

    [HttpGet("pipeline")]
    public async Task<IActionResult> GetPipelineOverview()
    {
        var result = await _reportService.GetPipelineOverviewAsync();
        return Ok(result);
    }
}
