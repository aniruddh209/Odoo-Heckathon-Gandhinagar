using System.ComponentModel.DataAnnotations;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class SalesConnectionRequest
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string RequestNumber { get; set; } = string.Empty;

    public int CustomerId { get; set; }

    public int CompanyId { get; set; }

    public int ProductId { get; set; }

    public int SalesRepresentativeId { get; set; }

    public SalesConnectionStatus Status { get; set; } = SalesConnectionStatus.Pending;

    public int RequestedQuantity { get; set; } = 1;

    [MaxLength(1500)]
    public string? CustomerMessage { get; set; }

    [MaxLength(50)]
    public string? PreferredContactMethod { get; set; }

    [MaxLength(255)]
    public string? ResolutionReason { get; set; }

    public int? QuotationId { get; set; }

    [MaxLength(1500)]
    public string? RepNotes { get; set; }

    [MaxLength(500)]
    public string? RejectionReason { get; set; }

    public DateTime? AcceptedAtUtc { get; set; }

    public DateTime? ContactedAtUtc { get; set; }

    public DateTime? QualifiedAtUtc { get; set; }

    public DateTime? QuoteCreatedAtUtc { get; set; }

    public DateTime? ClosedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    // Navigation Properties
    public Customer Customer { get; set; } = null!;

    public Company Company { get; set; } = null!;

    public Product Product { get; set; } = null!;

    public User SalesRepresentative { get; set; } = null!;

    public Quotation? Quotation { get; set; }
}
