using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesManager,Admin")]
public class DealHealthController : ControllerBase
{
    private readonly IDealHealthService _dealHealthService;

    public DealHealthController(IDealHealthService dealHealthService)
    {
        _dealHealthService = dealHealthService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetDealHealthSummary()
    {
        var result = await _dealHealthService.GetDealHealthSummaryAsync();
        return Ok(result);
    }
}
