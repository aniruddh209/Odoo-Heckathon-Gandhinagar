using DealFlow360.API.DTOs.Quotations;
using FluentValidation;

namespace DealFlow360.API.Validators.Quotations;

public class CreateQuotationRequestValidator : AbstractValidator<CreateQuotationRequest>
{
    public CreateQuotationRequestValidator()
    {
        RuleFor(x => x.CustomerId)
            .GreaterThan(0).WithMessage("Customer is required.");

        RuleFor(x => x.CurrencyCode)
            .NotEmpty().WithMessage("Currency code is required.")
            .MaximumLength(10);

        RuleForEach(x => x.Lines)
            .SetValidator(new AddLineRequestValidator())
            .When(x => x.Lines != null && x.Lines.Count > 0);
    }
}

public class UpdateQuotationRequestValidator : AbstractValidator<UpdateQuotationRequest>
{
    public UpdateQuotationRequestValidator()
    {
        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => x.Notes != null);
    }
}

public class AddLineRequestValidator : AbstractValidator<AddLineRequest>
{
    public AddLineRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Product is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be > 0.");

        RuleFor(x => x.DiscountPercent)
            .InclusiveBetween(0, 100).WithMessage("Discount must be between 0 and 100.");
    }
}

public class UpdateLineRequestValidator : AbstractValidator<UpdateLineRequest>
{
    public UpdateLineRequestValidator()
    {
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be > 0.");

        RuleFor(x => x.DiscountPercent)
            .InclusiveBetween(0, 100).WithMessage("Discount must be between 0 and 100.");
    }
}
