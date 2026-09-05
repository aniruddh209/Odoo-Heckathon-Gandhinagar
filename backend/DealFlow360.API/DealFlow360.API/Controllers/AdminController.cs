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
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // Users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() => Ok(await _adminService.GetUsersAsync());

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        => Ok(await _adminService.CreateUserAsync(request));

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        => Ok(await _adminService.UpdateUserAsync(id, request));

    // Customer Tiers
    [HttpGet("customer-tiers")]
    [AllowAnonymous] // Visible to rep for selection
    public async Task<IActionResult> GetCustomerTiers() => Ok(await _adminService.GetCustomerTiersAsync());

    [HttpPost("customer-tiers")]
    public async Task<IActionResult> CreateCustomerTier([FromBody] CreateCustomerTierRequest request)
        => Ok(await _adminService.CreateCustomerTierAsync(request));

    // Categories
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories() => Ok(await _adminService.GetCategoriesAsync());

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        => Ok(await _adminService.CreateCategoryAsync(request));

    // Products
    [HttpGet("products")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts() => Ok(await _adminService.GetProductsAsync());

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        => Ok(await _adminService.CreateProductAsync(request));

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        => Ok(await _adminService.UpdateProductAsync(id, request));

    // Price Lists
    [HttpGet("price-lists")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPriceLists() => Ok(await _adminService.GetPriceListsAsync());

    [HttpPost("price-lists")]
    public async Task<IActionResult> CreatePriceList([FromBody] CreatePriceListRequest request)
        => Ok(await _adminService.CreatePriceListAsync(request));

    [HttpPost("price-lists/{id}/items")]
    public async Task<IActionResult> UpsertPriceListItem(int id, [FromBody] UpsertPriceListItemRequest request)
        => Ok(await _adminService.UpsertPriceListItemAsync(id, request));

    // Discount Rules
    [HttpGet("discount-rules")]
    public async Task<IActionResult> GetDiscountRules() => Ok(await _adminService.GetDiscountRulesAsync());

    [HttpPost("discount-rules")]
    public async Task<IActionResult> CreateDiscountRule([FromBody] CreateDiscountRuleRequest request)
        => Ok(await _adminService.CreateDiscountRuleAsync(request));

    // Approval Rules
    [HttpGet("approval-rules")]
    public async Task<IActionResult> GetApprovalRules() => Ok(await _adminService.GetApprovalRulesAsync());

    [HttpPost("approval-rules")]
    public async Task<IActionResult> CreateApprovalRule([FromBody] CreateApprovalRuleRequest request)
        => Ok(await _adminService.CreateApprovalRuleAsync(request));

    // Warehouses
    [HttpGet("warehouses")]
    [AllowAnonymous]
    public async Task<IActionResult> GetWarehouses() => Ok(await _adminService.GetWarehousesAsync());

    [HttpPost("warehouses")]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseRequest request)
        => Ok(await _adminService.CreateWarehouseAsync(request));

    [HttpPost("warehouses/{id}/adjust-stock")]
    public async Task<IActionResult> AdjustStock(int id, [FromBody] AdjustStockRequest request)
        => Ok(await _adminService.AdjustStockAsync(id, request));

    // Sales Teams
    [HttpGet("sales-teams")]
    public async Task<IActionResult> GetSalesTeams() => Ok(await _adminService.GetSalesTeamsAsync());

    [HttpPost("sales-teams")]
    public async Task<IActionResult> CreateSalesTeam([FromBody] CreateSalesTeamRequest request)
        => Ok(await _adminService.CreateSalesTeamAsync(request));

    // Subscription Plans
    [HttpGet("subscription-plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSubscriptionPlans() => Ok(await _adminService.GetSubscriptionPlansAsync());

    [HttpPost("subscription-plans")]
    public async Task<IActionResult> CreateSubscriptionPlan([FromBody] CreateSubscriptionPlanRequest request)
        => Ok(await _adminService.CreateSubscriptionPlanAsync(request));

    // Upsell Rules
    [HttpGet("upsell-rules")]
    public async Task<IActionResult> GetUpsellRules() => Ok(await _adminService.GetUpsellRulesAsync());

    [HttpPost("upsell-rules")]
    public async Task<IActionResult> CreateUpsellRule([FromBody] CreateUpsellRuleRequest request)
        => Ok(await _adminService.CreateUpsellRuleAsync(request));
}
