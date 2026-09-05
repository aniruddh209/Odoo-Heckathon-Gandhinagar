using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class QuotationChange
{
    public int Id { get; set; }

    public int QuotationId { get; set; }

    [Required, MaxLength(50)]
    public string ChangeType { get; set; } = string.Empty; // Negotiation, Revision, CounterDiscount

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int RequestedByUserId { get; set; }

    public string? OldValueJson { get; set; }

    public string? NewValueJson { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public Quotation Quotation { get; set; } = null!;

    public User RequestedBy { get; set; } = null!;
}
