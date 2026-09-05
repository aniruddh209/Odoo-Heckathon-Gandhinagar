using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class ApprovalRule
{
    public int Id { get; set; }

    public ApprovalLevel Level { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal MinRisk { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal MaxRisk { get; set; }

    [Required, MaxLength(50)]
    public string RequiredRole { get; set; } = string.Empty;

    public int Sequence { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }
}
