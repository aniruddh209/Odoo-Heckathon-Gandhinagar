using DealFlow360.API.DTOs.Billing;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "FinanceOperations,Admin")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpPost("generate-order-billing/{orderId}")]
    public async Task<IActionResult> GenerateOrderBilling(int orderId)
    {
        var result = await _billingService.GenerateBillingForOrderAsync(orderId);
        return Ok(result);
    }

    [HttpPost("subscriptions/{scheduleId}/seat-change")]
    public async Task<IActionResult> ApplySeatChange(int scheduleId, [FromBody] SubscriptionChangeRequest request)
    {
        var result = await _billingService.ApplySubscriptionSeatChangeAsync(scheduleId, request);
        return Ok(result);
    }
}
