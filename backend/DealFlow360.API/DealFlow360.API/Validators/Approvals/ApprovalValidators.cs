using DealFlow360.API.DTOs.Approvals;
using FluentValidation;

namespace DealFlow360.API.Validators.Approvals;

public class ApprovalActionRequestValidator : AbstractValidator<ApprovalActionRequest>
{
    private static readonly string[] ValidActions = { "Approved", "Rejected", "Returned" };

    public ApprovalActionRequestValidator()
    {
        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Action is required.")
            .Must(a => ValidActions.Contains(a))
            .WithMessage("Action must be Approved, Rejected, or Returned.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required for reject or return.")
            .When(x => x.Action == "Rejected" || x.Action == "Returned");

        RuleFor(x => x.Reason)
            .MaximumLength(1000);
    }
}
