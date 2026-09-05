using DealFlow360.API.DTOs.Invoices;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "FinanceOperations,Admin,SalesManager")]
public class InvoicesController : ControllerBase
{
    private readonly IBillingService _billingService;

    public InvoicesController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoices()
    {
        var result = await _billingService.GetInvoicesAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInvoiceById(int id)
    {
        var result = await _billingService.GetInvoiceByIdAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/pay")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] RecordPaymentRequest request)
    {
        var result = await _billingService.RecordPaymentAsync(id, request);
        return Ok(result);
    }

    [HttpPost("{id}/credit-note")]
    [Authorize(Roles = "FinanceOperations,Admin")]
    public async Task<IActionResult> CreateCreditNote(int id, [FromBody] CreateCreditNoteRequest request)
    {
        var result = await _billingService.CreateCreditNoteAsync(id, request);
        return Ok(result);
    }
}
