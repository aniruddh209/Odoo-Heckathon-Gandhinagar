using System.Security.Claims;
using DealFlow360.API.DTOs.SalesConnections;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/sales-connections")]
[Route("api/sales/inquiries")]
public class SalesConnectionsController : ControllerBase
{
    private readonly ISalesConnectionService _salesConnectionService;

    public SalesConnectionsController(ISalesConnectionService salesConnectionService)
    {
        _salesConnectionService = salesConnectionService;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private int? GetCurrentCustomerId()
    {
        var claim = User.FindFirst("CustomerId")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    private Role GetCurrentUserRole()
    {
        var claim = User.FindFirstValue(ClaimTypes.Role);
        return Enum.TryParse<Role>(claim, true, out var role) ? role : Role.Customer;
    }

    // ─── Customer / Public Catalog Endpoints ──────────────────

    [HttpGet("companies")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCompanies([FromQuery] int? productId)
    {
        var result = await _salesConnectionService.GetAvailableCompaniesAsync(productId);
        return Ok(result);
    }

    [HttpGet("products")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int? companyId,
        [FromQuery] int? categoryId,
        [FromQuery] string? search)
    {
        var result = await _salesConnectionService.GetAvailableProductsAsync(companyId, categoryId, search);
        return Ok(result);
    }

    [HttpPost("resolve")]
    [Authorize]
    public async Task<IActionResult> ResolveRepresentative([FromBody] ResolveRepRequest request)
    {
        var customerId = GetCurrentCustomerId();
        var result = await _salesConnectionService.ResolveRepresentativeAsync(customerId, request.CompanyId, request.ProductId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Admin,SalesManager,SalesRep")]
    public async Task<IActionResult> CreateConnectionRequest([FromBody] CreateSalesConnectionRequestDto request)
    {
        var customerId = GetCurrentCustomerId();
        if (!customerId.HasValue)
        {
            // For admin or sales rep testing on behalf of demo customer, default to customer 1 if none
            customerId = 1;
        }

        try
        {
            var result = await _salesConnectionService.CreateConnectionRequestAsync(customerId.Value, request);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("my")]
    [Authorize(Roles = "Customer,Admin,SalesManager,SalesRep")]
    public async Task<IActionResult> GetMyRequests()
    {
        var customerId = GetCurrentCustomerId() ?? 1;
        var result = await _salesConnectionService.GetCustomerRequestsAsync(customerId);
        return Ok(result);
    }

    // ─── Sales Rep & Workspace Endpoints ─────────────────────
    
    [HttpGet("summary")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> GetInquiriesSummary()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var summary = await _salesConnectionService.GetInquiriesSummaryAsync(userId, role);
        return Ok(summary);
    }

    [HttpGet("paged")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> GetWorkspaceInquiriesPaged(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int? companyId,
        [FromQuery] int? productId,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var result = await _salesConnectionService.GetWorkspaceInquiriesPagedAsync(
            userId, role, search, status, companyId, productId, sortBy, page, pageSize);
        return Ok(result);
    }

    [HttpGet("workspace")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> GetWorkspaceRequests(
        [FromQuery] string? status,
        [FromQuery] int? companyId)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var result = await _salesConnectionService.GetRepRequestsAsync(userId, role, status, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/accept")]
    [HttpPost("{id}/claim")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> AcceptInquiry(int id, [FromBody] AcceptInquiryRequest? request)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        request ??= new AcceptInquiryRequest();

        try
        {
            var result = await _salesConnectionService.AcceptInquiryAsync(id, request, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { message = ex.Message });
        }
    }

    [HttpPost("{id}/contact")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> ContactCustomer(int id, [FromBody] ContactCustomerRequest request)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _salesConnectionService.ContactCustomerAsync(id, request, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { message = ex.Message });
        }
    }

    [HttpPost("{id}/qualify")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> QualifyInquiry(int id, [FromBody] QualifyInquiryRequest request)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _salesConnectionService.QualifyInquiryAsync(id, request, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { message = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> RejectInquiry(int id, [FromBody] RejectInquiryRequest request)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _salesConnectionService.RejectInquiryAsync(id, request, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetRequestById(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var customerId = role == Role.Customer ? GetCurrentCustomerId() : null;

        try
        {
            var result = await _salesConnectionService.GetRequestByIdAsync(id, userId, role, customerId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateSalesConnectionStatusRequest request)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _salesConnectionService.UpdateStatusAsync(id, request, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id}/create-quote")]
    [Authorize(Roles = "SalesRep,SalesManager,Admin")]
    public async Task<IActionResult> CreateQuoteFromConnection(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _salesConnectionService.CreateQuoteFromConnectionAsync(id, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─── Admin Company Governance Endpoints ───────────────────

    [HttpGet("admin/companies")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetAllCompaniesAdmin()
    {
        var result = await _salesConnectionService.GetAllCompaniesAdminAsync();
        return Ok(result);
    }

    [HttpPost("admin/companies")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest request)
    {
        try
        {
            var result = await _salesConnectionService.CreateCompanyAsync(request);
            return CreatedAtAction(nameof(GetAllCompaniesAdmin), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("admin/companies/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCompany(int id, [FromBody] UpdateCompanyRequest request)
    {
        try
        {
            var result = await _salesConnectionService.UpdateCompanyAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("admin/companies/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCompany(int id)
    {
        var success = await _salesConnectionService.DeleteCompanyAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    // ─── Admin Sales Assignment Governance Endpoints ──────────

    [HttpGet("admin/assignments")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetSalesAssignments([FromQuery] int? companyId)
    {
        var result = await _salesConnectionService.GetSalesAssignmentsAsync(companyId);
        return Ok(result);
    }

    [HttpPost("admin/assignments")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateSalesAssignment([FromBody] CreateSalesAssignmentRequest request)
    {
        try
        {
            var result = await _salesConnectionService.CreateSalesAssignmentAsync(request);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("admin/assignments/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> UpdateSalesAssignment(int id, [FromBody] UpdateSalesAssignmentRequest request)
    {
        try
        {
            var result = await _salesConnectionService.UpdateSalesAssignmentAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("admin/assignments/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> DeleteSalesAssignment(int id)
    {
        var success = await _salesConnectionService.DeleteSalesAssignmentAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
