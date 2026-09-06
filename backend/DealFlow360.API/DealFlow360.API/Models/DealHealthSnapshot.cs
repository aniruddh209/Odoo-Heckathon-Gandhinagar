using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class DealHealthSnapshot
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string EntityType { get; set; } = string.Empty; // Quotation, Order

    public int EntityId { get; set; }

    public int HealthScore { get; set; } // 0-100

    public string? SignalsJson { get; set; } // JSON array of health signals

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public Quotation? Quotation { get; set; }
}
