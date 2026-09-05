using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Products;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IProductService
{
    Task<List<ProductListResponse>> GetProductsAsync(int? categoryId = null, bool? activeOnly = true);
    Task<ProductDetailResponse> GetProductByIdAsync(int id);
    Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request);
    Task<ProductDetailResponse> UpdateProductAsync(int id, UpdateProductRequest request);
    Task<List<ProductCategory>> GetCategoriesAsync();
    Task<ProductCategory> CreateCategoryAsync(string name, string? description);
    Task<VariantResponse> AddVariantAsync(int productId, CreateVariantRequest request);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductListResponse>> GetProductsAsync(int? categoryId = null, bool? activeOnly = true)
    {
        var query = _context.Products.Include(p => p.Category).AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(p => p.IsActive);
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => new ProductListResponse
            {
                Id = p.Id,
                SKU = p.SKU,
                Name = p.Name,
                CategoryName = p.Category.Name,
                ProductType = p.ProductType.ToString(),
                BasePrice = p.BasePrice,
                CostPrice = p.CostPrice,
                TaxRate = p.TaxRate,
                IsActive = p.IsActive
            })
            .ToListAsync();
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

    public async Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request)
    {
        var typeParsed = Enum.TryParse<ProductType>(request.ProductType, true, out var parsedType) 
            ? parsedType 
            : ProductType.OneTime;

        var product = new Product
        {
            SKU = request.SKU,
            Name = request.Name,
            CategoryId = request.CategoryId,
            ProductType = typeParsed,
            BasePrice = request.BasePrice,
            CostPrice = request.CostPrice,
            TaxRate = request.TaxRate,
            Unit = request.Unit,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return await GetProductByIdAsync(product.Id);
    }

    public async Task<ProductDetailResponse> UpdateProductAsync(int id, UpdateProductRequest request)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) throw new KeyNotFoundException($"Product {id} not found.");

        var typeParsed = Enum.TryParse<ProductType>(request.ProductType, true, out var parsedType) 
            ? parsedType 
            : product.ProductType;

        product.Name = request.Name;
        product.CategoryId = request.CategoryId;
        product.ProductType = typeParsed;
        product.BasePrice = request.BasePrice;
        product.CostPrice = request.CostPrice;
        product.TaxRate = request.TaxRate;
        product.Unit = request.Unit;
        product.IsActive = request.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        return await GetProductByIdAsync(id);
    }

    public async Task<List<ProductCategory>> GetCategoriesAsync()
    {
        return await _context.ProductCategories.OrderBy(c => c.Name).ToListAsync();
    }

    public async Task<ProductCategory> CreateCategoryAsync(string name, string? description)
    {
        var category = new ProductCategory
        {
            Name = name,
            Description = description,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ProductCategories.Add(category);
        await _context.SaveChangesAsync();

        return category;
    }

    public async Task<VariantResponse> AddVariantAsync(int productId, CreateVariantRequest request)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) throw new KeyNotFoundException($"Product {productId} not found.");

        var variant = new ProductVariant
        {
            ProductId = productId,
            Name = request.Name,
            AdditionalPrice = request.AdditionalPrice,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ProductVariants.Add(variant);
        await _context.SaveChangesAsync();

        return new VariantResponse
        {
            Id = variant.Id,
            Name = variant.Name,
            AdditionalPrice = variant.AdditionalPrice,
            IsActive = variant.IsActive
        };
    }
}
