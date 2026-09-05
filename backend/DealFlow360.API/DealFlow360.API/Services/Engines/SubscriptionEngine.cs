using DealFlow360.API.Models;

namespace DealFlow360.API.Services.Engines;

public interface ISubscriptionEngine
{
    decimal CalculateProratedCharge(BillingSchedule schedule, int addedSeats, DateTime changeDateUtc);
    void ApplySeatChange(BillingSchedule schedule, int newTotalSeats, DateTime changeDateUtc);
}

public class SubscriptionEngine : ISubscriptionEngine
{
    public decimal CalculateProratedCharge(BillingSchedule schedule, int addedSeats, DateTime changeDateUtc)
    {
        if (addedSeats <= 0) return 0m;

        var daysInMonth = DateTime.DaysInMonth(changeDateUtc.Year, changeDateUtc.Month);
        var remainingDays = Math.Max(0, daysInMonth - changeDateUtc.Day + 1);

        var monthlyUnitRate = schedule.UnitPrice;
        var dailyRatePerSeat = monthlyUnitRate / daysInMonth;

        var proratedCharge = dailyRatePerSeat * addedSeats * remainingDays;
        return proratedCharge;
    }

    public void ApplySeatChange(BillingSchedule schedule, int newTotalSeats, DateTime changeDateUtc)
    {
        if (newTotalSeats <= 0)
        {
            throw new ArgumentException("Total seats must be greater than zero.");
        }

        schedule.Quantity = newTotalSeats;
        schedule.UpdatedAtUtc = DateTime.UtcNow;
    }
}
