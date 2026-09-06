using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DealFlow360.API.Models;

public class Warehouse
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,4)")]
    public decimal ShippingCostWeight { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public ICollection<InventoryStock> Stocks { get; set; } = new List<InventoryStock>();

    public ICollection<WarehouseAllocation> Allocations { get; set; } = new List<WarehouseAllocation>();
}
