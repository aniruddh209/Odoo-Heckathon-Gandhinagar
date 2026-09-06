using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Type { get; set; }

    public bool IsRead { get; set; }

    [MaxLength(50)]
    public string? RelatedEntityType { get; set; }

    public int? RelatedEntityId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public User User { get; set; } = null!;
}
