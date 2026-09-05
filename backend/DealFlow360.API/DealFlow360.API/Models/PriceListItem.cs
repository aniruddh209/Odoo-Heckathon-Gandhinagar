using System.ComponentModel.DataAnnotations.Schema;

namespace DealFlow360.API.Models;

public class PriceListItem
{
    public int Id { get; set; }

    public int PriceListId { get; set; }

    public int ProductId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitPrice { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public PriceList PriceList { get; set; } = null!;

    public Product Product { get; set; } = null!;
}
