using DealFlow360.API.DTOs.Invoices;
using DealFlow360.API.DTOs.Billing;
using DealFlow360.API.DTOs.Fulfillment;
using DealFlow360.API.DTOs.Portal;
using FluentValidation;

namespace DealFlow360.API.Validators.Operations;

public class RecordPaymentRequestValidator : AbstractValidator<RecordPaymentRequest>
{
    public RecordPaymentRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Payment amount must be > 0.");

        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required.")
            .MaximumLength(50);
    }
}

public class CreateCreditNoteRequestValidator : AbstractValidator<CreateCreditNoteRequest>
{
    public CreateCreditNoteRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Credit note amount must be > 0.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MaximumLength(500);
    }
}

public class SubscriptionChangeRequestValidator : AbstractValidator<SubscriptionChangeRequest>
{
    public SubscriptionChangeRequestValidator()
    {
        RuleFor(x => x.NewQuantity)
            .GreaterThan(0).WithMessage("NewQuantity must be > 0.");

        RuleFor(x => x.NewPlanId)
            .GreaterThan(0).WithMessage("Plan ID must be > 0.")
            .When(x => x.NewPlanId.HasValue);
    }
}

public class FulfillmentOverrideRequestValidator : AbstractValidator<FulfillmentOverrideRequest>
{
    public FulfillmentOverrideRequestValidator()
    {
        RuleFor(x => x.Allocations)
            .NotEmpty().WithMessage("Allocations are required.");

        RuleForEach(x => x.Allocations)
            .ChildRules(a =>
            {
                a.RuleFor(x => x.OrderLineId)
                    .GreaterThan(0).WithMessage("Order line is required.");

                a.RuleFor(x => x.WarehouseId)
                    .GreaterThan(0).WithMessage("Warehouse is required.");

                a.RuleFor(x => x.Quantity)
                    .GreaterThan(0).WithMessage("Allocation quantity must be > 0.");
            });
    }
}

public class PortalLoginRequestValidator : AbstractValidator<PortalLoginRequest>
{
    public PortalLoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public class CounterDiscountRequestValidator : AbstractValidator<CounterDiscountRequest>
{
    public CounterDiscountRequestValidator()
    {
        RuleFor(x => x.LineId)
            .GreaterThan(0).WithMessage("LineId is required.");

        RuleFor(x => x.ProposedDiscountPercent)
            .InclusiveBetween(0, 100).WithMessage("Proposed discount must be between 0 and 100.");
    }
}

public class LineChangeRequestValidator : AbstractValidator<LineChangeRequest>
{
    public LineChangeRequestValidator()
    {
        RuleFor(x => x.QuotationLineId)
            .GreaterThan(0).WithMessage("Quotation line is required.");

        RuleFor(x => x)
            .Must(x => x.NewQuantity.HasValue || !string.IsNullOrEmpty(x.Comment))
            .WithMessage("At least one change (quantity or comment) is required.");

        RuleFor(x => x.NewQuantity)
            .GreaterThan(0).WithMessage("Quantity must be > 0.")
            .When(x => x.NewQuantity.HasValue);
    }
}
