using System.ComponentModel.DataAnnotations;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class ApprovalRequest
{
    public int Id { get; set; }

    public int QuotationId { get; set; }

    public ApprovalLevel Level { get; set; }

    public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;

    public int Sequence { get; set; }

    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? ActedAtUtc { get; set; }

    public int? ActedByUserId { get; set; }

    [MaxLength(1000)]
    public string? Reason { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public Quotation Quotation { get; set; } = null!;

    public User? ActedBy { get; set; }

    public ICollection<ApprovalAction> Actions { get; set; } = new List<ApprovalAction>();
}
