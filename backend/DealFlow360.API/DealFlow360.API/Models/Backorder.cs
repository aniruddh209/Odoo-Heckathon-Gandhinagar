using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class Backorder
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int OrderLineId { get; set; }

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    [Required, MaxLength(50)]
    public string Status { get; set; } = "Pending"; // Pending, Fulfilled, Cancelled

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public Order Order { get; set; } = null!;

    public OrderLine OrderLine { get; set; } = null!;

    public Product Product { get; set; } = null!;
}
