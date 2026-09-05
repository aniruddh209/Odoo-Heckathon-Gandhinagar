using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class Customer
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    public int TierId { get; set; }

    [Required, MaxLength(10)]
    public string CurrencyCode { get; set; } = "INR";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public int? AssignedSalesRepId { get; set; }


    // Navigation Properties
    public CustomerTier Tier { get; set; } = null!;

    public User? AssignedSalesRep { get; set; }

    public ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
