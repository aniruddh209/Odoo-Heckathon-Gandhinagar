using System.Text.Json;
using DealFlow360.API.DTOs.Portal;
using DealFlow360.API.Services;
using DealFlow360.API.Services.Pdf;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] // Customer magic-link HMAC token authorization enforced in service
public class PortalController : ControllerBase
{
    private readonly IPortalService _portalService;
    private readonly IQuotationPdfService _pdfService;

    public PortalController(IPortalService portalService, IQuotationPdfService pdfService)
    {
        _portalService = portalService;
        _pdfService = pdfService;
    }

    [HttpGet("quote/{token}")]
    public async Task<IActionResult> GetCustomerQuote(string token)
    {
        var result = await _portalService.GetCustomerQuoteAsync(token);
        return Ok(result);
    }

    [HttpPost("quote/{token}/lines/{lineId}/comment")]
    public async Task<IActionResult> SubmitLineComment(string token, int lineId, [FromBody] JsonElement body)
    {
        string commentText;
        if (body.ValueKind == JsonValueKind.String)
        {
            commentText = body.GetString() ?? string.Empty;
        }
        else if (body.ValueKind == JsonValueKind.Object && body.TryGetProperty("comment", out var commentProp))
        {
            commentText = commentProp.GetString() ?? string.Empty;
        }
        else
        {
            commentText = body.ToString();
        }

        await _portalService.SubmitLineCommentAsync(token, lineId, commentText);
        return Ok(new { message = "Comment submitted successfully." });
    }

    [HttpPost("quote/{token}/counter-offer")]
    public async Task<IActionResult> SubmitCounterOffer(string token, [FromBody] CounterDiscountRequest request)
    {
        var result = await _portalService.SubmitCounterOfferAsync(token, request);
        return Ok(result);
    }

    [HttpPost("quote/{token}/change-request")]
    public async Task<IActionResult> SubmitChangeRequest(string token, [FromBody] SubmitChangeRequest request)
    {
        var result = await _portalService.SubmitChangeRequestAsync(token, request);
        return Ok(result);
    }

    [HttpPost("quote/{token}/confirm")]
    public async Task<IActionResult> ConfirmQuote(string token)
    {
        var result = await _portalService.ConfirmQuoteAsync(token);
        return Ok(result);
    }

    [HttpPost("quote/{token}/counter-offer/accept")]
    public async Task<IActionResult> AcceptRepCounterOffer(string token, [FromBody] AcceptRepCounterRequest? request)
    {
        var result = await _portalService.AcceptRepCounterOfferAsync(token, request?.Remarks);
        return Ok(result);
    }

    [HttpPost("quote/{token}/counter-offer/reject")]
    public async Task<IActionResult> RejectRepCounterOffer(string token, [FromBody] RejectRepCounterRequest request)
    {
        var result = await _portalService.RejectRepCounterOfferAsync(token, request);
        return Ok(result);
    }

    [HttpGet("quote/{token}/pdf")]
    public async Task<IActionResult> DownloadPortalQuotePdf(string token)
    {
        var quote = await _portalService.GetCustomerQuoteAsync(token);
        var pdfBytes = await _pdfService.GeneratePortalQuotationPdfAsync(token);
        var filename = $"DealFlow360_Quotation_{quote.QuotationNumber}.pdf";
        return File(pdfBytes, "application/pdf", filename);
    }
}
