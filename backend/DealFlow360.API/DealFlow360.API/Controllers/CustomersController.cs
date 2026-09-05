using System.Security.Claims;
using System.Text.Json;
using DealFlow360.API.DTOs.Customers;
using DealFlow360.API.DTOs.Portal;
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

    [HttpGet("{id}/360")]
    [Authorize(Roles = "SalesRep,SalesManager,FinanceOperations,Admin")]
    public async Task<IActionResult> GetCustomer360(int id)
    {
        var result = await _customerService.GetCustomer360Async(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        var result = await _customerService.CreateCustomerAsync(request);
        return CreatedAtAction(nameof(GetCustomerById), new { id = result.Customer.Id }, result);
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

    [HttpGet("me/quotations/{id}")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetMyQuotationById(int id)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.GetCustomerQuotationByIdAsync(customerId.Value, id);
        return Ok(result);
    }

    [HttpPost("me/quotations/{id}/lines/{lineId}/comment")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> SubmitMyLineComment(int id, int lineId, [FromBody] JsonElement body)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

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

        await _customerService.SubmitCustomerLineCommentAsync(customerId.Value, id, lineId, commentText);
        return Ok(new { message = "Comment submitted successfully." });
    }

    [HttpPost("me/quotations/{id}/counter-offer")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> SubmitMyCounterOffer(int id, [FromBody] CounterDiscountRequest request)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.SubmitCustomerCounterOfferAsync(customerId.Value, id, request);
        return Ok(result);
    }

    [HttpPost("me/quotations/{id}/change-request")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> SubmitMyChangeRequest(int id, [FromBody] SubmitChangeRequest request)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.SubmitCustomerChangeRequestAsync(customerId.Value, id, request);
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

    [HttpGet("me/orders/{id}")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetMyOrderById(int id)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.GetCustomerOrderByIdAsync(customerId.Value, id);
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

    [HttpGet("me/invoices/{id}")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetMyInvoiceById(int id)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.GetCustomerInvoiceByIdAsync(customerId.Value, id);
        return Ok(result);
    }

    [HttpGet("me/profile")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetMyProfile()
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            return BadRequest(new { message = "User is not linked to a customer account." });
        }

        var result = await _customerService.GetCustomerProfileAsync(customerId.Value);
        return Ok(result);
    }
}
