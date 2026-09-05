using System.ComponentModel.DataAnnotations;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public Role Role { get; set; }

    public int? SalesTeamId { get; set; }

    public int? CustomerId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public SalesTeam? SalesTeam { get; set; }

    public Customer? Customer { get; set; }

    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
