using DealFlow360.API.DTOs.DealHealth;
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
    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    [HttpPost("alerts/{quotationId}/nudge")]
    [Authorize(Roles = "SalesManager,Admin")]
    public async Task<IActionResult> NudgeRep(int quotationId, [FromBody] NudgeRepRequest? request)
    {
        var result = await _dealHealthService.NudgeRepAsync(quotationId, request, GetCurrentUserId());
        return Ok(result);
    }

    [HttpPost("alerts/{quotationId}/escalate")]
    [Authorize(Roles = "SalesManager,Admin")]
    public async Task<IActionResult> EscalateDeal(int quotationId, [FromBody] EscalateDealRequest? request)
    {
        var result = await _dealHealthService.EscalateDealAsync(quotationId, request, GetCurrentUserId());
        return Ok(result);
    }
}
