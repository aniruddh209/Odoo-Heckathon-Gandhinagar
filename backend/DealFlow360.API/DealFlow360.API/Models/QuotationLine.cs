using System.ComponentModel.DataAnnotations.Schema;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class QuotationLine
{
    public int Id { get; set; }

    public int QuotationId { get; set; }

    public int ProductId { get; set; }

    public int? VariantId { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal DiscountPercent { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal NetAmount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal TaxAmount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal CostPrice { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal MarginAmount { get; set; }

    public int? SubscriptionPlanId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public Quotation Quotation { get; set; } = null!;

    public Product Product { get; set; } = null!;

    public ProductVariant? Variant { get; set; }

    public SubscriptionPlan? SubscriptionPlan { get; set; }

    public ICollection<QuotationLineComment> Comments { get; set; } = new List<QuotationLineComment>();
}
