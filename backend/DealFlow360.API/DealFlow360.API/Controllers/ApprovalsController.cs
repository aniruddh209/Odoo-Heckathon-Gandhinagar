using System.Security.Claims;
using DealFlow360.API.DTOs.Approvals;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesManager,FinanceOperations,Admin")]
public class ApprovalsController : ControllerBase
{
    private readonly IApprovalService _approvalService;

    public ApprovalsController(IApprovalService approvalService)
    {
        _approvalService = approvalService;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : 1;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingApprovals([FromQuery] ApprovalLevel? level)
    {
        var result = await _approvalService.GetPendingApprovalsAsync(level);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetApprovalById(int id)
    {
        var result = await _approvalService.GetApprovalByIdAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/action")]
    public async Task<IActionResult> ActionApproval(int id, [FromBody] ApprovalActionRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _approvalService.ActionApprovalAsync(id, request, userId);
        return Ok(result);
    }

    [HttpPost("quotation/{quotationId}/action")]
    public async Task<IActionResult> ActionQuotationApproval(int quotationId, [FromBody] ApprovalActionRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _approvalService.ActionQuotationApprovalAsync(quotationId, request, userId);
        return Ok(result);
    }
}

