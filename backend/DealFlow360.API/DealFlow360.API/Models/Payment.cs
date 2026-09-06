using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DealFlow360.API.Models;

public class Payment
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Amount { get; set; }

    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? Reference { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public Invoice Invoice { get; set; } = null!;
}
