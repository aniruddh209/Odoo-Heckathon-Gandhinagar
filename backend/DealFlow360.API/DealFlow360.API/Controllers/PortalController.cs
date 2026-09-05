using DealFlow360.API.DTOs.Portal;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] // Customer magic-link HMAC token authorization enforced in service
public class PortalController : ControllerBase
{
    private readonly IPortalService _portalService;

    public PortalController(IPortalService portalService)
    {
        _portalService = portalService;
    }

    [HttpGet("quote/{token}")]
    public async Task<IActionResult> GetCustomerQuote(string token)
    {
        var result = await _portalService.GetCustomerQuoteAsync(token);
        return Ok(result);
    }

    [HttpPost("quote/{token}/lines/{lineId}/comment")]
    public async Task<IActionResult> SubmitLineComment(string token, int lineId, [FromBody] string comment)
    {
        await _portalService.SubmitLineCommentAsync(token, lineId, comment);
        return Ok(new { message = "Comment submitted successfully." });
    }

    [HttpPost("quote/{token}/counter-offer")]
    public async Task<IActionResult> SubmitCounterOffer(string token, [FromBody] CounterDiscountRequest request)
    {
        var result = await _portalService.SubmitCounterOfferAsync(token, request);
        return Ok(result);
    }

    [HttpPost("quote/{token}/confirm")]
    public async Task<IActionResult> ConfirmQuote(string token)
    {
        var result = await _portalService.ConfirmQuoteAsync(token);
        return Ok(result);
    }
}
