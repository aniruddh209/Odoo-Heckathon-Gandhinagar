using DealFlow360.API.DTOs.Approvals;
using FluentValidation;

namespace DealFlow360.API.Validators.Approvals;

public class ApprovalActionRequestValidator : AbstractValidator<ApprovalActionRequest>
{
    private static readonly string[] ValidActions = { 
        "Approve", "Approved", 
        "Reject", "Rejected", 
        "Return", "Returned", "RequestRevision", "ReturnForRevision" 
    };

    public ApprovalActionRequestValidator()
    {
        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Action is required.")
            .Must(a => ValidActions.Contains(a))
            .WithMessage("Action must be Approve, Reject, or Return (RequestRevision).");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required for reject or return.")
            .MinimumLength(10).WithMessage("Mandatory remarks of at least 10 characters are required for rejection or return.")
            .When(x => !string.Equals(x.Action, "Approve", StringComparison.OrdinalIgnoreCase) && 
                       !string.Equals(x.Action, "Approved", StringComparison.OrdinalIgnoreCase));

        RuleFor(x => x.Reason)
            .MaximumLength(1000);
    }
}
