using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class PriceList
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    public string CurrencyCode { get; set; } = "INR";

    public int? TierId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public CustomerTier? Tier { get; set; }

    public ICollection<PriceListItem> Items { get; set; } = new List<PriceListItem>();
}
