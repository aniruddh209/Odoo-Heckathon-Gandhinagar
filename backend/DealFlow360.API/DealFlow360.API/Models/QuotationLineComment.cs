using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class QuotationLineComment
{
    public int Id { get; set; }

    public int QuotationLineId { get; set; }

    public int UserId { get; set; }

    [Required, MaxLength(1000)]
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;


    // Navigation Properties
    public QuotationLine QuotationLine { get; set; } = null!;

    public User User { get; set; } = null!;
}
