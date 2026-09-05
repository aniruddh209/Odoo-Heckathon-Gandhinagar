using System.Security.Claims;
using DealFlow360.API.DTOs.Quotations;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
public class QuotationsController : ControllerBase
{
    private readonly IQuotationService _quotationService;

    public QuotationsController(IQuotationService quotationService)
    {
        _quotationService = quotationService;
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
}
