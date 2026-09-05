using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DealFlow360.API.Models;

public class CreditNote
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }

    public int? OrderLineId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required, MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public Invoice Invoice { get; set; } = null!;

    public OrderLine? OrderLine { get; set; }
}
