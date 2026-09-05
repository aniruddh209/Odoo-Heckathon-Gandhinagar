using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class ProductCategory
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public ICollection<Product> Products { get; set; } = new List<Product>();

    public ICollection<DiscountRule> DiscountRules { get; set; } = new List<DiscountRule>();
}
