using System.Security.Claims;
using DealFlow360.API.DTOs.Quotations;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services;
using DealFlow360.API.Services.Pdf;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/quotes")]
[Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
public class QuotationsController : ControllerBase
{
    private readonly IQuotationService _quotationService;
    private readonly IQuotationPdfService _pdfService;

    public QuotationsController(IQuotationService quotationService, IQuotationPdfService pdfService)
    {
        _quotationService = quotationService;
        _pdfService = pdfService;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : 1;
    }

    [HttpGet]
    public async Task<IActionResult> GetQuotations([FromQuery] int? salesRepId, [FromQuery] QuoteStatus? status)
    {
        var result = await _quotationService.GetQuotationsAsync(salesRepId, status);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetQuotationById(int id)
    {
        var result = await _quotationService.GetQuotationByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateQuotation([FromBody] CreateQuotationRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.CreateQuotationAsync(request, userId);
        return CreatedAtAction(nameof(GetQuotationById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateQuotation(int id, [FromBody] UpdateQuotationRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.UpdateQuotationAsync(id, request, userId);
        return Ok(result);
    }

    [HttpPost("{id}/lines")]
    public async Task<IActionResult> AddLineItem(int id, [FromBody] AddLineRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.AddLineItemAsync(id, request, userId);
        return Ok(result);
    }

    [HttpPut("{id}/lines/{lineId}")]
    public async Task<IActionResult> UpdateLineItem(int id, int lineId, [FromBody] UpdateLineRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.UpdateLineItemAsync(id, lineId, request, userId);
        return Ok(result);
    }

    [HttpDelete("{id}/lines/{lineId}")]
    public async Task<IActionResult> RemoveLineItem(int id, int lineId)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.RemoveLineItemAsync(id, lineId, userId);
        return Ok(result);
    }

    [HttpPost("{id}/lines/{lineId}/comments")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> AddLineComment(int id, int lineId, [FromBody] AddCommentRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.AddLineCommentAsync(id, lineId, request.Comment, userId);
        return Ok(result);
    }

    [HttpPost("{id}/lines/{lineId}/negotiate")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> NegotiateLinePrice(int id, int lineId, [FromBody] NegotiatePriceRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.NegotiateLinePriceAsync(id, lineId, request, userId);
        return Ok(result);
    }

    [HttpPost("{id}/negotiate")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> NegotiateDeal(int id, [FromBody] NegotiateDealRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.NegotiateDealAsync(id, request, userId);
        return Ok(result);
    }

    [HttpPost("{id}/send")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> SendQuotation(int id, [FromBody] SendQuotationRequest? request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.SendQuotationAsync(id, request ?? new SendQuotationRequest(), userId);
        return Ok(result);
    }

    [HttpPost("{id}/negotiate/accept")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> AcceptCounterOffer(int id, [FromBody] AcceptCounterOfferRequest? request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.AcceptCounterOfferAsync(id, request ?? new AcceptCounterOfferRequest(), userId);
        return Ok(result);
    }

    [HttpPost("{id}/negotiate/reject")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> RejectCounterOffer(int id, [FromBody] RejectCounterOfferRequest? request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.RejectCounterOfferAsync(id, request ?? new RejectCounterOfferRequest(), userId);
        return Ok(result);
    }

    [HttpPost("{id}/disqualify")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> DisqualifyQuotation(int id, [FromBody] DisqualifyQuotationRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.DisqualifyQuotationAsync(id, request, userId);
        return Ok(result);
    }

    [HttpPost("{id}/recalculate")]
    public async Task<IActionResult> Recalculate(int id)
    {
        var result = await _quotationService.RecalculateQuotationAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/submit-approval")]
    public async Task<IActionResult> SubmitForApproval(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.SubmitForApprovalAsync(id, userId);
        return Ok(result);
    }

    [HttpGet("{id}/recommendations")]
    public async Task<IActionResult> GetRecommendations(int id)
    {
        var result = await _quotationService.GetUpsellRecommendationsAsync(id);
        return Ok(result);
    }

    [HttpPost("recommendations/preview")]
    public async Task<IActionResult> PreviewRecommendations([FromBody] System.Text.Json.JsonElement body)
    {
        List<int> productIds = new();
        int? customerId = null;
        decimal? minMargin = null;

        if (body.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var item in body.EnumerateArray())
            {
                if (item.TryGetInt32(out var pId)) productIds.Add(pId);
            }
        }
        else if (body.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            if (body.TryGetProperty("productIds", out var pArray) && pArray.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var item in pArray.EnumerateArray())
                {
                    if (item.TryGetInt32(out var pId)) productIds.Add(pId);
                }
            }
            if (body.TryGetProperty("customerId", out var cId) && cId.TryGetInt32(out var parsedCustId))
            {
                customerId = parsedCustId;
            }
            if (body.TryGetProperty("minimumMarginThreshold", out var mThresh) && mThresh.TryGetDecimal(out var parsedMinMargin))
            {
                minMargin = parsedMinMargin;
            }
        }

        var recommendations = await _quotationService.PreviewCartRecommendationsAsync(productIds, customerId, minMargin);
        return Ok(recommendations);
    }

    [HttpPost("{id}/recommendations/{productId}/add")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> AddRecommendation(int id, int productId)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.AddRecommendationToQuoteAsync(id, productId, userId);
        return Ok(result);
    }

    [HttpPost("{id}/recommendations/{productId}/dismiss")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> DismissRecommendation(int id, int productId)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.DismissRecommendationAsync(id, productId, userId);
        return Ok(new { success = result, message = "Recommendation dismissed." });
    }

    [HttpPost("{id}/generate-portal-link")]
    public async Task<IActionResult> GeneratePortalLink(int id)
    {
        var link = await _quotationService.GeneratePortalLinkAsync(id);
        return Ok(new { portalLink = link });
    }

    [HttpPost("{id}/convert-to-order")]
    public async Task<IActionResult> ConvertToOrder(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _quotationService.ConvertToOrderAsync(id, userId);
        return Ok(result);
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadQuotationPdf(int id)
    {
        var userId = GetCurrentUserId();
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "SalesRep";
        var pdfBytes = await _pdfService.GenerateQuotationPdfAsync(id, userId, userRole);
        var quote = await _quotationService.GetQuotationByIdAsync(id);
        var filename = $"DealFlow360_Quotation_{quote.QuotationNumber}.pdf";
        return File(pdfBytes, "application/pdf", filename);
    }
}
