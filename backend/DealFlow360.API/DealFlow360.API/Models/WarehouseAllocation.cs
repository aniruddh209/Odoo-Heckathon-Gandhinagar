using System.ComponentModel.DataAnnotations.Schema;

namespace DealFlow360.API.Models;

public class WarehouseAllocation
{
    public int Id { get; set; }

    public int OrderLineId { get; set; }

    public int WarehouseId { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ShipmentCost { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public OrderLine OrderLine { get; set; } = null!;

    public Warehouse Warehouse { get; set; } = null!;
}
