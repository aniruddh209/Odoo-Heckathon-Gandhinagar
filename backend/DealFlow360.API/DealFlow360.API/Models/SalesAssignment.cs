using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class SalesAssignment
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public int SalesRepresentativeId { get; set; }

    public int? ProductId { get; set; }

    public int? CategoryId { get; set; }

    public int? CustomerId { get; set; }

    public bool IsDefault { get; set; } = false;

    public int Priority { get; set; } = 0;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    // Navigation Properties
    public Company Company { get; set; } = null!;

    public User SalesRepresentative { get; set; } = null!;

    public Product? Product { get; set; }

    public ProductCategory? Category { get; set; }

    public Customer? Customer { get; set; }
}
