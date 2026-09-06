using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Data;
using DealFlow360.API.DTOs.DealHealth;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IDealHealthService
{
    Task<DealHealthSummaryResponse> GetDealHealthSummaryAsync();
    Task<DealHealthActionResult> NudgeRepAsync(int quotationId, NudgeRepRequest? request, int? actingUserId = null);
    Task<DealHealthActionResult> EscalateDealAsync(int quotationId, EscalateDealRequest? request, int? actingUserId = null);
}

public class DealHealthService : IDealHealthService
{
    private readonly AppDbContext _context;
    private readonly IDealHealthEngine _dealHealthEngine;

    public DealHealthService(AppDbContext context, IDealHealthEngine dealHealthEngine)
    {
        _context = context;
        _dealHealthEngine = dealHealthEngine;
    }

    public async Task<DealHealthSummaryResponse> GetDealHealthSummaryAsync()
    {
        var activeQuotations = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.SalesRep)
            .Include(q => q.ApprovalRequests)
            .ToListAsync();

        return _dealHealthEngine.EvaluateHealth(activeQuotations);
    }
    public async Task<DealHealthActionResult> NudgeRepAsync(int quotationId, NudgeRepRequest? request, int? actingUserId = null)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.SalesRep)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        var rep = quotation.SalesRep;
        if (rep == null) throw new InvalidOperationException($"Quotation {quotation.QuotationNumber} has no assigned sales representative.");

        string message = !string.IsNullOrWhiteSpace(request?.Message)
            ? request.Message.Trim()
            : $"Manager nudge: Please follow up on Quotation {quotation.QuotationNumber} ({quotation.Customer?.Name}) — stalled deal or risk factor flagged.";

        var notification = new Notification
        {
            UserId = rep.Id,
            Title = $"Deal Health Nudge: {quotation.QuotationNumber}",
            Message = message,
            Type = "DealHealthNudge",
            RelatedEntityType = "Quotation",
            RelatedEntityId = quotation.Id,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = actingUserId,
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "DealHealthNudgeSent",
            Reason = $"Sales Manager nudged Rep '{rep.FullName}' regarding quotation {quotation.QuotationNumber}. Message: '{message}'",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new DealHealthActionResult
        {
            Success = true,
            Message = $"Nudge sent successfully to {rep.FullName}.",
            NotificationId = notification.Id,
            RecipientName = rep.FullName
        };
    }

    public async Task<DealHealthActionResult> EscalateDealAsync(int quotationId, EscalateDealRequest? request, int? actingUserId = null)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.SalesRep)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null) throw new KeyNotFoundException($"Quotation {quotationId} not found.");

        string reason = !string.IsNullOrWhiteSpace(request?.Reason)
            ? request.Reason.Trim()
            : $"Critical deal health escalation: Quote {quotation.QuotationNumber} ({quotation.Customer?.Name}, ${quotation.GrandTotal:N2}) requires immediate executive intervention.";

        // Find Admin and Sales Manager users
        var targetUsers = await _context.Users
            .Where(u => u.IsActive && (u.Role == Role.Admin || u.Role == Role.SalesManager))
            .ToListAsync();

        int? firstNotifId = null;
        foreach (var user in targetUsers)
        {
            var notif = new Notification
            {
                UserId = user.Id,
                Title = $"URGENT Escalation: {quotation.QuotationNumber}",
                Message = reason,
                Type = "DealHealthEscalation",
                RelatedEntityType = "Quotation",
                RelatedEntityId = quotation.Id,
                IsRead = false,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.Notifications.Add(notif);
            if (!firstNotifId.HasValue) firstNotifId = notif.Id;
        }

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = actingUserId,
            EntityName = "Quotation",
            EntityId = quotation.Id,
            Action = "DealHealthEscalated",
            Reason = $"Quotation {quotation.QuotationNumber} escalated to leadership. Reason: '{reason}'",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new DealHealthActionResult
        {
            Success = true,
            Message = $"Deal {quotation.QuotationNumber} successfully escalated to {targetUsers.Count} manager/admin recipient(s).",
            NotificationId = firstNotifId,
            RecipientName = "Leadership & Admin Team"
        };
    }
}
