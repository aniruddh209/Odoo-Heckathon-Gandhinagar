using DealFlow360.API.DTOs.ApprovalRules;
using DealFlow360.API.DTOs.Categories;
using DealFlow360.API.DTOs.CustomerTiers;
using DealFlow360.API.DTOs.DiscountRules;
using DealFlow360.API.DTOs.PriceLists;
using DealFlow360.API.DTOs.Products;
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

    // Users
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers() => Ok(await _adminService.GetUsersAsync());

    [HttpPost("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        => Ok(await _adminService.CreateUserAsync(request));

    [HttpPut("users/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        => Ok(await _adminService.UpdateUserAsync(id, request));

    // Customer Tiers
    [HttpGet("customer-tiers")]
    [AllowAnonymous] // Visible to rep for selection
    public async Task<IActionResult> GetCustomerTiers() => Ok(await _adminService.GetCustomerTiersAsync());

    [HttpPost("customer-tiers")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateCustomerTier([FromBody] CreateCustomerTierRequest request)
        => Ok(await _adminService.CreateCustomerTierAsync(request));

    [HttpPut("customer-tiers/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> UpdateCustomerTier(int id, [FromBody] UpdateCustomerTierRequest request)
        => Ok(await _adminService.UpdateCustomerTierAsync(id, request));

    // Categories
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories() => Ok(await _adminService.GetCategoriesAsync());

    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        => Ok(await _adminService.CreateCategoryAsync(request));

    // Products
    [HttpGet("products")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts() => Ok(await _adminService.GetProductsAsync());

    [HttpPost("products")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        => Ok(await _adminService.CreateProductAsync(request));

    [HttpPut("products/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        => Ok(await _adminService.UpdateProductAsync(id, request));

    // Price Lists
    [HttpGet("price-lists")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPriceLists() => Ok(await _adminService.GetPriceListsAsync());

    [HttpPost("price-lists")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreatePriceList([FromBody] CreatePriceListRequest request)
        => Ok(await _adminService.CreatePriceListAsync(request));

    [HttpPost("price-lists/{id}/items")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpsertPriceListItem(int id, [FromBody] UpsertPriceListItemRequest request)
        => Ok(await _adminService.UpsertPriceListItemAsync(id, request));

    // Discount Rules
    [HttpGet("discount-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetDiscountRules() => Ok(await _adminService.GetDiscountRulesAsync());

    [HttpPost("discount-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateDiscountRule([FromBody] CreateDiscountRuleRequest request)
        => Ok(await _adminService.CreateDiscountRuleAsync(request));

    [HttpPut("discount-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> UpdateDiscountRule(int id, [FromBody] UpdateDiscountRuleRequest request)
        => Ok(await _adminService.UpdateDiscountRuleAsync(id, request));

    [HttpDelete("discount-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> DeleteDiscountRule(int id)
        => Ok(await _adminService.DeleteDiscountRuleAsync(id));

    // Approval Rules
    [HttpGet("approval-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetApprovalRules() => Ok(await _adminService.GetApprovalRulesAsync());

    [HttpPost("approval-rules")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateApprovalRule([FromBody] CreateApprovalRuleRequest request)
        => Ok(await _adminService.CreateApprovalRuleAsync(request));

    [HttpPut("approval-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> UpdateApprovalRule(int id, [FromBody] UpdateApprovalRuleRequest request)
        => Ok(await _adminService.UpdateApprovalRuleAsync(id, request));

    [HttpDelete("approval-rules/{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> DeleteApprovalRule(int id)
        => Ok(await _adminService.DeleteApprovalRuleAsync(id));

    // Warehouses
    [HttpGet("warehouses")]
    [AllowAnonymous]
    public async Task<IActionResult> GetWarehouses() => Ok(await _adminService.GetWarehousesAsync());

    [HttpPost("warehouses")]
    [Authorize(Roles = "Admin,FinanceOperations")]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseRequest request)
        => Ok(await _adminService.CreateWarehouseAsync(request));

    [HttpPost("warehouses/{id}/adjust-stock")]
    [Authorize(Roles = "Admin,FinanceOperations")]
    public async Task<IActionResult> AdjustStock(int id, [FromBody] AdjustStockRequest request)
        => Ok(await _adminService.AdjustStockAsync(id, request));

    // Sales Teams
    [HttpGet("sales-teams")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSalesTeams() => Ok(await _adminService.GetSalesTeamsAsync());

    [HttpPost("sales-teams")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSalesTeam([FromBody] CreateSalesTeamRequest request)
        => Ok(await _adminService.CreateSalesTeamAsync(request));

    // Subscription Plans
    [HttpGet("subscription-plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSubscriptionPlans() => Ok(await _adminService.GetSubscriptionPlansAsync());

    [HttpPost("subscription-plans")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSubscriptionPlan([FromBody] CreateSubscriptionPlanRequest request)
        => Ok(await _adminService.CreateSubscriptionPlanAsync(request));

    // Upsell Rules
    [HttpGet("upsell-rules")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUpsellRules() => Ok(await _adminService.GetUpsellRulesAsync());

    [HttpPost("upsell-rules")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUpsellRule([FromBody] CreateUpsellRuleRequest request)
        => Ok(await _adminService.CreateUpsellRuleAsync(request));
}

