using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class UpsellCrossSellRule
{
    public int Id { get; set; }

    public int TriggerProductId { get; set; }

    public int SuggestedProductId { get; set; }

    [Required, MaxLength(50)]
    public string RuleType { get; set; } = "CrossSell"; // CrossSell, Upsell, Promotion

    public int Score { get; set; }

    public bool IsPromoted { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public Product TriggerProduct { get; set; } = null!;

    public Product SuggestedProduct { get; set; } = null!;
}
