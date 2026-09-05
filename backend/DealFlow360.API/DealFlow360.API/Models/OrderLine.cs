using System.ComponentModel.DataAnnotations.Schema;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class OrderLine
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int? VariantId { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercent { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NetAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    public ProductType ProductType { get; set; }

    public int? SubscriptionPlanId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public Order Order { get; set; } = null!;

    public Product Product { get; set; } = null!;

    public ProductVariant? Variant { get; set; }

    public SubscriptionPlan? SubscriptionPlan { get; set; }

    public ICollection<WarehouseAllocation> Allocations { get; set; } = new List<WarehouseAllocation>();

    public ICollection<BillingSchedule> BillingSchedules { get; set; } = new List<BillingSchedule>();
}
