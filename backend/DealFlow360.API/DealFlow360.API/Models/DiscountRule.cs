using System.ComponentModel.DataAnnotations.Schema;

namespace DealFlow360.API.Models;

public class DiscountRule
{
    public int Id { get; set; }

    public int TierId { get; set; }

    public int? CategoryId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal MaxDiscountPercent { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ManagerThreshold { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal FinanceThreshold { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public CustomerTier Tier { get; set; } = null!;

    public ProductCategory? Category { get; set; }
}
