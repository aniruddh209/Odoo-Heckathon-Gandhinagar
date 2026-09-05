using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public interface IApprovalRoutingEngine
{
    void ValidateAction(Quotation quotation, User actingUser, ApprovalActionType actionType, string? reason, ApprovalLevel? currentLevel = null);
    (QuoteStatus NextQuoteStatus, ApprovalStatus NextApprovalStatus) DetermineNextStatus(Quotation quotation, User actingUser, ApprovalActionType actionType, ApprovalLevel? currentLevel = null);
}

public enum ApprovalActionType
{
    Approve,
    Reject,
    RequestRevision
}

public class ApprovalRoutingEngine : IApprovalRoutingEngine
{
    public void ValidateAction(Quotation quotation, User actingUser, ApprovalActionType actionType, string? reason, ApprovalLevel? currentLevel = null)
    {
        if (quotation.SalesRepId == actingUser.Id)
        {
            throw new InvalidOperationException("Sales representative cannot approve or action their own quotation.");
        }

        if (actionType == ApprovalActionType.Reject || actionType == ApprovalActionType.RequestRevision)
        {
            if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10)
            {
                throw new ArgumentException("Mandatory remarks of at least 10 characters are required for rejection or revision requests.");
            }
        }

        if (currentLevel.HasValue)
        {
            if (currentLevel.Value == ApprovalLevel.Manager)
            {
                if (actingUser.Role != Role.SalesManager && actingUser.Role != Role.Admin)
                {
                    throw new UnauthorizedAccessException("Only Sales Manager or Admin can action Manager-level approvals.");
                }
            }
            else if (currentLevel.Value == ApprovalLevel.Finance)
            {
                if (actingUser.Role != Role.FinanceOperations && actingUser.Role != Role.Admin)
                {
                    throw new UnauthorizedAccessException("Only Finance/Operations or Admin can action Finance-level approvals.");
                }
            }
        }
        else
        {
            if (actingUser.Role != Role.SalesManager && actingUser.Role != Role.FinanceOperations && actingUser.Role != Role.Admin)
            {
                throw new UnauthorizedAccessException("User does not have required permissions to action approvals.");
            }
        }
    }

    public (QuoteStatus NextQuoteStatus, ApprovalStatus NextApprovalStatus) DetermineNextStatus(Quotation quotation, User actingUser, ApprovalActionType actionType, ApprovalLevel? currentLevel = null)
    {
        if (actionType == ApprovalActionType.Reject)
        {
            return (QuoteStatus.Rejected, ApprovalStatus.Rejected);
        }

        if (actionType == ApprovalActionType.RequestRevision)
        {
            return (QuoteStatus.UnderNegotiation, ApprovalStatus.RevisionRequired);
        }

        // Approval branch
        if (currentLevel == ApprovalLevel.Finance || actingUser.Role == Role.FinanceOperations)
        {
            return (QuoteStatus.Approved, ApprovalStatus.Approved);
        }

        if (currentLevel == ApprovalLevel.Manager || actingUser.Role == Role.SalesManager)
        {
            if (quotation.RiskScore >= 70.00m)
            {
                return (QuoteStatus.PendingApproval, ApprovalStatus.ManagerApproved); // Needs Finance approval next
            }
            return (QuoteStatus.Approved, ApprovalStatus.Approved);
        }

        if (actingUser.Role == Role.Admin)
        {
            return (QuoteStatus.Approved, ApprovalStatus.Approved);
        }

        throw new UnauthorizedAccessException("User does not have required permissions to approve this quotation.");
    }
}
