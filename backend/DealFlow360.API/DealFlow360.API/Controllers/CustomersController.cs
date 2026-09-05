using System.Security.Claims;
using DealFlow360.API.DTOs.Customers;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    private int? GetCurrentCustomerId()
    {
        var claim = User.FindFirstValue("CustomerId");
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    [Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
    public async Task<IActionResult> GetCustomers()
    {
        var result = await _customerService.GetCustomersAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
    public async Task<IActionResult> GetCustomerById(int id)
    {
        var result = await _customerService.GetCustomerByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        var result = await _customerService.CreateCustomerAsync(request);
        return CreatedAtAction(nameof(GetCustomerById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] UpdateCustomerRequest request)
    {
        var result = await _customerService.UpdateCustomerAsync(id, request);
        return Ok(result);
    }

    // ─── Customer User Portal Endpoints ─────────────────────

    [HttpGet("me/quotations")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetMyQuotations()
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.GetCustomerQuotationsAsync(customerId.Value);
        return Ok(result);
    }

    [HttpPost("me/quotations/{id}/confirm")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> ConfirmMyQuotation(int id)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.ConfirmCustomerQuotationAsync(customerId.Value, id);
        return Ok(result);
    }

    [HttpGet("me/orders")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetMyOrders()
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.GetCustomerOrdersAsync(customerId.Value);
        return Ok(result);
    }

    [HttpGet("me/invoices")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetMyInvoices()
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.GetCustomerInvoicesAsync(customerId.Value);
        return Ok(result);
    }
}
