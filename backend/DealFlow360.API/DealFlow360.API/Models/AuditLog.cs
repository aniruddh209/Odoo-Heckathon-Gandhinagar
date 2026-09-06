using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class AuditLog
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    [Required, MaxLength(100)]
    public string EntityName { get; set; } = string.Empty;

    public int EntityId { get; set; }

    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    public string? OldValueJson { get; set; }

    public string? NewValueJson { get; set; }

    [MaxLength(1000)]
    public string? Reason { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public User? User { get; set; }
}
