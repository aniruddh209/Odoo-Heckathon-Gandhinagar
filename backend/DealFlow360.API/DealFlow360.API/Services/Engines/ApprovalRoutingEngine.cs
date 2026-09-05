using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public interface IApprovalRoutingEngine
{
    void ValidateAction(Quotation quotation, User actingUser, ApprovalActionType actionType, string? reason);
    (QuoteStatus NextQuoteStatus, ApprovalStatus NextApprovalStatus) DetermineNextStatus(Quotation quotation, User actingUser, ApprovalActionType actionType);
}

public enum ApprovalActionType
{
    Approve,
    Reject,
    RequestRevision
}

public class ApprovalRoutingEngine : IApprovalRoutingEngine
{
    public void ValidateAction(Quotation quotation, User actingUser, ApprovalActionType actionType, string? reason)
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
    }

    public (QuoteStatus NextQuoteStatus, ApprovalStatus NextApprovalStatus) DetermineNextStatus(Quotation quotation, User actingUser, ApprovalActionType actionType)
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
        if (actingUser.Role == Role.FinanceOperations || actingUser.Role == Role.Admin)
        {
            return (QuoteStatus.Approved, ApprovalStatus.Approved);
        }

        if (actingUser.Role == Role.SalesManager)
        {
            if (quotation.RiskScore >= 70.00m)
            {
                return (QuoteStatus.PendingApproval, ApprovalStatus.ManagerApproved); // Needs Finance approval next
            }
            return (QuoteStatus.Approved, ApprovalStatus.Approved);
        }

        throw new UnauthorizedAccessException("User does not have required permissions to approve this quotation.");
    }
}
