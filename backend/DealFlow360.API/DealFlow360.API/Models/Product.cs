using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class Product
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string SKU { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int CategoryId { get; set; }

    public ProductType ProductType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BasePrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPrice { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal TaxRate { get; set; }

    [MaxLength(20)]
    public string Unit { get; set; } = "Each";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public ProductCategory Category { get; set; } = null!;

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

    public ICollection<PriceListItem> PriceListItems { get; set; } = new List<PriceListItem>();

    public ICollection<InventoryStock> InventoryStocks { get; set; } = new List<InventoryStock>();

    public ICollection<QuotationLine> QuotationLines { get; set; } = new List<QuotationLine>();

    public ICollection<UpsellCrossSellRule> TriggerRules { get; set; } = new List<UpsellCrossSellRule>();

    public ICollection<UpsellCrossSellRule> SuggestedRules { get; set; } = new List<UpsellCrossSellRule>();
}
