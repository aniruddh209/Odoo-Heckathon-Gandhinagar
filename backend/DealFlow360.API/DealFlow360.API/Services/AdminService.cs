using DealFlow360.API.Data;
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
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DealFlow360.API.Services;

public interface IAdminService
{
    // Users
    Task<List<UserResponse>> GetUsersAsync();
    Task<UserResponse> CreateUserAsync(CreateUserRequest request, int? actingUserId = null);
    Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request, int? actingUserId = null);

    // Customer Tiers
    Task<List<CustomerTierResponse>> GetCustomerTiersAsync();
    Task<CustomerTierResponse> CreateCustomerTierAsync(CreateCustomerTierRequest request, int? actingUserId = null);
    Task<CustomerTierResponse> UpdateCustomerTierAsync(int id, UpdateCustomerTierRequest request, int? actingUserId = null);

    // Categories
    Task<List<CategoryResponse>> GetCategoriesAsync();
    Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request, int? actingUserId = null);

    // Products
    Task<List<ProductListResponse>> GetProductsAsync(string? search = null, int? categoryId = null, bool? isActive = null);
    Task<ProductDetailResponse> GetProductByIdAsync(int id);
    Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request, int? actingUserId = null);
    Task<ProductDetailResponse> UpdateProductAsync(int id, UpdateProductRequest request, int? actingUserId = null);
    Task<ProductDetailResponse> ToggleProductStatusAsync(int id, int? actingUserId = null);
    Task<List<VariantResponse>> GetProductVariantsAsync(int productId);
    Task<VariantResponse> CreateProductVariantAsync(int productId, CreateVariantRequest request, int? actingUserId = null);
    Task<VariantResponse> UpdateProductVariantAsync(int productId, int variantId, UpdateVariantRequest request, int? actingUserId = null);
    Task<bool> DeleteProductVariantAsync(int productId, int variantId, int? actingUserId = null);

    // Price Lists
    Task<List<PriceListResponse>> GetPriceListsAsync();
    Task<PriceListResponse> GetPriceListByIdAsync(int id);
    Task<PriceListResponse> CreatePriceListAsync(CreatePriceListRequest request, int? actingUserId = null);
    Task<PriceListResponse> UpdatePriceListAsync(int id, UpdatePriceListRequest request, int? actingUserId = null);
    Task<PriceListResponse> TogglePriceListStatusAsync(int id, int? actingUserId = null);
    Task<PriceListItemResponse> UpsertPriceListItemAsync(int priceListId, UpsertPriceListItemRequest request, int? actingUserId = null);
    Task<bool> DeletePriceListItemAsync(int priceListId, int productId, int? actingUserId = null);
    Task<bool> DeletePriceListAsync(int id, int? actingUserId = null);

    // Discount Rules
    Task<List<DiscountRuleResponse>> GetDiscountRulesAsync();
    Task<DiscountRuleResponse> CreateDiscountRuleAsync(CreateDiscountRuleRequest request, int? actingUserId = null);
    Task<DiscountRuleResponse> UpdateDiscountRuleAsync(int id, UpdateDiscountRuleRequest request, int? actingUserId = null);
    Task<bool> DeleteDiscountRuleAsync(int id, int? actingUserId = null);

    // Approval Rules
    Task<List<ApprovalRuleResponse>> GetApprovalRulesAsync();
    Task<ApprovalRuleResponse> CreateApprovalRuleAsync(CreateApprovalRuleRequest request, int? actingUserId = null);
    Task<ApprovalRuleResponse> UpdateApprovalRuleAsync(int id, UpdateApprovalRuleRequest request, int? actingUserId = null);
    Task<bool> DeleteApprovalRuleAsync(int id, int? actingUserId = null);

    // Warehouses & Stock
    Task<List<WarehouseResponse>> GetWarehousesAsync();
    Task<WarehouseResponse> GetWarehouseByIdAsync(int id);
    Task<WarehouseResponse> CreateWarehouseAsync(CreateWarehouseRequest request, int? actingUserId = null);
    Task<WarehouseResponse> UpdateWarehouseAsync(int id, UpdateWarehouseRequest request, int? actingUserId = null);
    Task<WarehouseResponse> ToggleWarehouseStatusAsync(int id, int? actingUserId = null);
    Task<List<StockResponse>> GetWarehouseStocksAsync(int warehouseId);
    Task<List<StockResponse>> GetAllInventoryStocksAsync();
    Task<StockResponse> AdjustStockAsync(int warehouseId, AdjustStockRequest request, int? actingUserId = null);
    Task<List<ReplenishmentRuleResponse>> GetReplenishmentRulesAsync(int? warehouseId = null);
    Task<ReplenishmentRuleResponse> CreateReplenishmentRuleAsync(CreateReplenishmentRuleRequest request, int? actingUserId = null);
    Task<ReplenishmentRuleResponse> UpdateReplenishmentRuleAsync(int id, UpdateReplenishmentRuleRequest request, int? actingUserId = null);
    Task<bool> DeleteReplenishmentRuleAsync(int id, int? actingUserId = null);

    // Sales Teams
    Task<List<SalesTeamResponse>> GetSalesTeamsAsync();
    Task<SalesTeamResponse> CreateSalesTeamAsync(CreateSalesTeamRequest request, int? actingUserId = null);

    // Subscription Plans
    Task<List<SubscriptionPlanResponse>> GetSubscriptionPlansAsync();
    Task<SubscriptionPlanResponse> CreateSubscriptionPlanAsync(CreateSubscriptionPlanRequest request, int? actingUserId = null);
    Task<SubscriptionPlanResponse> UpdateSubscriptionPlanAsync(int id, UpdateSubscriptionPlanRequest request, int? actingUserId = null);
    Task<SubscriptionPlanResponse> ToggleSubscriptionPlanStatusAsync(int id, int? actingUserId = null);

    // Upsell Rules
    Task<List<UpsellRuleResponse>> GetUpsellRulesAsync();
    Task<UpsellRuleResponse> CreateUpsellRuleAsync(CreateUpsellRuleRequest request, int? actingUserId = null);
    Task<UpsellRuleResponse> UpdateUpsellRuleAsync(int id, UpdateUpsellRuleRequest request, int? actingUserId = null);
    Task<bool> DeleteUpsellRuleAsync(int id, int? actingUserId = null);

    // Platform Analytics & Audit
    Task<PlatformOverviewResponse> GetPlatformOverviewAsync();
    Task<List<AdminAuditLogDto>> GetAuditLogsAsync(int take = 50);
}

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;

    public AdminService(AppDbContext context)
    {
        _context = context;
    }

    private async Task LogAuditAsync(int? userId, string entityName, int entityId, string action, string? reason = null, object? oldValue = null, object? newValue = null)
    {
        try
        {
            var auditLog = new AuditLog
            {
                UserId = userId,
                EntityName = entityName,
                EntityId = entityId,
                Action = action,
                Reason = reason,
                OldValueJson = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
                NewValueJson = newValue != null ? JsonSerializer.Serialize(newValue) : null,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Suppress non-critical audit log failure to preserve primary transaction
        }
    }

    // ─── Users ──────────────────────────────────────────────────
    public async Task<List<UserResponse>> GetUsersAsync()
    {
        return await _context.Users
            .Select(u => new UserResponse
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.ToString(),
                SalesTeamId = u.SalesTeamId,
                CustomerId = u.CustomerId,
                IsActive = u.IsActive
            })
            .ToListAsync();
    }

    public async Task<UserResponse> CreateUserAsync(CreateUserRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Email)) throw new ArgumentException("Email is required.");
        if (string.IsNullOrWhiteSpace(request.FullName)) throw new ArgumentException("Full name is required.");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters.");

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
        if (existingUser != null) throw new InvalidOperationException($"User with email '{request.Email}' already exists.");

        var role = Enum.Parse<Role>(request.Role, true);
        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            SalesTeamId = request.SalesTeamId,
            CustomerId = request.CustomerId,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "User", user.Id, "UserCreated", $"Created user {user.Email} with role {user.Role}", null, new { user.Id, user.Email, user.Role });

        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            SalesTeamId = user.SalesTeamId,
            CustomerId = user.CustomerId,
            IsActive = user.IsActive
        };
    }

    public async Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request, int? actingUserId = null)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) throw new KeyNotFoundException($"User {id} not found.");

        var oldSnapshot = new { user.FullName, Role = user.Role.ToString(), user.SalesTeamId, user.CustomerId, user.IsActive };

        user.FullName = request.FullName.Trim();
        user.Role = Enum.Parse<Role>(request.Role, true);
        user.SalesTeamId = request.SalesTeamId;
        user.CustomerId = request.CustomerId;
        user.IsActive = request.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "User", user.Id, "UserUpdated", $"Updated user {user.Email}", oldSnapshot, new { user.FullName, Role = user.Role.ToString(), user.IsActive });

        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            SalesTeamId = user.SalesTeamId,
            CustomerId = user.CustomerId,
            IsActive = user.IsActive
        };
    }

    // ─── Customer Tiers ─────────────────────────────────────────
    public async Task<List<CustomerTierResponse>> GetCustomerTiersAsync()
    {
        return await _context.CustomerTiers
            .Select(t => new CustomerTierResponse
            {
                Id = t.Id,
                Name = t.Name,
                MaxDiscountPercent = t.MaxDiscountPercent
            }).ToListAsync();
    }

    public async Task<CustomerTierResponse> CreateCustomerTierAsync(CreateCustomerTierRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Customer tier name is required.");
        if (request.MaxDiscountPercent < 0 || request.MaxDiscountPercent > 100)
            throw new ArgumentException("Max discount percent must be between 0% and 100%.");

        var tier = new CustomerTier
        {
            Name = request.Name.Trim(),
            MaxDiscountPercent = request.MaxDiscountPercent,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.CustomerTiers.Add(tier);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "CustomerTier", tier.Id, "CustomerTierCreated", $"Created customer tier {tier.Name}", null, tier);

        return new CustomerTierResponse
        {
            Id = tier.Id,
            Name = tier.Name,
            MaxDiscountPercent = tier.MaxDiscountPercent
        };
    }

    public async Task<CustomerTierResponse> UpdateCustomerTierAsync(int id, UpdateCustomerTierRequest request, int? actingUserId = null)
    {
        var tier = await _context.CustomerTiers.FindAsync(id);
        if (tier == null) throw new KeyNotFoundException($"Customer tier {id} not found.");

        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Customer tier name is required.");
        if (request.MaxDiscountPercent < 0 || request.MaxDiscountPercent > 100)
            throw new ArgumentException("Max discount percent must be between 0% and 100%.");

        var oldSnapshot = new { tier.Name, tier.MaxDiscountPercent };

        tier.Name = request.Name.Trim();
        tier.MaxDiscountPercent = request.MaxDiscountPercent;
        tier.UpdatedAtUtc = DateTime.UtcNow;

        _context.CustomerTiers.Update(tier);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "CustomerTier", tier.Id, "CustomerTierUpdated", $"Updated customer tier {tier.Name}", oldSnapshot, tier);

        return new CustomerTierResponse
        {
            Id = tier.Id,
            Name = tier.Name,
            MaxDiscountPercent = tier.MaxDiscountPercent
        };
    }

    // ─── Categories ─────────────────────────────────────────────
    public async Task<List<CategoryResponse>> GetCategoriesAsync()
    {
        return await _context.ProductCategories
            .Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive
            }).ToListAsync();
    }

    public async Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Category name is required.");

        var cat = new ProductCategory
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ProductCategories.Add(cat);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "Category", cat.Id, "CategoryCreated", $"Created category {cat.Name}", null, cat);

        return new CategoryResponse
        {
            Id = cat.Id,
            Name = cat.Name,
            Description = cat.Description,
            IsActive = cat.IsActive
        };
    }

    // ─── Products ───────────────────────────────────────────────
    public async Task<List<ProductListResponse>> GetProductsAsync(string? search = null, int? categoryId = null, bool? isActive = null)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term) || p.SKU.ToLower().Contains(term));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => new ProductListResponse
            {
                Id = p.Id,
                SKU = p.SKU,
                Name = p.Name,
                Description = p.Description,
                CategoryName = p.Category.Name,
                ProductType = p.ProductType.ToString(),
                BasePrice = p.BasePrice,
                CostPrice = p.CostPrice,
                TaxRate = p.TaxRate,
                IsActive = p.IsActive
            }).ToListAsync();
    }

    public async Task<ProductDetailResponse> GetProductByIdAsync(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) throw new KeyNotFoundException($"Product {id} not found.");

        return new ProductDetailResponse
        {
            Id = product.Id,
            SKU = product.SKU,
            Name = product.Name,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? string.Empty,
            ProductType = product.ProductType.ToString(),
            BasePrice = product.BasePrice,
            CostPrice = product.CostPrice,
            TaxRate = product.TaxRate,
            Unit = product.Unit,
            IsActive = product.IsActive,
            Variants = product.Variants.Select(v => new VariantResponse
            {
                Id = v.Id,
                Name = v.Name,
                AdditionalPrice = v.AdditionalPrice,
                IsActive = v.IsActive
            }).ToList()
        };
    }
    public async Task<List<VariantResponse>> GetProductVariantsAsync(int productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) throw new KeyNotFoundException($"Product {productId} not found.");

        return await _context.ProductVariants
            .Where(v => v.ProductId == productId)
            .OrderBy(v => v.Name)
            .Select(v => new VariantResponse
            {
                Id = v.Id,
                Name = v.Name,
                AdditionalPrice = v.AdditionalPrice,
                IsActive = v.IsActive
            }).ToListAsync();
    }

    public async Task<VariantResponse> CreateProductVariantAsync(int productId, CreateVariantRequest request, int? actingUserId = null)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) throw new KeyNotFoundException($"Product {productId} not found.");

        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Variant name is required.");

        var variant = new ProductVariant
        {
            ProductId = productId,
            Name = request.Name.Trim(),
            AdditionalPrice = request.AdditionalPrice,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.ProductVariants.Add(variant);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "ProductVariant", variant.Id, "ProductVariantCreated", $"Created variant '{variant.Name}' (+$ {variant.AdditionalPrice:F2}) for product {product.Name}", null, variant);

        return new VariantResponse
        {
            Id = variant.Id,
            Name = variant.Name,
            AdditionalPrice = variant.AdditionalPrice,
            IsActive = variant.IsActive
        };
    }

    public async Task<VariantResponse> UpdateProductVariantAsync(int productId, int variantId, UpdateVariantRequest request, int? actingUserId = null)
    {
        var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId);
        if (variant == null) throw new KeyNotFoundException($"Variant {variantId} for product {productId} not found.");

        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Variant name is required.");

        var oldSnapshot = new { variant.Name, variant.AdditionalPrice, variant.IsActive };

        variant.Name = request.Name.Trim();
        variant.AdditionalPrice = request.AdditionalPrice;
        variant.IsActive = request.IsActive;
        variant.UpdatedAtUtc = DateTime.UtcNow;

        _context.ProductVariants.Update(variant);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "ProductVariant", variant.Id, "ProductVariantUpdated", $"Updated variant '{variant.Name}' for product {productId}", oldSnapshot, variant);

        return new VariantResponse
        {
            Id = variant.Id,
            Name = variant.Name,
            AdditionalPrice = variant.AdditionalPrice,
            IsActive = variant.IsActive
        };
    }

    public async Task<bool> DeleteProductVariantAsync(int productId, int variantId, int? actingUserId = null)
    {
        var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId);
        if (variant == null) throw new KeyNotFoundException($"Variant {variantId} for product {productId} not found.");

        _context.ProductVariants.Remove(variant);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "ProductVariant", variantId, "ProductVariantDeleted", $"Deleted variant '{variant.Name}' from product {productId}");
        return true;
    }


    public async Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.SKU)) throw new ArgumentException("SKU is required.");
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Product name is required.");
        if (request.BasePrice <= 0) throw new ArgumentException("Base price must be greater than 0.");
        if (request.CostPrice < 0) throw new ArgumentException("Cost price cannot be negative.");
        if (request.TaxRate < 0 || request.TaxRate > 100) throw new ArgumentException("Tax rate must be between 0% and 100%.");

        var skuNormalized = request.SKU.Trim().ToUpperInvariant();
        var skuExists = await _context.Products.AnyAsync(p => p.SKU.ToUpper() == skuNormalized);
        if (skuExists) throw new InvalidOperationException($"Product with SKU '{request.SKU}' already exists.");

        var category = await _context.ProductCategories.FindAsync(request.CategoryId);
        if (category == null) throw new KeyNotFoundException($"Product category {request.CategoryId} not found.");

        var product = new Product
        {
            SKU = skuNormalized,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CategoryId = request.CategoryId,
            ProductType = Enum.Parse<ProductType>(request.ProductType, true),
            BasePrice = request.BasePrice,
            CostPrice = request.CostPrice,
            TaxRate = request.TaxRate,
            Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Each" : request.Unit.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "Product", product.Id, "ProductCreated", $"Created product {product.Name} [{product.SKU}]", null, product);

        return new ProductDetailResponse
        {
            Id = product.Id,
            SKU = product.SKU,
            Name = product.Name,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            ProductType = product.ProductType.ToString(),
            BasePrice = product.BasePrice,
            CostPrice = product.CostPrice,
            TaxRate = product.TaxRate,
            Unit = product.Unit,
            IsActive = product.IsActive
        };
    }

    public async Task<ProductDetailResponse> UpdateProductAsync(int id, UpdateProductRequest request, int? actingUserId = null)
    {
        var product = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) throw new KeyNotFoundException($"Product {id} not found.");

        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Product name is required.");
        if (request.BasePrice <= 0) throw new ArgumentException("Base price must be greater than 0.");
        if (request.CostPrice < 0) throw new ArgumentException("Cost price cannot be negative.");
        if (request.TaxRate < 0 || request.TaxRate > 100) throw new ArgumentException("Tax rate must be between 0% and 100%.");

        if (!string.IsNullOrWhiteSpace(request.SKU))
        {
            var skuNorm = request.SKU.Trim().ToUpperInvariant();
            var skuExists = await _context.Products.AnyAsync(p => p.SKU.ToUpper() == skuNorm && p.Id != id);
            if (skuExists) throw new InvalidOperationException($"Product with SKU '{request.SKU}' already exists.");
            product.SKU = skuNorm;
        }

        var category = await _context.ProductCategories.FindAsync(request.CategoryId);
        if (category == null) throw new KeyNotFoundException($"Product category {request.CategoryId} not found.");

        var oldSnapshot = new { product.Name, product.SKU, product.BasePrice, product.CostPrice, product.TaxRate, product.IsActive };

        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim();
        product.CategoryId = request.CategoryId;
        product.ProductType = Enum.Parse<ProductType>(request.ProductType, true);
        product.BasePrice = request.BasePrice;
        product.CostPrice = request.CostPrice;
        product.TaxRate = request.TaxRate;
        product.Unit = string.IsNullOrWhiteSpace(request.Unit) ? product.Unit : request.Unit.Trim();
        product.IsActive = request.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "Product", product.Id, "ProductUpdated", $"Updated product {product.Name} [{product.SKU}]", oldSnapshot, product);

        return new ProductDetailResponse
        {
            Id = product.Id,
            SKU = product.SKU,
            Name = product.Name,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            ProductType = product.ProductType.ToString(),
            BasePrice = product.BasePrice,
            CostPrice = product.CostPrice,
            TaxRate = product.TaxRate,
            Unit = product.Unit,
            IsActive = product.IsActive
        };
    }

    public async Task<ProductDetailResponse> ToggleProductStatusAsync(int id, int? actingUserId = null)
    {
        var product = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) throw new KeyNotFoundException($"Product {id} not found.");

        product.IsActive = !product.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "Product", product.Id, product.IsActive ? "ProductActivated" : "ProductDeactivated", $"Product {product.Name} [{product.SKU}] active status toggled to {product.IsActive}");

        return new ProductDetailResponse
        {
            Id = product.Id,
            SKU = product.SKU,
            Name = product.Name,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? string.Empty,
            ProductType = product.ProductType.ToString(),
            BasePrice = product.BasePrice,
            CostPrice = product.CostPrice,
            TaxRate = product.TaxRate,
            Unit = product.Unit,
            IsActive = product.IsActive
        };
    }

    // ─── Price Lists ────────────────────────────────────────────
    public async Task<List<PriceListResponse>> GetPriceListsAsync()
    {
        return await _context.PriceLists
            .Include(pl => pl.Tier)
            .Include(pl => pl.Items).ThenInclude(i => i.Product)
            .Select(pl => new PriceListResponse
            {
                Id = pl.Id,
                Name = pl.Name,
                CurrencyCode = pl.CurrencyCode,
                TierId = pl.TierId,
                TierName = pl.Tier != null ? pl.Tier.Name : null,
                IsActive = pl.IsActive,
                Items = pl.Items.Select(i => new PriceListItemResponse
                {
                    Id = i.Id,
                    PriceListId = i.PriceListId,
                    ProductId = i.ProductId,
                    ProductName = i.Product != null ? i.Product.Name : string.Empty,
                    ProductSKU = i.Product != null ? i.Product.SKU : string.Empty,
                    CurrencyCode = pl.CurrencyCode,
                    UnitPrice = i.UnitPrice
                }).ToList()
            }).ToListAsync();
    }

    public async Task<PriceListResponse> GetPriceListByIdAsync(int id)
    {
        var pl = await _context.PriceLists
            .Include(p => p.Tier)
            .Include(p => p.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pl == null) throw new KeyNotFoundException($"Price list {id} not found.");

        return new PriceListResponse
        {
            Id = pl.Id,
            Name = pl.Name,
            CurrencyCode = pl.CurrencyCode,
            TierId = pl.TierId,
            TierName = pl.Tier?.Name,
            IsActive = pl.IsActive,
            Items = pl.Items.Select(i => new PriceListItemResponse
            {
                Id = i.Id,
                PriceListId = i.PriceListId,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
                ProductSKU = i.Product?.SKU ?? string.Empty,
                CurrencyCode = pl.CurrencyCode,
                UnitPrice = i.UnitPrice
            }).ToList()
        };
    }

    public async Task<PriceListResponse> CreatePriceListAsync(CreatePriceListRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Price list name is required.");

        var pl = new PriceList
        {
            Name = request.Name.Trim(),
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode.Trim().ToUpperInvariant(),
            TierId = request.TierId,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.PriceLists.Add(pl);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "PriceList", pl.Id, "PriceListCreated", $"Created price list {pl.Name} ({pl.CurrencyCode})", null, pl);

        return await GetPriceListByIdAsync(pl.Id);
    }

    public async Task<PriceListResponse> UpdatePriceListAsync(int id, UpdatePriceListRequest request, int? actingUserId = null)
    {
        var pl = await _context.PriceLists.FindAsync(id);
        if (pl == null) throw new KeyNotFoundException($"Price list {id} not found.");

        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Price list name is required.");

        var oldSnapshot = new { pl.Name, pl.CurrencyCode, pl.TierId, pl.IsActive };

        pl.Name = request.Name.Trim();
        pl.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? pl.CurrencyCode : request.CurrencyCode.Trim().ToUpperInvariant();
        pl.TierId = request.TierId;
        pl.IsActive = request.IsActive;
        pl.UpdatedAtUtc = DateTime.UtcNow;

        _context.PriceLists.Update(pl);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "PriceList", pl.Id, "PriceListUpdated", $"Updated price list {pl.Name}", oldSnapshot, pl);

        return await GetPriceListByIdAsync(id);
    }

    public async Task<PriceListResponse> TogglePriceListStatusAsync(int id, int? actingUserId = null)
    {
        var pl = await _context.PriceLists.FindAsync(id);
        if (pl == null) throw new KeyNotFoundException($"Price list {id} not found.");

        pl.IsActive = !pl.IsActive;
        pl.UpdatedAtUtc = DateTime.UtcNow;
        _context.PriceLists.Update(pl);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "PriceList", pl.Id, pl.IsActive ? "PriceListActivated" : "PriceListDeactivated", $"Price list {pl.Name} status toggled to {pl.IsActive}");

        return await GetPriceListByIdAsync(id);
    }

    public async Task<PriceListItemResponse> UpsertPriceListItemAsync(int priceListId, UpsertPriceListItemRequest request, int? actingUserId = null)
    {
        if (request.UnitPrice <= 0) throw new ArgumentException("Price list unit price must be greater than 0.");

        var priceList = await _context.PriceLists.FindAsync(priceListId);
        if (priceList == null) throw new KeyNotFoundException($"Price list {priceListId} not found.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) throw new KeyNotFoundException($"Product {request.ProductId} not found.");

        var item = await _context.PriceListItems.FirstOrDefaultAsync(pli => pli.PriceListId == priceListId && pli.ProductId == request.ProductId);
        decimal oldPrice = item?.UnitPrice ?? 0;

        if (item == null)
        {
            item = new PriceListItem
            {
                PriceListId = priceListId,
                ProductId = request.ProductId,
                UnitPrice = request.UnitPrice,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.PriceListItems.Add(item);
        }
        else
        {
            item.UnitPrice = request.UnitPrice;
            item.UpdatedAtUtc = DateTime.UtcNow;
            _context.PriceListItems.Update(item);
        }

        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "PriceList", priceListId, "PriceListItemUpserted", $"Configured price for product '{product.Name}' in price list '{priceList.Name}': {oldPrice:F2} -> {request.UnitPrice:F2}");

        return new PriceListItemResponse
        {
            Id = item.Id,
            PriceListId = item.PriceListId,
            ProductId = item.ProductId,
            ProductName = product.Name,
            ProductSKU = product.SKU,
            CurrencyCode = priceList.CurrencyCode,
            UnitPrice = item.UnitPrice
        };
    }

    public async Task<bool> DeletePriceListItemAsync(int priceListId, int productId, int? actingUserId = null)
    {
        var item = await _context.PriceListItems.FirstOrDefaultAsync(pli => pli.PriceListId == priceListId && pli.ProductId == productId);
        if (item == null) return false;

        _context.PriceListItems.Remove(item);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "PriceList", priceListId, "PriceListItemDeleted", $"Removed product {productId} from price list {priceListId}");
        return true;
    }

    public async Task<bool> DeletePriceListAsync(int id, int? actingUserId = null)
    {
        var pl = await _context.PriceLists.FindAsync(id);
        if (pl == null) throw new KeyNotFoundException($"Price list {id} not found.");

        pl.IsActive = false;
        pl.UpdatedAtUtc = DateTime.UtcNow;
        _context.PriceLists.Update(pl);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "PriceList", id, "PriceListDeactivated", $"Soft-deactivated price list {pl.Name}");
        return true;
    }

    // ─── Discount Rules ─────────────────────────────────────────
    public async Task<List<DiscountRuleResponse>> GetDiscountRulesAsync()
    {
        return await _context.DiscountRules
            .Include(dr => dr.Tier)
            .Include(dr => dr.Category)
            .Select(dr => new DiscountRuleResponse
            {
                Id = dr.Id,
                TierId = dr.TierId,
                TierName = dr.Tier.Name,
                CategoryId = dr.CategoryId,
                CategoryName = dr.Category != null ? dr.Category.Name : null,
                MaxDiscountPercent = dr.MaxDiscountPercent,
                ManagerThreshold = dr.ManagerThreshold,
                FinanceThreshold = dr.FinanceThreshold,
                IsActive = dr.IsActive
            }).ToListAsync();
    }

    public async Task<DiscountRuleResponse> CreateDiscountRuleAsync(CreateDiscountRuleRequest request, int? actingUserId = null)
    {
        if (request.MaxDiscountPercent < 0 || request.MaxDiscountPercent > 100)
            throw new ArgumentException("Max discount percent must be between 0% and 100%.");
        if (request.ManagerThreshold < 0 || request.ManagerThreshold > 100)
            throw new ArgumentException("Manager threshold must be between 0% and 100%.");
        if (request.FinanceThreshold < 0 || request.FinanceThreshold > 100)
            throw new ArgumentException("Finance threshold must be between 0% and 100%.");

        var tier = await _context.CustomerTiers.FindAsync(request.TierId);
        if (tier == null) throw new KeyNotFoundException($"Customer tier {request.TierId} not found.");

        if (request.CategoryId.HasValue && !await _context.ProductCategories.AnyAsync(c => c.Id == request.CategoryId.Value))
            throw new KeyNotFoundException($"Category {request.CategoryId.Value} not found.");

        var duplicate = await _context.DiscountRules.AnyAsync(r => r.TierId == request.TierId && r.CategoryId == request.CategoryId && r.IsActive);
        if (duplicate) throw new InvalidOperationException("An active discount rule for this customer tier and product category already exists.");

        var rule = new DiscountRule
        {
            TierId = request.TierId,
            CategoryId = request.CategoryId,
            MaxDiscountPercent = request.MaxDiscountPercent,
            ManagerThreshold = request.ManagerThreshold,
            FinanceThreshold = request.FinanceThreshold,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.DiscountRules.Add(rule);
        await _context.SaveChangesAsync();

        var category = rule.CategoryId.HasValue ? await _context.ProductCategories.FindAsync(rule.CategoryId.Value) : null;

        await LogAuditAsync(actingUserId, "DiscountRule", rule.Id, "DiscountRuleCreated", $"Created discount rule for tier '{tier.Name}' (Max: {rule.MaxDiscountPercent}%)", null, rule);

        return new DiscountRuleResponse
        {
            Id = rule.Id,
            TierId = rule.TierId,
            TierName = tier.Name,
            CategoryId = rule.CategoryId,
            CategoryName = category?.Name,
            MaxDiscountPercent = rule.MaxDiscountPercent,
            ManagerThreshold = rule.ManagerThreshold,
            FinanceThreshold = rule.FinanceThreshold,
            IsActive = rule.IsActive
        };
    }

    public async Task<DiscountRuleResponse> UpdateDiscountRuleAsync(int id, UpdateDiscountRuleRequest request, int? actingUserId = null)
    {
        var rule = await _context.DiscountRules.FindAsync(id);
        if (rule == null) throw new KeyNotFoundException($"Discount rule {id} not found.");

        if (request.MaxDiscountPercent < 0 || request.MaxDiscountPercent > 100)
            throw new ArgumentException("Max discount percent must be between 0% and 100%.");
        if (request.ManagerThreshold < 0 || request.ManagerThreshold > 100)
            throw new ArgumentException("Manager threshold must be between 0% and 100%.");
        if (request.FinanceThreshold < 0 || request.FinanceThreshold > 100)
            throw new ArgumentException("Finance threshold must be between 0% and 100%.");

        var oldSnapshot = new { rule.TierId, rule.CategoryId, rule.MaxDiscountPercent, rule.ManagerThreshold, rule.FinanceThreshold, rule.IsActive };

        rule.TierId = request.TierId;
        rule.CategoryId = request.CategoryId;
        rule.MaxDiscountPercent = request.MaxDiscountPercent;
        rule.ManagerThreshold = request.ManagerThreshold;
        rule.FinanceThreshold = request.FinanceThreshold;
        rule.IsActive = request.IsActive;
        rule.UpdatedAtUtc = DateTime.UtcNow;

        _context.DiscountRules.Update(rule);
        await _context.SaveChangesAsync();

        var tier = await _context.CustomerTiers.FindAsync(rule.TierId);
        var category = rule.CategoryId.HasValue ? await _context.ProductCategories.FindAsync(rule.CategoryId.Value) : null;

        await LogAuditAsync(actingUserId, "DiscountRule", rule.Id, "DiscountRuleUpdated", $"Updated discount rule DR-{rule.Id}", oldSnapshot, rule);

        return new DiscountRuleResponse
        {
            Id = rule.Id,
            TierId = rule.TierId,
            TierName = tier?.Name ?? string.Empty,
            CategoryId = rule.CategoryId,
            CategoryName = category?.Name,
            MaxDiscountPercent = rule.MaxDiscountPercent,
            ManagerThreshold = rule.ManagerThreshold,
            FinanceThreshold = rule.FinanceThreshold,
            IsActive = rule.IsActive
        };
    }

    public async Task<bool> DeleteDiscountRuleAsync(int id, int? actingUserId = null)
    {
        var rule = await _context.DiscountRules.FindAsync(id);
        if (rule == null) throw new KeyNotFoundException($"Discount rule {id} not found.");

        _context.DiscountRules.Remove(rule);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "DiscountRule", id, "DiscountRuleDeleted", $"Deleted discount rule DR-{id}");
        return true;
    }

    // ─── Approval Rules ─────────────────────────────────────────
    public async Task<List<ApprovalRuleResponse>> GetApprovalRulesAsync()
    {
        return await _context.ApprovalRules
            .OrderBy(ar => ar.Sequence)
            .Select(ar => new ApprovalRuleResponse
            {
                Id = ar.Id,
                Level = ar.Level.ToString(),
                MinRisk = ar.MinRisk,
                MaxRisk = ar.MaxRisk,
                RequiredRole = ar.RequiredRole,
                Sequence = ar.Sequence,
                IsActive = ar.IsActive
            }).ToListAsync();
    }

    public async Task<ApprovalRuleResponse> CreateApprovalRuleAsync(CreateApprovalRuleRequest request, int? actingUserId = null)
    {
        if (request.MinRisk < 0 || request.MaxRisk > 100 || request.MinRisk > request.MaxRisk)
            throw new ArgumentException("Invalid risk score range.");

        var rule = new ApprovalRule
        {
            Level = Enum.Parse<ApprovalLevel>(request.Level, true),
            MinRisk = request.MinRisk,
            MaxRisk = request.MaxRisk,
            RequiredRole = string.IsNullOrWhiteSpace(request.RequiredRole) ? "SalesManager" : request.RequiredRole.Trim(),
            Sequence = request.Sequence > 0 ? request.Sequence : 1,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ApprovalRules.Add(rule);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "ApprovalRule", rule.Id, "ApprovalRuleCreated", $"Created approval rule level {rule.Level}", null, rule);

        return new ApprovalRuleResponse
        {
            Id = rule.Id,
            Level = rule.Level.ToString(),
            MinRisk = rule.MinRisk,
            MaxRisk = rule.MaxRisk,
            RequiredRole = rule.RequiredRole,
            Sequence = rule.Sequence,
            IsActive = rule.IsActive
        };
    }

    public async Task<ApprovalRuleResponse> UpdateApprovalRuleAsync(int id, UpdateApprovalRuleRequest request, int? actingUserId = null)
    {
        var rule = await _context.ApprovalRules.FindAsync(id);
        if (rule == null) throw new KeyNotFoundException($"Approval rule {id} not found.");

        if (request.MinRisk < 0 || request.MaxRisk > 100 || request.MinRisk > request.MaxRisk)
            throw new ArgumentException("Invalid risk score range.");

        var oldSnapshot = new { Level = rule.Level.ToString(), rule.MinRisk, rule.MaxRisk, rule.RequiredRole, rule.Sequence, rule.IsActive };

        rule.Level = Enum.Parse<ApprovalLevel>(request.Level, true);
        rule.MinRisk = request.MinRisk;
        rule.MaxRisk = request.MaxRisk;
        rule.RequiredRole = string.IsNullOrWhiteSpace(request.RequiredRole) ? rule.RequiredRole : request.RequiredRole.Trim();
        rule.Sequence = request.Sequence > 0 ? request.Sequence : rule.Sequence;
        rule.IsActive = request.IsActive;
        rule.UpdatedAtUtc = DateTime.UtcNow;

        _context.ApprovalRules.Update(rule);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "ApprovalRule", rule.Id, "ApprovalRuleUpdated", $"Updated approval rule level {rule.Level}", oldSnapshot, rule);

        return new ApprovalRuleResponse
        {
            Id = rule.Id,
            Level = rule.Level.ToString(),
            MinRisk = rule.MinRisk,
            MaxRisk = rule.MaxRisk,
            RequiredRole = rule.RequiredRole,
            Sequence = rule.Sequence,
            IsActive = rule.IsActive
        };
    }

    public async Task<bool> DeleteApprovalRuleAsync(int id, int? actingUserId = null)
    {
        var rule = await _context.ApprovalRules.FindAsync(id);
        if (rule == null) throw new KeyNotFoundException($"Approval rule {id} not found.");

        _context.ApprovalRules.Remove(rule);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "ApprovalRule", id, "ApprovalRuleDeleted", $"Deleted approval rule #{id}");
        return true;
    }

    // ─── Warehouses & Stock ─────────────────────────────────────
    public async Task<List<WarehouseResponse>> GetWarehousesAsync()
    {
        return await _context.Warehouses
            .Select(w => new WarehouseResponse
            {
                Id = w.Id,
                Name = w.Name,
                ShippingCostWeight = w.ShippingCostWeight,
                IsActive = w.IsActive
            }).ToListAsync();
    }

    public async Task<WarehouseResponse> GetWarehouseByIdAsync(int id)
    {
        var w = await _context.Warehouses.FindAsync(id);
        if (w == null) throw new KeyNotFoundException($"Warehouse {id} not found.");

        return new WarehouseResponse
        {
            Id = w.Id,
            Name = w.Name,
            ShippingCostWeight = w.ShippingCostWeight,
            IsActive = w.IsActive
        };
    }

    public async Task<WarehouseResponse> CreateWarehouseAsync(CreateWarehouseRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Warehouse name is required.");
        if (request.ShippingCostWeight < 0) throw new ArgumentException("Shipping cost weight multiplier cannot be negative.");

        var w = new Warehouse
        {
            Name = request.Name.Trim(),
            ShippingCostWeight = request.ShippingCostWeight,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Warehouses.Add(w);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "Warehouse", w.Id, "WarehouseCreated", $"Created warehouse hub {w.Name} (multiplier: {w.ShippingCostWeight}x)", null, w);

        return new WarehouseResponse
        {
            Id = w.Id,
            Name = w.Name,
            ShippingCostWeight = w.ShippingCostWeight,
            IsActive = w.IsActive
        };
    }

    public async Task<WarehouseResponse> UpdateWarehouseAsync(int id, UpdateWarehouseRequest request, int? actingUserId = null)
    {
        var w = await _context.Warehouses.FindAsync(id);
        if (w == null) throw new KeyNotFoundException($"Warehouse {id} not found.");

        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Warehouse name is required.");
        if (request.ShippingCostWeight < 0) throw new ArgumentException("Shipping cost weight multiplier cannot be negative.");

        var oldSnapshot = new { w.Name, w.ShippingCostWeight, w.IsActive };

        w.Name = request.Name.Trim();
        w.ShippingCostWeight = request.ShippingCostWeight;
        w.IsActive = request.IsActive;
        w.UpdatedAtUtc = DateTime.UtcNow;

        _context.Warehouses.Update(w);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "Warehouse", w.Id, "WarehouseUpdated", $"Updated warehouse {w.Name}", oldSnapshot, w);

        return new WarehouseResponse
        {
            Id = w.Id,
            Name = w.Name,
            ShippingCostWeight = w.ShippingCostWeight,
            IsActive = w.IsActive
        };
    }

    public async Task<WarehouseResponse> ToggleWarehouseStatusAsync(int id, int? actingUserId = null)
    {
        var w = await _context.Warehouses.FindAsync(id);
        if (w == null) throw new KeyNotFoundException($"Warehouse {id} not found.");

        w.IsActive = !w.IsActive;
        w.UpdatedAtUtc = DateTime.UtcNow;

        _context.Warehouses.Update(w);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "Warehouse", w.Id, w.IsActive ? "WarehouseActivated" : "WarehouseDeactivated", $"Warehouse {w.Name} status toggled to {w.IsActive}");

        return new WarehouseResponse
        {
            Id = w.Id,
            Name = w.Name,
            ShippingCostWeight = w.ShippingCostWeight,
            IsActive = w.IsActive
        };
    }

    public async Task<List<StockResponse>> GetWarehouseStocksAsync(int warehouseId)
    {
        return await _context.InventoryStocks
            .Include(s => s.Warehouse)
            .Include(s => s.Product)
            .Where(s => s.WarehouseId == warehouseId)
            .Select(s => new StockResponse
            {
                Id = s.Id,
                WarehouseId = s.WarehouseId,
                WarehouseName = s.Warehouse.Name,
                ProductId = s.ProductId,
                ProductName = s.Product.Name,
                ProductSKU = s.Product.SKU,
                OnHand = s.OnHand,
                Reserved = s.Reserved,
                Available = s.OnHand - s.Reserved
            }).ToListAsync();
    }

    public async Task<List<StockResponse>> GetAllInventoryStocksAsync()
    {
        return await _context.InventoryStocks
            .Include(s => s.Warehouse)
            .Include(s => s.Product)
            .Select(s => new StockResponse
            {
                Id = s.Id,
                WarehouseId = s.WarehouseId,
                WarehouseName = s.Warehouse.Name,
                ProductId = s.ProductId,
                ProductName = s.Product.Name,
                ProductSKU = s.Product.SKU,
                OnHand = s.OnHand,
                Reserved = s.Reserved,
                Available = s.OnHand - s.Reserved
            }).ToListAsync();
    }

    public async Task<StockResponse> AdjustStockAsync(int warehouseId, AdjustStockRequest request, int? actingUserId = null)
    {
        if (request.OnHand < 0) throw new ArgumentException("Stock on-hand cannot be negative.");

        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        if (warehouse == null) throw new KeyNotFoundException($"Warehouse {warehouseId} not found.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) throw new KeyNotFoundException($"Product {request.ProductId} not found.");

        var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == warehouseId && s.ProductId == request.ProductId);
        int oldOnHand = stock?.OnHand ?? 0;

        if (stock == null)
        {
            stock = new InventoryStock
            {
                WarehouseId = warehouseId,
                ProductId = request.ProductId,
                OnHand = request.OnHand,
                Reserved = 0,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _context.InventoryStocks.Add(stock);
        }
        else
        {
            if (request.OnHand < stock.Reserved)
            {
                throw new InvalidOperationException($"Cannot reduce stock on-hand ({request.OnHand}) below currently reserved quantity ({stock.Reserved}).");
            }

            stock.OnHand = request.OnHand;
            stock.UpdatedAtUtc = DateTime.UtcNow;
            _context.InventoryStocks.Update(stock);
        }

        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "InventoryStock", stock.Id, "StockAdjusted", $"Adjusted stock for '{product.Name}' in '{warehouse.Name}': {oldOnHand} -> {request.OnHand} (Reserved: {stock.Reserved})");

        return new StockResponse
        {
            Id = stock.Id,
            WarehouseId = stock.WarehouseId,
            WarehouseName = warehouse.Name,
            ProductId = stock.ProductId,
            ProductName = product.Name,
            ProductSKU = product.SKU,
            OnHand = stock.OnHand,
            Reserved = stock.Reserved,
            Available = stock.OnHand - stock.Reserved
        };
    }
    public async Task<List<ReplenishmentRuleResponse>> GetReplenishmentRulesAsync(int? warehouseId = null)
    {
        var query = _context.ReplenishmentRules
            .Include(r => r.Warehouse)
            .Include(r => r.Product)
            .AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(r => r.WarehouseId == warehouseId.Value);
        }

        var stocks = await _context.InventoryStocks.ToListAsync();
        var stockMap = stocks.ToDictionary(s => $"{s.WarehouseId}_{s.ProductId}", s => s.OnHand);

        var rules = await query.OrderBy(r => r.Warehouse.Name).ThenBy(r => r.Product.Name).ToListAsync();

        return rules.Select(r => new ReplenishmentRuleResponse
        {
            Id = r.Id,
            WarehouseId = r.WarehouseId,
            WarehouseName = r.Warehouse?.Name ?? string.Empty,
            ProductId = r.ProductId,
            ProductName = r.Product?.Name ?? string.Empty,
            ProductSKU = r.Product?.SKU ?? string.Empty,
            ReorderLevel = r.ReorderLevel,
            ReorderQuantity = r.ReorderQuantity,
            IsActive = r.IsActive,
            CurrentStock = stockMap.GetValueOrDefault($"{r.WarehouseId}_{r.ProductId}", 0)
        }).ToList();
    }

    public async Task<ReplenishmentRuleResponse> CreateReplenishmentRuleAsync(CreateReplenishmentRuleRequest request, int? actingUserId = null)
    {
        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null) throw new KeyNotFoundException($"Warehouse {request.WarehouseId} not found.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) throw new KeyNotFoundException($"Product {request.ProductId} not found.");

        if (request.ReorderLevel < 0) throw new ArgumentException("Reorder level cannot be negative.");
        if (request.ReorderQuantity <= 0) throw new ArgumentException("Reorder quantity must be greater than 0.");

        var rule = new ReplenishmentRule
        {
            WarehouseId = request.WarehouseId,
            ProductId = request.ProductId,
            ReorderLevel = request.ReorderLevel,
            ReorderQuantity = request.ReorderQuantity,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ReplenishmentRules.Add(rule);
        await _context.SaveChangesAsync();

        var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == rule.WarehouseId && s.ProductId == rule.ProductId);

        await LogAuditAsync(actingUserId, "ReplenishmentRule", rule.Id, "ReplenishmentRuleCreated", $"Created replenishment rule for {product.Name} at {warehouse.Name} (Min: {rule.ReorderLevel}, Reorder: {rule.ReorderQuantity})", null, rule);

        return new ReplenishmentRuleResponse
        {
            Id = rule.Id,
            WarehouseId = rule.WarehouseId,
            WarehouseName = warehouse.Name,
            ProductId = rule.ProductId,
            ProductName = product.Name,
            ProductSKU = product.SKU,
            ReorderLevel = rule.ReorderLevel,
            ReorderQuantity = rule.ReorderQuantity,
            IsActive = rule.IsActive,
            CurrentStock = stock?.OnHand ?? 0
        };
    }

    public async Task<ReplenishmentRuleResponse> UpdateReplenishmentRuleAsync(int id, UpdateReplenishmentRuleRequest request, int? actingUserId = null)
    {
        var rule = await _context.ReplenishmentRules
            .Include(r => r.Warehouse)
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (rule == null) throw new KeyNotFoundException($"Replenishment rule {id} not found.");

        if (request.ReorderLevel < 0) throw new ArgumentException("Reorder level cannot be negative.");
        if (request.ReorderQuantity <= 0) throw new ArgumentException("Reorder quantity must be greater than 0.");

        var oldSnapshot = new { rule.ReorderLevel, rule.ReorderQuantity, rule.IsActive };

        rule.WarehouseId = request.WarehouseId;
        rule.ProductId = request.ProductId;
        rule.ReorderLevel = request.ReorderLevel;
        rule.ReorderQuantity = request.ReorderQuantity;
        rule.IsActive = request.IsActive;
        rule.UpdatedAtUtc = DateTime.UtcNow;

        _context.ReplenishmentRules.Update(rule);
        await _context.SaveChangesAsync();

        var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == rule.WarehouseId && s.ProductId == rule.ProductId);

        await LogAuditAsync(actingUserId, "ReplenishmentRule", rule.Id, "ReplenishmentRuleUpdated", $"Updated replenishment rule {rule.Id}", oldSnapshot, rule);

        return new ReplenishmentRuleResponse
        {
            Id = rule.Id,
            WarehouseId = rule.WarehouseId,
            WarehouseName = rule.Warehouse?.Name ?? string.Empty,
            ProductId = rule.ProductId,
            ProductName = rule.Product?.Name ?? string.Empty,
            ProductSKU = rule.Product?.SKU ?? string.Empty,
            ReorderLevel = rule.ReorderLevel,
            ReorderQuantity = rule.ReorderQuantity,
            IsActive = rule.IsActive,
            CurrentStock = stock?.OnHand ?? 0
        };
    }

    public async Task<bool> DeleteReplenishmentRuleAsync(int id, int? actingUserId = null)
    {
        var rule = await _context.ReplenishmentRules.FindAsync(id);
        if (rule == null) throw new KeyNotFoundException($"Replenishment rule {id} not found.");

        _context.ReplenishmentRules.Remove(rule);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "ReplenishmentRule", id, "ReplenishmentRuleDeleted", $"Deleted replenishment rule {id}");
        return true;
    }


    // ─── Sales Teams ────────────────────────────────────────────
    public async Task<List<SalesTeamResponse>> GetSalesTeamsAsync()
    {
        return await _context.SalesTeams
            .Select(st => new SalesTeamResponse
            {
                Id = st.Id,
                Name = st.Name,
                IsActive = st.IsActive
            }).ToListAsync();
    }

    public async Task<SalesTeamResponse> CreateSalesTeamAsync(CreateSalesTeamRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Sales team name is required.");

        var st = new SalesTeam
        {
            Name = request.Name.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SalesTeams.Add(st);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "SalesTeam", st.Id, "SalesTeamCreated", $"Created sales team {st.Name}", null, st);

        return new SalesTeamResponse
        {
            Id = st.Id,
            Name = st.Name,
            IsActive = st.IsActive
        };
    }

    // ─── Subscription Plans ─────────────────────────────────────
    public async Task<List<SubscriptionPlanResponse>> GetSubscriptionPlansAsync()
    {
        return await _context.SubscriptionPlans
            .Select(sp => new SubscriptionPlanResponse
            {
                Id = sp.Id,
                Name = sp.Name,
                BillingFrequency = sp.BillingFrequency,
                BillingIntervalMonths = sp.BillingIntervalMonths,
                IsActive = sp.IsActive
            }).ToListAsync();
    }

    public async Task<SubscriptionPlanResponse> CreateSubscriptionPlanAsync(CreateSubscriptionPlanRequest request, int? actingUserId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Subscription plan name is required.");
        if (request.BillingIntervalMonths <= 0) throw new ArgumentException("Billing interval months must be at least 1.");

        var sp = new SubscriptionPlan
        {
            Name = request.Name.Trim(),
            BillingFrequency = string.IsNullOrWhiteSpace(request.BillingFrequency) ? "Monthly" : request.BillingFrequency.Trim(),
            BillingIntervalMonths = request.BillingIntervalMonths,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SubscriptionPlans.Add(sp);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "SubscriptionPlan", sp.Id, "SubscriptionPlanCreated", $"Created subscription plan '{sp.Name}' ({sp.BillingFrequency}, {sp.BillingIntervalMonths} mo)", null, sp);

        return new SubscriptionPlanResponse
        {
            Id = sp.Id,
            Name = sp.Name,
            BillingFrequency = sp.BillingFrequency,
            BillingIntervalMonths = sp.BillingIntervalMonths,
            IsActive = sp.IsActive
        };
    }

    public async Task<SubscriptionPlanResponse> UpdateSubscriptionPlanAsync(int id, UpdateSubscriptionPlanRequest request, int? actingUserId = null)
    {
        var sp = await _context.SubscriptionPlans.FindAsync(id);
        if (sp == null) throw new KeyNotFoundException($"Subscription plan {id} not found.");

        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Subscription plan name is required.");
        if (request.BillingIntervalMonths <= 0) throw new ArgumentException("Billing interval months must be at least 1.");

        var oldSnapshot = new { sp.Name, sp.BillingFrequency, sp.BillingIntervalMonths, sp.IsActive };

        sp.Name = request.Name.Trim();
        sp.BillingFrequency = string.IsNullOrWhiteSpace(request.BillingFrequency) ? sp.BillingFrequency : request.BillingFrequency.Trim();
        sp.BillingIntervalMonths = request.BillingIntervalMonths;
        sp.IsActive = request.IsActive;
        sp.UpdatedAtUtc = DateTime.UtcNow;

        _context.SubscriptionPlans.Update(sp);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "SubscriptionPlan", sp.Id, "SubscriptionPlanUpdated", $"Updated subscription plan '{sp.Name}'", oldSnapshot, sp);

        return new SubscriptionPlanResponse
        {
            Id = sp.Id,
            Name = sp.Name,
            BillingFrequency = sp.BillingFrequency,
            BillingIntervalMonths = sp.BillingIntervalMonths,
            IsActive = sp.IsActive
        };
    }

    public async Task<SubscriptionPlanResponse> ToggleSubscriptionPlanStatusAsync(int id, int? actingUserId = null)
    {
        var sp = await _context.SubscriptionPlans.FindAsync(id);
        if (sp == null) throw new KeyNotFoundException($"Subscription plan {id} not found.");

        sp.IsActive = !sp.IsActive;
        sp.UpdatedAtUtc = DateTime.UtcNow;

        _context.SubscriptionPlans.Update(sp);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "SubscriptionPlan", sp.Id, sp.IsActive ? "SubscriptionPlanActivated" : "SubscriptionPlanDeactivated", $"Subscription plan '{sp.Name}' status toggled to {sp.IsActive}");

        return new SubscriptionPlanResponse
        {
            Id = sp.Id,
            Name = sp.Name,
            BillingFrequency = sp.BillingFrequency,
            BillingIntervalMonths = sp.BillingIntervalMonths,
            IsActive = sp.IsActive
        };
    }

    // ─── Upsell Rules ───────────────────────────────────────────
    public async Task<List<UpsellRuleResponse>> GetUpsellRulesAsync()
    {
        return await _context.UpsellCrossSellRules
            .Include(ur => ur.TriggerProduct)
            .Include(ur => ur.SuggestedProduct)
            .Select(ur => new UpsellRuleResponse
            {
                Id = ur.Id,
                TriggerProductId = ur.TriggerProductId,
                TriggerProductName = ur.TriggerProduct.Name,
                SuggestedProductId = ur.SuggestedProductId,
                SuggestedProductName = ur.SuggestedProduct.Name,
                RuleType = ur.RuleType,
                Score = ur.Score,
                IsPromoted = ur.IsPromoted,
                IsActive = ur.IsActive
            }).ToListAsync();
    }

    public async Task<UpsellRuleResponse> CreateUpsellRuleAsync(CreateUpsellRuleRequest request, int? actingUserId = null)
    {
        var ur = new UpsellCrossSellRule
        {
            TriggerProductId = request.TriggerProductId,
            SuggestedProductId = request.SuggestedProductId,
            RuleType = request.RuleType,
            Score = request.Score,
            IsPromoted = request.IsPromoted,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.UpsellCrossSellRules.Add(ur);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "UpsellRule", ur.Id, "UpsellRuleCreated", $"Created upsell rule for product {ur.TriggerProductId} -> {ur.SuggestedProductId}", null, ur);

        return new UpsellRuleResponse
        {
            Id = ur.Id,
            TriggerProductId = ur.TriggerProductId,
            SuggestedProductId = ur.SuggestedProductId,
            RuleType = ur.RuleType,
            Score = ur.Score,
            IsPromoted = ur.IsPromoted,
            IsActive = ur.IsActive
        };
    }

    public async Task<UpsellRuleResponse> UpdateUpsellRuleAsync(int id, UpdateUpsellRuleRequest request, int? actingUserId = null)
    {
        var ur = await _context.UpsellCrossSellRules
            .Include(r => r.TriggerProduct)
            .Include(r => r.SuggestedProduct)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (ur == null) throw new KeyNotFoundException($"Upsell rule {id} not found.");

        var oldSnapshot = new { ur.TriggerProductId, ur.SuggestedProductId, ur.RuleType, ur.Score, ur.IsPromoted, ur.IsActive };

        ur.TriggerProductId = request.TriggerProductId;
        ur.SuggestedProductId = request.SuggestedProductId;
        ur.RuleType = request.RuleType;
        ur.Score = request.Score;
        ur.IsPromoted = request.IsPromoted;
        ur.IsActive = request.IsActive;
        ur.UpdatedAtUtc = DateTime.UtcNow;

        _context.UpsellCrossSellRules.Update(ur);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "UpsellRule", ur.Id, "UpsellRuleUpdated", $"Updated upsell rule {ur.Id}", oldSnapshot, ur);

        return new UpsellRuleResponse
        {
            Id = ur.Id,
            TriggerProductId = ur.TriggerProductId,
            TriggerProductName = ur.TriggerProduct?.Name ?? string.Empty,
            SuggestedProductId = ur.SuggestedProductId,
            SuggestedProductName = ur.SuggestedProduct?.Name ?? string.Empty,
            RuleType = ur.RuleType,
            Score = ur.Score,
            IsPromoted = ur.IsPromoted,
            IsActive = ur.IsActive
        };
    }

    public async Task<bool> DeleteUpsellRuleAsync(int id, int? actingUserId = null)
    {
        var ur = await _context.UpsellCrossSellRules.FindAsync(id);
        if (ur == null) throw new KeyNotFoundException($"Upsell rule {id} not found.");

        _context.UpsellCrossSellRules.Remove(ur);
        await _context.SaveChangesAsync();

        await LogAuditAsync(actingUserId, "UpsellRule", id, "UpsellRuleDeleted", $"Deleted upsell rule {id}");
        return true;
    }


    // ─── Platform Analytics & Audit ─────────────────────────────
    public async Task<PlatformOverviewResponse> GetPlatformOverviewAsync()
    {
        var users = await _context.Users.ToListAsync();
        var customersCount = await _context.Customers.CountAsync();
        var quotes = await _context.Quotations.ToListAsync();
        var orders = await _context.Orders.ToListAsync();
        var invoices = await _context.Invoices.ToListAsync();
        var schedules = await _context.BillingSchedules.Include(s => s.SubscriptionPlan).ToListAsync();
        var backorders = await _context.Backorders.ToListAsync();
        var warehouses = await _context.Warehouses.ToListAsync();
        var stocks = await _context.InventoryStocks.ToListAsync();

        var statusDist = quotes
            .GroupBy(q => q.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var mrr = schedules.Where(s => s.Status == SubscriptionStatus.Active)
            .Sum(s => (s.SubscriptionPlan != null && s.SubscriptionPlan.BillingIntervalMonths > 0)
                ? (s.UnitPrice * s.Quantity) / s.SubscriptionPlan.BillingIntervalMonths
                : (s.UnitPrice * s.Quantity));

        return new PlatformOverviewResponse
        {
            TotalCustomers = customersCount,
            TotalSalesReps = users.Count(u => u.Role == Role.SalesRep),
            TotalSalesManagers = users.Count(u => u.Role == Role.SalesManager),
            TotalFinanceUsers = users.Count(u => u.Role == Role.FinanceOperations),
            TotalQuotations = quotes.Count,
            QuoteStatusDistribution = statusDist,
            TotalOrders = orders.Count,
            TotalBookedRevenue = orders.Sum(o => o.Total),
            TotalQuotedRevenue = quotes.Sum(q => q.GrandTotal),
            TotalInvoiced = invoices.Sum(i => i.Total),
            TotalPaid = invoices.Sum(i => i.PaidAmount),
            PendingApprovalsCount = quotes.Count(q => q.Status == QuoteStatus.PendingApproval),
            ActiveFulfillmentsCount = orders.Count(o => o.Status != OrderStatus.Fulfilled && o.Status != OrderStatus.Cancelled),
            BackordersCount = backorders.Count(b => b.Status != "Cancelled" && b.Status != "Fulfilled"),
            ActiveSubscriptionsCount = schedules.Count(s => s.Status == SubscriptionStatus.Active),
            MonthlyRecurringRevenue = Math.Round(mrr, 2),
            AnnualRecurringRevenue = Math.Round(mrr * 12, 2),
            AtRiskDealsCount = quotes.Count(q => q.RiskScore >= 40.00m || q.MarginPercent < 20.00m),
            TotalWarehouses = warehouses.Count,
            TotalStockOnHand = stocks.Sum(s => s.OnHand),
            TotalStockReserved = stocks.Sum(s => s.Reserved)
        };
    }

    public async Task<List<AdminAuditLogDto>> GetAuditLogsAsync(int take = 50)
    {
        return await _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(take)
            .Select(a => new AdminAuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.FullName : "System / Automated",
                UserRole = a.User != null ? a.User.Role.ToString() : "Platform",
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                Action = a.Action,
                Reason = a.Reason,
                OldValueJson = a.OldValueJson,
                NewValueJson = a.NewValueJson,
                CreatedAtUtc = a.CreatedAtUtc
            }).ToListAsync();
    }
}
