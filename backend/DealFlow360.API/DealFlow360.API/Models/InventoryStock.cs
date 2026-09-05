using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class InventoryStock
{
    public int Id { get; set; }

    public int WarehouseId { get; set; }

    public int ProductId { get; set; }

    public int OnHand { get; set; }

    public int Reserved { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Computed (not mapped)
    public int Available => OnHand - Reserved;


    // Navigation Properties
    public Warehouse Warehouse { get; set; } = null!;

    public Product Product { get; set; } = null!;
}
