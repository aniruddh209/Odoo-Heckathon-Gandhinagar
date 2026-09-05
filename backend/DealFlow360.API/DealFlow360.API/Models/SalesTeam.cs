using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class SalesTeam
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public int? ManagerId { get; set; }
    public User? Manager { get; set; }

    public ICollection<User> Members { get; set; } = new List<User>();
}
