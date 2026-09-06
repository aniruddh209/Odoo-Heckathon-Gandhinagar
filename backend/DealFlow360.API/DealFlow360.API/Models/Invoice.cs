using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class Invoice
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    public int OrderId { get; set; }

    public int CustomerId { get; set; }

    [Required, MaxLength(20)]
    public string Type { get; set; } = "OneTime"; // OneTime, Recurring

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

    [Column(TypeName = "decimal(18,4)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal TaxTotal { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Total { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PaidAmount { get; set; }

    public DateTime DueDate { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public Order Order { get; set; } = null!;

    public Customer Customer { get; set; } = null!;

    public ICollection<InvoiceLine> Lines { get; set; } = new List<InvoiceLine>();

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public ICollection<CreditNote> CreditNotes { get; set; } = new List<CreditNote>();
}
