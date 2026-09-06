using DealFlow360.API.DTOs.Fulfillment;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
public class FulfillmentController : ControllerBase
{
    private readonly IFulfillmentService _fulfillmentService;

    public FulfillmentController(IFulfillmentService fulfillmentService)
    {
        _fulfillmentService = fulfillmentService;
    }

    [HttpGet("api/fulfillment/orders")]
    [HttpGet("api/orders/fulfillment")]
    public async Task<IActionResult> GetOrders()
    {
        var result = await _fulfillmentService.GetOrdersForFulfillmentAsync();
        return Ok(result);
    }

    [HttpGet("api/fulfillment/preview/{orderId}")]
    [HttpGet("api/orders/{orderId}/fulfillment/recommendation")]
    public async Task<IActionResult> PreviewAllocation(int orderId)
    {
        var result = await _fulfillmentService.PreviewAllocationAsync(orderId);
        return Ok(result);
    }

    [HttpPost("api/fulfillment/allocate/{orderId}")]
    [HttpPost("api/orders/{orderId}/fulfillment/accept")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> ExecuteAllocation(int orderId)
    {
        var result = await _fulfillmentService.ExecuteAllocationAsync(orderId);
        return Ok(result);
    }

    [HttpGet("api/fulfillment/backorders")]
    public async Task<IActionResult> GetBackorders()
    {
        var result = await _fulfillmentService.GetBackordersAsync();
        return Ok(result);
    }

    [HttpPost("api/fulfillment/backorders/{id}/cancel")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> CancelBackorder(int id)
    {
        var result = await _fulfillmentService.CancelBackorderAsync(id);
        return Ok(result);
    }

    [HttpPost("api/fulfillment/replenish")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> ReplenishStock([FromQuery] int warehouseId, [FromQuery] int productId)
    {
        await _fulfillmentService.ConsolidateOnReplenishmentAsync(warehouseId, productId);
        return Ok(new { message = "Stock replenished and backorders consolidated successfully." });
    }

    [HttpPut("api/fulfillment/override/{orderId}")]
    [HttpPost("api/fulfillment/override/{orderId}")]
    [HttpPost("api/orders/{orderId}/fulfillment/manual-override")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> OverrideAllocation(int orderId, [FromBody] FulfillmentOverrideRequest request)
    {
        var result = await _fulfillmentService.OverrideAllocationAsync(orderId, request);
        return Ok(result);
    }

    [HttpGet("api/fulfillment/orders/{orderId}/consolidation-options")]
    [HttpGet("api/fulfillment/consolidation-options/{orderId}")]
    [HttpGet("api/orders/{orderId}/fulfillment/consolidation-options")]
    public async Task<IActionResult> GetConsolidationOptions(int orderId)
    {
        var result = await _fulfillmentService.GetConsolidationOptionsAsync(orderId);
        return Ok(result);
    }

    [HttpPost("api/fulfillment/consolidate/{orderId}")]
    [HttpPost("api/fulfillment/orders/{orderId}/consolidate")]
    [HttpPost("api/orders/{orderId}/fulfillment/consolidate")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> ConsolidateOrderBackorders(int orderId)
    {
        var result = await _fulfillmentService.ConsolidateOrderBackordersAsync(orderId);
        return Ok(result);
    }
}

