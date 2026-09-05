using DealFlow360.API.Data;
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
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IAdminService
{
    // Users
    Task<List<UserResponse>> GetUsersAsync();
    Task<UserResponse> CreateUserAsync(CreateUserRequest request);
    Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request);

    // Customer Tiers
    Task<List<CustomerTierResponse>> GetCustomerTiersAsync();
    Task<CustomerTierResponse> CreateCustomerTierAsync(CreateCustomerTierRequest request);

    // Categories
    Task<List<CategoryResponse>> GetCategoriesAsync();
    Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request);

    // Products
    Task<List<ProductListResponse>> GetProductsAsync();
    Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request);
    Task<ProductDetailResponse> UpdateProductAsync(int id, UpdateProductRequest request);

    // Price Lists
    Task<List<PriceListResponse>> GetPriceListsAsync();
    Task<PriceListResponse> CreatePriceListAsync(CreatePriceListRequest request);
    Task<PriceListItemResponse> UpsertPriceListItemAsync(int priceListId, UpsertPriceListItemRequest request);

    // Discount Rules
    Task<List<DiscountRuleResponse>> GetDiscountRulesAsync();
    Task<DiscountRuleResponse> CreateDiscountRuleAsync(CreateDiscountRuleRequest request);

    // Approval Rules
    Task<List<ApprovalRuleResponse>> GetApprovalRulesAsync();
    Task<ApprovalRuleResponse> CreateApprovalRuleAsync(CreateApprovalRuleRequest request);

    // Warehouses
    Task<List<WarehouseResponse>> GetWarehousesAsync();
    Task<WarehouseResponse> CreateWarehouseAsync(CreateWarehouseRequest request);
    Task<StockResponse> AdjustStockAsync(int warehouseId, AdjustStockRequest request);

    // Sales Teams
    Task<List<SalesTeamResponse>> GetSalesTeamsAsync();
    Task<SalesTeamResponse> CreateSalesTeamAsync(CreateSalesTeamRequest request);

    // Subscription Plans
    Task<List<SubscriptionPlanResponse>> GetSubscriptionPlansAsync();
    Task<SubscriptionPlanResponse> CreateSubscriptionPlanAsync(CreateSubscriptionPlanRequest request);

    // Upsell Rules
    Task<List<UpsellRuleResponse>> GetUpsellRulesAsync();
    Task<UpsellRuleResponse> CreateUpsellRuleAsync(CreateUpsellRuleRequest request);
}

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;

    public AdminService(AppDbContext context)
    {
        _context = context;
    }

    // Users
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

    public async Task<UserResponse> CreateUserAsync(CreateUserRequest request)
    {
        var role = Enum.Parse<Role>(request.Role, true);
        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
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

    public async Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) throw new KeyNotFoundException($"User {id} not found.");

        user.FullName = request.FullName;
        user.Role = Enum.Parse<Role>(request.Role, true);
        user.SalesTeamId = request.SalesTeamId;
        user.CustomerId = request.CustomerId;
        user.IsActive = request.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

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

    // Customer Tiers
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

    public async Task<CustomerTierResponse> CreateCustomerTierAsync(CreateCustomerTierRequest request)
    {
        var tier = new CustomerTier
        {
            Name = request.Name,
            MaxDiscountPercent = request.MaxDiscountPercent,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.CustomerTiers.Add(tier);
        await _context.SaveChangesAsync();

        return new CustomerTierResponse
        {
            Id = tier.Id,
            Name = tier.Name,
            MaxDiscountPercent = tier.MaxDiscountPercent
        };
    }

    // Categories
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

    public async Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request)
    {
        var cat = new ProductCategory
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ProductCategories.Add(cat);
        await _context.SaveChangesAsync();

        return new CategoryResponse
        {
            Id = cat.Id,
            Name = cat.Name,
            Description = cat.Description,
            IsActive = cat.IsActive
        };
    }

    // Products
    public async Task<List<ProductListResponse>> GetProductsAsync()
    {
        return await _context.Products
            .Include(p => p.Category)
            .Select(p => new ProductListResponse
            {
                Id = p.Id,
                SKU = p.SKU,
                Name = p.Name,
                CategoryName = p.Category.Name,
                ProductType = p.ProductType.ToString(),
                BasePrice = p.BasePrice,
                CostPrice = p.CostPrice,
                IsActive = p.IsActive
            }).ToListAsync();
    }

    public async Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request)
    {
        var product = new Product
        {
            SKU = request.SKU,
            Name = request.Name,
            CategoryId = request.CategoryId,
            ProductType = Enum.Parse<ProductType>(request.ProductType, true),
            BasePrice = request.BasePrice,
            CostPrice = request.CostPrice,
            TaxRate = request.TaxRate,
            Unit = request.Unit,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var category = await _context.ProductCategories.FindAsync(request.CategoryId);

        return new ProductDetailResponse
        {
            Id = product.Id,
            SKU = product.SKU,
            Name = product.Name,
            CategoryId = product.CategoryId,
            CategoryName = category?.Name ?? string.Empty,
            ProductType = product.ProductType.ToString(),
            BasePrice = product.BasePrice,
            CostPrice = product.CostPrice,
            TaxRate = product.TaxRate,
            Unit = product.Unit,
            IsActive = product.IsActive
        };
    }

    public async Task<ProductDetailResponse> UpdateProductAsync(int id, UpdateProductRequest request)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) throw new KeyNotFoundException($"Product {id} not found.");

        product.Name = request.Name;
        product.CategoryId = request.CategoryId;
        product.ProductType = Enum.Parse<ProductType>(request.ProductType, true);
        product.BasePrice = request.BasePrice;
        product.CostPrice = request.CostPrice;
        product.TaxRate = request.TaxRate;
        product.Unit = request.Unit;
        product.IsActive = request.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        var category = await _context.ProductCategories.FindAsync(request.CategoryId);

        return new ProductDetailResponse
        {
            Id = product.Id,
            SKU = product.SKU,
            Name = product.Name,
            CategoryId = product.CategoryId,
            CategoryName = category?.Name ?? string.Empty,
            ProductType = product.ProductType.ToString(),
            BasePrice = product.BasePrice,
            CostPrice = product.CostPrice,
            TaxRate = product.TaxRate,
            Unit = product.Unit,
            IsActive = product.IsActive
        };
    }

    // Price Lists
    public async Task<List<PriceListResponse>> GetPriceListsAsync()
    {
        return await _context.PriceLists
            .Select(pl => new PriceListResponse
            {
                Id = pl.Id,
                Name = pl.Name,
                CurrencyCode = pl.CurrencyCode,
                TierId = pl.TierId,
                IsActive = pl.IsActive
            }).ToListAsync();
    }

    public async Task<PriceListResponse> CreatePriceListAsync(CreatePriceListRequest request)
    {
        var pl = new PriceList
        {
            Name = request.Name,
            CurrencyCode = request.CurrencyCode,
            TierId = request.TierId,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.PriceLists.Add(pl);
        await _context.SaveChangesAsync();

        return new PriceListResponse
        {
            Id = pl.Id,
            Name = pl.Name,
            CurrencyCode = pl.CurrencyCode,
            TierId = pl.TierId,
            IsActive = pl.IsActive
        };
    }

    public async Task<PriceListItemResponse> UpsertPriceListItemAsync(int priceListId, UpsertPriceListItemRequest request)
    {
        var item = await _context.PriceListItems.FirstOrDefaultAsync(pli => pli.PriceListId == priceListId && pli.ProductId == request.ProductId);
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

        var product = await _context.Products.FindAsync(request.ProductId);
        var priceList = await _context.PriceLists.FindAsync(priceListId);

        return new PriceListItemResponse
        {
            Id = item.Id,
            PriceListId = item.PriceListId,
            ProductId = item.ProductId,
            ProductName = product?.Name ?? string.Empty,
            ProductSKU = product?.SKU ?? string.Empty,
            CurrencyCode = priceList?.CurrencyCode ?? "INR",
            UnitPrice = item.UnitPrice
        };
    }

    // Discount Rules
    public async Task<List<DiscountRuleResponse>> GetDiscountRulesAsync()
    {
        return await _context.DiscountRules
            .Select(dr => new DiscountRuleResponse
            {
                Id = dr.Id,
                TierId = dr.TierId,
                CategoryId = dr.CategoryId,
                MaxDiscountPercent = dr.MaxDiscountPercent,
                ManagerThreshold = dr.ManagerThreshold,
                FinanceThreshold = dr.FinanceThreshold
            }).ToListAsync();
    }

    public async Task<DiscountRuleResponse> CreateDiscountRuleAsync(CreateDiscountRuleRequest request)
    {
        var rule = new DiscountRule
        {
            TierId = request.TierId,
            CategoryId = request.CategoryId,
            MaxDiscountPercent = request.MaxDiscountPercent,
            ManagerThreshold = request.ManagerThreshold,
            FinanceThreshold = request.FinanceThreshold,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.DiscountRules.Add(rule);
        await _context.SaveChangesAsync();

        return new DiscountRuleResponse
        {
            Id = rule.Id,
            TierId = rule.TierId,
            CategoryId = rule.CategoryId,
            MaxDiscountPercent = rule.MaxDiscountPercent,
            ManagerThreshold = rule.ManagerThreshold,
            FinanceThreshold = rule.FinanceThreshold
        };
    }

    // Approval Rules
    public async Task<List<ApprovalRuleResponse>> GetApprovalRulesAsync()
    {
        return await _context.ApprovalRules
            .Select(ar => new ApprovalRuleResponse
            {
                Id = ar.Id,
                Level = ar.Level.ToString(),
                MinRisk = ar.MinRisk,
                MaxRisk = ar.MaxRisk,
                RequiredRole = ar.RequiredRole,
                Sequence = ar.Sequence
            }).ToListAsync();
    }

    public async Task<ApprovalRuleResponse> CreateApprovalRuleAsync(CreateApprovalRuleRequest request)
    {
        var rule = new ApprovalRule
        {
            Level = Enum.Parse<ApprovalLevel>(request.Level, true),
            MinRisk = request.MinRisk,
            MaxRisk = request.MaxRisk,
            RequiredRole = request.RequiredRole,
            Sequence = request.Sequence,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ApprovalRules.Add(rule);
        await _context.SaveChangesAsync();

        return new ApprovalRuleResponse
        {
            Id = rule.Id,
            Level = rule.Level.ToString(),
            MinRisk = rule.MinRisk,
            MaxRisk = rule.MaxRisk,
            RequiredRole = rule.RequiredRole,
            Sequence = rule.Sequence
        };
    }

    // Warehouses
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

    public async Task<WarehouseResponse> CreateWarehouseAsync(CreateWarehouseRequest request)
    {
        var w = new Warehouse
        {
            Name = request.Name,
            ShippingCostWeight = request.ShippingCostWeight,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Warehouses.Add(w);
        await _context.SaveChangesAsync();

        return new WarehouseResponse
        {
            Id = w.Id,
            Name = w.Name,
            ShippingCostWeight = w.ShippingCostWeight,
            IsActive = w.IsActive
        };
    }

    public async Task<StockResponse> AdjustStockAsync(int warehouseId, AdjustStockRequest request)
    {
        var stock = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == warehouseId && s.ProductId == request.ProductId);
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
            stock.OnHand = request.OnHand;
            stock.UpdatedAtUtc = DateTime.UtcNow;
            _context.InventoryStocks.Update(stock);
        }

        await _context.SaveChangesAsync();

        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        var product = await _context.Products.FindAsync(request.ProductId);

        return new StockResponse
        {
            Id = stock.Id,
            WarehouseId = stock.WarehouseId,
            WarehouseName = warehouse?.Name ?? string.Empty,
            ProductId = stock.ProductId,
            ProductName = product?.Name ?? string.Empty,
            ProductSKU = product?.SKU ?? string.Empty,
            OnHand = stock.OnHand,
            Reserved = stock.Reserved,
            Available = stock.OnHand - stock.Reserved
        };
    }

    // Sales Teams
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

    public async Task<SalesTeamResponse> CreateSalesTeamAsync(CreateSalesTeamRequest request)
    {
        var st = new SalesTeam
        {
            Name = request.Name,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SalesTeams.Add(st);
        await _context.SaveChangesAsync();

        return new SalesTeamResponse
        {
            Id = st.Id,
            Name = st.Name,
            IsActive = st.IsActive
        };
    }

    // Subscription Plans
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

    public async Task<SubscriptionPlanResponse> CreateSubscriptionPlanAsync(CreateSubscriptionPlanRequest request)
    {
        var sp = new SubscriptionPlan
        {
            Name = request.Name,
            BillingFrequency = request.BillingFrequency,
            BillingIntervalMonths = request.BillingIntervalMonths,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SubscriptionPlans.Add(sp);
        await _context.SaveChangesAsync();

        return new SubscriptionPlanResponse
        {
            Id = sp.Id,
            Name = sp.Name,
            BillingFrequency = sp.BillingFrequency,
            BillingIntervalMonths = sp.BillingIntervalMonths,
            IsActive = sp.IsActive
        };
    }

    // Upsell Rules
    public async Task<List<UpsellRuleResponse>> GetUpsellRulesAsync()
    {
        return await _context.UpsellCrossSellRules
            .Select(ur => new UpsellRuleResponse
            {
                Id = ur.Id,
                TriggerProductId = ur.TriggerProductId,
                SuggestedProductId = ur.SuggestedProductId,
                RuleType = ur.RuleType,
                Score = ur.Score,
                IsPromoted = ur.IsPromoted,
                IsActive = ur.IsActive
            }).ToListAsync();
    }

    public async Task<UpsellRuleResponse> CreateUpsellRuleAsync(CreateUpsellRuleRequest request)
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
}
