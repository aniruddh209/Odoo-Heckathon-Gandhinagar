using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class RefreshToken
{
    public int Id { get; set; }

    public int UserId { get; set; }

    [Required, MaxLength(500)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? RevokedAtUtc { get; set; }

    public bool IsRevoked => RevokedAtUtc != null;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;


    // Navigation Properties
    public User User { get; set; } = null!;
}
