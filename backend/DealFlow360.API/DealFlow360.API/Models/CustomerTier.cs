using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DealFlow360.API.Models;

public class CustomerTier
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,4)")]
    public decimal MaxDiscountPercent { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();

    public ICollection<DiscountRule> DiscountRules { get; set; } = new List<DiscountRule>();

    public ICollection<PriceList> PriceLists { get; set; } = new List<PriceList>();
}
