using System.Security.Claims;
using DealFlow360.API.DTOs.ApprovalRules;
using DealFlow360.API.DTOs.Categories;
using DealFlow360.API.DTOs.CustomerTiers;
using DealFlow360.API.DTOs.DiscountRules;
using DealFlow360.API.DTOs.PriceLists;
using DealFlow360.API.DTOs.Products;
using DealFlow360.API.DTOs.Reports;
using DealFlow360.API.DTOs.SalesTeams;
using DealFlow360.API.DTOs.SubscriptionPlans;
using DealFlow360.API.DTOs.UpsellRules;
using DealFlow360.API.DTOs.Users;
using DealFlow360.API.DTOs.Warehouses;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    // ─── Analytics & Audit ──────────────────────────────────────
    [HttpGet("analytics/platform-overview")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPlatformOverview() => Ok(await _adminService.GetPlatformOverviewAsync());

    [HttpGet("audit-logs")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int take = 50) => Ok(await _adminService.GetAuditLogsAsync(take));

    // ─── Users ──────────────────────────────────────────────────
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers() => Ok(await _adminService.GetUsersAsync());

    [HttpPost("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        => Ok(await _adminService.CreateUserAsync(request, GetCurrentUserId()));

    [HttpPut("users/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        => Ok(await _adminService.UpdateUserAsync(id, request, GetCurrentUserId()));

    // ─── Customer Tiers ─────────────────────────────────────────
    [HttpGet("customer-tiers")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetCustomerTiers() => Ok(await _adminService.GetCustomerTiersAsync());

    [HttpPost("customer-tiers")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateCustomerTier([FromBody] CreateCustomerTierRequest request)
        => Ok(await _adminService.CreateCustomerTierAsync(request, GetCurrentUserId()));

    [HttpPut("customer-tiers/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> UpdateCustomerTier(int id, [FromBody] UpdateCustomerTierRequest request)
        => Ok(await _adminService.UpdateCustomerTierAsync(id, request, GetCurrentUserId()));

    // ─── Categories ─────────────────────────────────────────────
    [HttpGet("categories")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetCategories() => Ok(await _adminService.GetCategoriesAsync());

    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        => Ok(await _adminService.CreateCategoryAsync(request, GetCurrentUserId()));

    // ─── Products ───────────────────────────────────────────────
    [HttpGet("products")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetProducts([FromQuery] string? search, [FromQuery] int? categoryId, [FromQuery] bool? isActive)
        => Ok(await _adminService.GetProductsAsync(search, categoryId, isActive));

    [HttpGet("products/{id}")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetProductById(int id) => Ok(await _adminService.GetProductByIdAsync(id));

    [HttpPost("products")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        => Ok(await _adminService.CreateProductAsync(request, GetCurrentUserId()));

    [HttpPut("products/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        => Ok(await _adminService.UpdateProductAsync(id, request, GetCurrentUserId()));

    [HttpPost("products/{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleProductStatus(int id)
        => Ok(await _adminService.ToggleProductStatusAsync(id, GetCurrentUserId()));

    // ─── Price Lists ────────────────────────────────────────────
    [HttpGet("price-lists")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetPriceLists() => Ok(await _adminService.GetPriceListsAsync());

    [HttpGet("price-lists/{id}")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetPriceListById(int id) => Ok(await _adminService.GetPriceListByIdAsync(id));

    [HttpPost("price-lists")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreatePriceList([FromBody] CreatePriceListRequest request)
        => Ok(await _adminService.CreatePriceListAsync(request, GetCurrentUserId()));

    [HttpPut("price-lists/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePriceList(int id, [FromBody] UpdatePriceListRequest request)
        => Ok(await _adminService.UpdatePriceListAsync(id, request, GetCurrentUserId()));

    [HttpPost("price-lists/{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TogglePriceListStatus(int id)
        => Ok(await _adminService.TogglePriceListStatusAsync(id, GetCurrentUserId()));

    [HttpPost("price-lists/{id}/items")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpsertPriceListItem(int id, [FromBody] UpsertPriceListItemRequest request)
        => Ok(await _adminService.UpsertPriceListItemAsync(id, request, GetCurrentUserId()));

    [HttpDelete("price-lists/{id}/items/{productId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePriceListItem(int id, int productId)
        => Ok(await _adminService.DeletePriceListItemAsync(id, productId, GetCurrentUserId()));

    [HttpDelete("price-lists/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePriceList(int id)
        => Ok(await _adminService.DeletePriceListAsync(id, GetCurrentUserId()));

    // ─── Discount Rules ─────────────────────────────────────────
    [HttpGet("discount-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetDiscountRules() => Ok(await _adminService.GetDiscountRulesAsync());

    [HttpPost("discount-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateDiscountRule([FromBody] CreateDiscountRuleRequest request)
        => Ok(await _adminService.CreateDiscountRuleAsync(request, GetCurrentUserId()));

    [HttpPut("discount-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> UpdateDiscountRule(int id, [FromBody] UpdateDiscountRuleRequest request)
        => Ok(await _adminService.UpdateDiscountRuleAsync(id, request, GetCurrentUserId()));

    [HttpDelete("discount-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> DeleteDiscountRule(int id)
        => Ok(await _adminService.DeleteDiscountRuleAsync(id, GetCurrentUserId()));

    // ─── Approval Rules ─────────────────────────────────────────
    [HttpGet("approval-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetApprovalRules() => Ok(await _adminService.GetApprovalRulesAsync());

    [HttpPost("approval-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateApprovalRule([FromBody] CreateApprovalRuleRequest request)
        => Ok(await _adminService.CreateApprovalRuleAsync(request, GetCurrentUserId()));

    [HttpPut("approval-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> UpdateApprovalRule(int id, [FromBody] UpdateApprovalRuleRequest request)
        => Ok(await _adminService.UpdateApprovalRuleAsync(id, request, GetCurrentUserId()));

    [HttpDelete("approval-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> DeleteApprovalRule(int id)
        => Ok(await _adminService.DeleteApprovalRuleAsync(id, GetCurrentUserId()));

    // ─── Warehouses & Stock ─────────────────────────────────────
    [HttpGet("warehouses")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetWarehouses() => Ok(await _adminService.GetWarehousesAsync());

    [HttpGet("warehouses/{id}")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetWarehouseById(int id) => Ok(await _adminService.GetWarehouseByIdAsync(id));

    [HttpPost("warehouses")]
    [Authorize(Roles = "Admin,FinanceOperations")]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseRequest request)
        => Ok(await _adminService.CreateWarehouseAsync(request, GetCurrentUserId()));

    [HttpPut("warehouses/{id}")]
    [Authorize(Roles = "Admin,FinanceOperations")]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] UpdateWarehouseRequest request)
        => Ok(await _adminService.UpdateWarehouseAsync(id, request, GetCurrentUserId()));

    [HttpPost("warehouses/{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleWarehouseStatus(int id)
        => Ok(await _adminService.ToggleWarehouseStatusAsync(id, GetCurrentUserId()));

    [HttpGet("warehouses/{id}/stock")]
    [Authorize(Roles = "Admin,FinanceOperations")]
    public async Task<IActionResult> GetWarehouseStocks(int id) => Ok(await _adminService.GetWarehouseStocksAsync(id));

    [HttpGet("inventory")]
    [Authorize(Roles = "Admin,FinanceOperations")]
    public async Task<IActionResult> GetAllInventoryStocks() => Ok(await _adminService.GetAllInventoryStocksAsync());

    [HttpPost("warehouses/{id}/adjust-stock")]
    [Authorize(Roles = "Admin,FinanceOperations")]
    public async Task<IActionResult> AdjustStock(int id, [FromBody] AdjustStockRequest request)
        => Ok(await _adminService.AdjustStockAsync(id, request, GetCurrentUserId()));

    // ─── Sales Teams ────────────────────────────────────────────
    [HttpGet("sales-teams")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetSalesTeams() => Ok(await _adminService.GetSalesTeamsAsync());

    [HttpPost("sales-teams")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSalesTeam([FromBody] CreateSalesTeamRequest request)
        => Ok(await _adminService.CreateSalesTeamAsync(request, GetCurrentUserId()));

    // ─── Subscription Plans ─────────────────────────────────────
    [HttpGet("subscription-plans")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager,FinanceOperations")]
    public async Task<IActionResult> GetSubscriptionPlans() => Ok(await _adminService.GetSubscriptionPlansAsync());

    [HttpPost("subscription-plans")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSubscriptionPlan([FromBody] CreateSubscriptionPlanRequest request)
        => Ok(await _adminService.CreateSubscriptionPlanAsync(request, GetCurrentUserId()));

    [HttpPut("subscription-plans/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSubscriptionPlan(int id, [FromBody] UpdateSubscriptionPlanRequest request)
        => Ok(await _adminService.UpdateSubscriptionPlanAsync(id, request, GetCurrentUserId()));

    [HttpPost("subscription-plans/{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleSubscriptionPlanStatus(int id)
        => Ok(await _adminService.ToggleSubscriptionPlanStatusAsync(id, GetCurrentUserId()));

    // ─── Upsell Rules ───────────────────────────────────────────
    [HttpGet("upsell-rules")]
    [Authorize(Roles = "Admin,SalesRep,SalesManager")]
    public async Task<IActionResult> GetUpsellRules() => Ok(await _adminService.GetUpsellRulesAsync());

    [HttpPost("upsell-rules")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUpsellRule([FromBody] CreateUpsellRuleRequest request)
        => Ok(await _adminService.CreateUpsellRuleAsync(request, GetCurrentUserId()));
}
