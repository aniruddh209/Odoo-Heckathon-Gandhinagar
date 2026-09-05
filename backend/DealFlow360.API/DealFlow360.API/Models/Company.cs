using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class Company
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(150)]
    public string? ContactEmail { get; set; }

    [MaxLength(50)]
    public string? ContactPhone { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    // Navigation Properties
    public ICollection<Product> Products { get; set; } = new List<Product>();

    public ICollection<SalesAssignment> SalesAssignments { get; set; } = new List<SalesAssignment>();

    public ICollection<SalesConnectionRequest> ConnectionRequests { get; set; } = new List<SalesConnectionRequest>();
}
