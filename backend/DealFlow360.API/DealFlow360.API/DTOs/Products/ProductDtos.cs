namespace DealFlow360.API.DTOs.Products;

public class CreateProductRequest
{
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string ProductType { get; set; } = "OneTime";
    public decimal BasePrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TaxRate { get; set; }
    public string Unit { get; set; } = "Each";
}

public class UpdateProductRequest
{
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string ProductType { get; set; } = "OneTime";
    public decimal BasePrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TaxRate { get; set; }
    public string Unit { get; set; } = "Each";
    public bool IsActive { get; set; } = true;
}

public class CreateVariantRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
}

public class ProductListResponse
{
    public int Id { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string ProductType { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TaxRate { get; set; }
    public bool IsActive { get; set; }
}

public class ProductDetailResponse
{
    public int Id { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string ProductType { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TaxRate { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public List<VariantResponse> Variants { get; set; } = new();
}

public class VariantResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
    public bool IsActive { get; set; }
}
