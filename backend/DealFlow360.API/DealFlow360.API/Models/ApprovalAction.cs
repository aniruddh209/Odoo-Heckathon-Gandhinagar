using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class ApprovalAction
{
    public int Id { get; set; }

    public int ApprovalRequestId { get; set; }

    public int UserId { get; set; }

    [Required, MaxLength(50)]
    public string Action { get; set; } = string.Empty; // Approved, Rejected, Returned

    [MaxLength(1000)]
    public string? Reason { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public ApprovalRequest ApprovalRequest { get; set; } = null!;

    public User User { get; set; } = null!;
}
