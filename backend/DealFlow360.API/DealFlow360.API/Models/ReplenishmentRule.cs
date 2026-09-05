namespace DealFlow360.API.Models;

public class ReplenishmentRule
{
    public int Id { get; set; }

    public int WarehouseId { get; set; }

    public int ProductId { get; set; }

    public int ReorderLevel { get; set; }

    public int ReorderQuantity { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public Warehouse Warehouse { get; set; } = null!;

    public Product Product { get; set; } = null!;
}
