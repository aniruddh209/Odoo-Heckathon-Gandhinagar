using DealFlow360.API.DTOs.Billing;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "FinanceOperations,Admin,SalesManager,SalesRep")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpPost("generate-order-billing/{orderId}")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> GenerateOrderBilling(int orderId)
    {
        var result = await _billingService.GenerateBillingForOrderAsync(orderId);
        return Ok(result);
    }

    [HttpGet("schedules")]
    public async Task<IActionResult> GetBillingSchedules()
    {
        var result = await _billingService.GetBillingSchedulesAsync();
        return Ok(result);
    }

    [HttpPost("schedules/{scheduleId}/generate-invoice")]
    public async Task<IActionResult> GenerateNextRecurringInvoice(int scheduleId)
    {
        var result = await _billingService.GenerateNextRecurringInvoiceAsync(scheduleId);
        return Ok(result);
    }

    [HttpPost("schedules/{scheduleId}/cancel")]
    public async Task<IActionResult> CancelSubscriptionSchedule(int scheduleId, [FromBody] CancelSubscriptionRequest? request)
    {
        var result = await _billingService.CancelSubscriptionScheduleAsync(scheduleId, request?.Reason ?? "Cancelled by finance operations");
        return Ok(result);
    }

    [HttpPost("subscriptions/{scheduleId}/seat-change")]
    public async Task<IActionResult> ApplySeatChange(int scheduleId, [FromBody] SubscriptionChangeRequest request)
    {
        var result = await _billingService.ApplySubscriptionSeatChangeAsync(scheduleId, request);
        return Ok(result);
    }

    [HttpGet("finance-dashboard")]
    public async Task<IActionResult> GetFinanceDashboardSummary()
    {
        var result = await _billingService.GetFinanceDashboardSummaryAsync();
        return Ok(result);
    }
}
