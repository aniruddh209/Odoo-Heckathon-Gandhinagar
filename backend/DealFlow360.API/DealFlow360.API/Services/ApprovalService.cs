using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Approvals;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IApprovalService
{
    Task<List<ApprovalQueueResponse>> GetPendingApprovalsAsync(ApprovalLevel? level = null);
    Task<ApprovalDetailResponse> GetApprovalByIdAsync(int id);
    Task<ApprovalDetailResponse> ActionApprovalAsync(int approvalRequestId, ApprovalActionRequest request, int actingUserId);
    Task<ApprovalDetailResponse> ActionQuotationApprovalAsync(int quotationId, ApprovalActionRequest request, int actingUserId);
}

public class ApprovalService : IApprovalService
{
    private readonly AppDbContext _context;
    private readonly IApprovalRoutingEngine _routingEngine;
    private readonly INotificationService _notificationService;

    public ApprovalService(
        AppDbContext context,
        IApprovalRoutingEngine routingEngine,
        INotificationService notificationService)
    {
        _context = context;
        _routingEngine = routingEngine;
        _notificationService = notificationService;
    }

    public async Task<List<ApprovalQueueResponse>> GetPendingApprovalsAsync(ApprovalLevel? level = null)
    {
        var query = _context.ApprovalRequests
            .Include(ar => ar.Quotation).ThenInclude(q => q.Customer)
            .Include(ar => ar.Quotation).ThenInclude(q => q.SalesRep)
            .Where(ar => ar.Status == ApprovalStatus.Pending);

        if (level.HasValue)
        {
            query = query.Where(ar => ar.Level == level.Value);
        }

        return await query
            .OrderBy(ar => ar.RequestedAtUtc)
            .Select(ar => new ApprovalQueueResponse
            {
                Id = ar.Id,
                QuotationId = ar.QuotationId,
                QuotationNumber = ar.Quotation.QuotationNumber,
                CustomerName = ar.Quotation.Customer.Name,
                SalesRepName = ar.Quotation.SalesRep.FullName,
                Level = ar.Level.ToString(),
                Status = ar.Status.ToString(),
                GrandTotal = ar.Quotation.GrandTotal,
                RiskScore = ar.Quotation.RiskScore,
                RequestedAtUtc = ar.RequestedAtUtc,
                Reason = ar.Reason
            })
            .ToListAsync();
    }

    public async Task<ApprovalDetailResponse> GetApprovalByIdAsync(int id)
    {
        var ar = await _context.ApprovalRequests
            .Include(a => a.Quotation).ThenInclude(q => q.Customer)
            .Include(a => a.Quotation).ThenInclude(q => q.SalesRep)
            .Include(a => a.Actions).ThenInclude(act => act.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (ar == null) throw new KeyNotFoundException($"Approval request {id} not found.");

        return new ApprovalDetailResponse
        {
            Id = ar.Id,
            QuotationId = ar.QuotationId,
            QuotationNumber = ar.Quotation.QuotationNumber,
            CustomerName = ar.Quotation.Customer.Name,
            SalesRepName = ar.Quotation.SalesRep.FullName,
            Level = ar.Level.ToString(),
            Status = ar.Status.ToString(),
            GrandTotal = ar.Quotation.GrandTotal,
            RiskScore = ar.Quotation.RiskScore,
            RequestedAtUtc = ar.RequestedAtUtc,
            ActedAtUtc = ar.ActedAtUtc,
            Reason = ar.Reason,
            History = ar.Actions.Select(act => new ApprovalHistoryResponse
            {
                Id = act.Id,
                UserName = act.User?.FullName ?? string.Empty,
                Action = act.Action,
                Reason = act.Reason,
                CreatedAtUtc = act.CreatedAtUtc
            }).ToList()
        };
    }

    public async Task<ApprovalDetailResponse> ActionApprovalAsync(int approvalRequestId, ApprovalActionRequest request, int actingUserId)
    {
        var ar = await _context.ApprovalRequests
            .Include(a => a.Quotation)
            .FirstOrDefaultAsync(a => a.Id == approvalRequestId);

        if (ar == null) throw new KeyNotFoundException($"Approval request {approvalRequestId} not found.");

        if (ar.Status != ApprovalStatus.Pending)
        {
            throw new InvalidOperationException($"Approval request is already {ar.Status} and cannot be actioned again.");
        }

        var actingUser = await _context.Users.FindAsync(actingUserId);
        if (actingUser == null) throw new KeyNotFoundException($"User {actingUserId} not found.");

        ApprovalActionType actionEnum;
        var normAction = (request.Action ?? string.Empty).Trim().ToLowerInvariant();
        if (normAction == "approve" || normAction == "approved")
        {
            actionEnum = ApprovalActionType.Approve;
        }
        else if (normAction == "reject" || normAction == "rejected")
        {
            actionEnum = ApprovalActionType.Reject;
        }
        else if (normAction == "return" || normAction == "returned" || normAction == "requestrevision" || normAction == "returnforrevision")
        {
            actionEnum = ApprovalActionType.RequestRevision;
        }
        else
        {
            actionEnum = Enum.Parse<ApprovalActionType>(request.Action, true);
        }

        _routingEngine.ValidateAction(ar.Quotation, actingUser, actionEnum, request.Reason, ar.Level);

        var (nextQuoteStatus, nextApprovalStatus) = _routingEngine.DetermineNextStatus(ar.Quotation, actingUser, actionEnum, ar.Level);

        ar.Status = nextApprovalStatus;
        ar.ActedAtUtc = DateTime.UtcNow;
        ar.ActedByUserId = actingUserId;

        ar.Quotation.Status = nextQuoteStatus;
        ar.Quotation.ApprovalStatus = nextApprovalStatus;
        ar.Quotation.UpdatedAtUtc = DateTime.UtcNow;

        var actionRecord = new ApprovalAction
        {
            ApprovalRequestId = ar.Id,
            UserId = actingUserId,
            Action = request.Action,
            Reason = request.Reason,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ApprovalActions.Add(actionRecord);

        var auditLog = new AuditLog
        {
            UserId = actingUserId,
            EntityName = "Quotation",
            EntityId = ar.QuotationId,
            Action = $"Approval_{actionEnum}_{ar.Level}",
            Reason = request.Reason ?? $"{actionEnum} by {actingUser.FullName} ({actingUser.Role})",
            CreatedAtUtc = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        _context.ApprovalRequests.Update(ar);
        _context.Quotations.Update(ar.Quotation);

        // If Manager approved but risk warrants Finance escalation, automatically queue sequential stage
        if (nextApprovalStatus == ApprovalStatus.ManagerApproved)
        {
            var nextApprovalRequest = new ApprovalRequest
            {
                QuotationId = ar.QuotationId,
                Level = ApprovalLevel.Finance,
                Status = ApprovalStatus.Pending,
                Sequence = ar.Sequence + 1,
                RequestedAtUtc = DateTime.UtcNow,
                Reason = $"Escalated to Finance following Manager approval (Risk Score: {ar.Quotation.RiskScore:F2})"
            };
            _context.ApprovalRequests.Add(nextApprovalRequest);
        }

        await _context.SaveChangesAsync();

        // Notify sales rep
        await _notificationService.SendNotificationAsync(
            ar.Quotation.SalesRepId,
            $"Quotation {ar.Quotation.QuotationNumber} Actioned",
            $"Your quotation has been {request.Action.ToLower()}ed by {actingUser.FullName}.",
            "ApprovalUpdate",
            "Quotation",
            0);

        return await GetApprovalByIdAsync(approvalRequestId);
    }

    public async Task<ApprovalDetailResponse> ActionQuotationApprovalAsync(int quotationId, ApprovalActionRequest request, int actingUserId)
    {
        var ar = await _context.ApprovalRequests
            .Include(a => a.Quotation)
            .Where(a => a.QuotationId == quotationId && a.Status == ApprovalStatus.Pending)
            .OrderByDescending(a => a.Sequence)
            .FirstOrDefaultAsync();

        if (ar == null)
        {
            throw new InvalidOperationException($"No pending approval request found for quotation {quotationId}.");
        }

        return await ActionApprovalAsync(ar.Id, request, actingUserId);
    }
}

