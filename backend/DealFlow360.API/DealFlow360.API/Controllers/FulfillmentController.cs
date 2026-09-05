using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
public class FulfillmentController : ControllerBase
{
    private readonly IFulfillmentService _fulfillmentService;

    public FulfillmentController(IFulfillmentService fulfillmentService)
    {
        _fulfillmentService = fulfillmentService;
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders()
    {
        var result = await _fulfillmentService.GetOrdersForFulfillmentAsync();
        return Ok(result);
    }

    [HttpGet("preview/{orderId}")]
    public async Task<IActionResult> PreviewAllocation(int orderId)
    {
        var result = await _fulfillmentService.PreviewAllocationAsync(orderId);
        return Ok(result);
    }

    [HttpPost("allocate/{orderId}")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> ExecuteAllocation(int orderId)
    {
        var result = await _fulfillmentService.ExecuteAllocationAsync(orderId);
        return Ok(result);
    }

    [HttpGet("backorders")]
    public async Task<IActionResult> GetBackorders()
    {
        var result = await _fulfillmentService.GetBackordersAsync();
        return Ok(result);
    }

    [HttpPost("backorders/{id}/cancel")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> CancelBackorder(int id)
    {
        var result = await _fulfillmentService.CancelBackorderAsync(id);
        return Ok(result);
    }

    [HttpPost("replenish")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> ReplenishStock([FromQuery] int warehouseId, [FromQuery] int productId)
    {
        await _fulfillmentService.ConsolidateOnReplenishmentAsync(warehouseId, productId);
        return Ok(new { message = "Stock replenished and backorders consolidated successfully." });
    }
}
