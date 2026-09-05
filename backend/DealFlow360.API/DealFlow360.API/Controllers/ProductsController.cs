using DealFlow360.API.DTOs.Categories;
using DealFlow360.API.DTOs.Products;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] int? categoryId, [FromQuery] bool? activeOnly = true)
    {
        var result = await _productService.GetProductsAsync(categoryId, activeOnly);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        var result = await _productService.GetProductByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SalesManager,Admin")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        var result = await _productService.CreateProductAsync(request);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SalesManager,Admin")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
    {
        var result = await _productService.UpdateProductAsync(id, request);
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _productService.GetCategoriesAsync();
        return Ok(result);
    }

    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var result = await _productService.CreateCategoryAsync(request.Name, request.Description);
        return Ok(result);
    }

    [HttpPost("{id}/variants")]
    [Authorize(Roles = "SalesManager,Admin")]
    public async Task<IActionResult> AddVariant(int id, [FromBody] CreateVariantRequest request)
    {
        var result = await _productService.AddVariantAsync(id, request);
        return Ok(result);
    }
}
