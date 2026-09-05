using System.ComponentModel.DataAnnotations;

namespace DealFlow360.API.Models;

public class SubscriptionPlan
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string BillingFrequency { get; set; } = string.Empty; // Monthly, Quarterly, Yearly

    public int BillingIntervalMonths { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public ICollection<BillingSchedule> BillingSchedules { get; set; } = new List<BillingSchedule>();
}
