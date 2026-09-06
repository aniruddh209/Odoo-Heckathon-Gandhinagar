using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class Quotation
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string QuotationNumber { get; set; } = string.Empty;

    public int CustomerId { get; set; }

    public int SalesRepId { get; set; }

    public int? PriceListId { get; set; }

    public QuoteStatus Status { get; set; } = QuoteStatus.Draft;

    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.None;

    [Column(TypeName = "decimal(18,4)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal DiscountTotal { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal TaxTotal { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal GrandTotal { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal CostTotal { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal MarginAmount { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal MarginPercent { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RiskScore { get; set; }

    [MaxLength(10)]
    public string CurrencyCode { get; set; } = "INR";

    public DateTime? ExpectedCloseDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool IsPortalVisible { get; set; }
    public int Version { get; set; } = 1;

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public Customer Customer { get; set; } = null!;

    public User SalesRep { get; set; } = null!;

    public PriceList? PriceList { get; set; }

    public ICollection<QuotationLine> Lines { get; set; } = new List<QuotationLine>();

    public ICollection<ApprovalRequest> ApprovalRequests { get; set; } = new List<ApprovalRequest>();

    public ICollection<QuotationChange> Changes { get; set; } = new List<QuotationChange>();

    public ICollection<DealHealthSnapshot> HealthSnapshots { get; set; } = new List<DealHealthSnapshot>();
}
