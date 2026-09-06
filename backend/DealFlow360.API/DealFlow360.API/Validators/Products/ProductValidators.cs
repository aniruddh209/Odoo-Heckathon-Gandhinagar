using DealFlow360.API.DTOs.Products;
using FluentValidation;

namespace DealFlow360.API.Validators.Products;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    private static readonly string[] ValidProductTypes = { "OneTime", "Subscription" };

    public CreateProductRequestValidator()
    {
        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(50);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(200);

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Category is required.");

        RuleFor(x => x.ProductType)
            .NotEmpty()
            .Must(t => ValidProductTypes.Contains(t))
            .WithMessage("Product type must be OneTime or Subscription.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Base price must be >= 0.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Cost price must be >= 0.");

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("Tax rate must be between 0 and 100.");
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    private static readonly string[] ValidProductTypes = { "OneTime", "Subscription" };

    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(200);

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Category is required.");

        RuleFor(x => x.ProductType)
            .NotEmpty()
            .Must(t => ValidProductTypes.Contains(t))
            .WithMessage("Product type must be OneTime or Subscription.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Base price must be >= 0.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Cost price must be >= 0.");

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("Tax rate must be between 0 and 100.");
    }
}

public class CreateVariantRequestValidator : AbstractValidator<CreateVariantRequest>
{
    public CreateVariantRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Variant name is required.")
            .MaximumLength(200);

        RuleFor(x => x.AdditionalPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Additional price must be >= 0.");
    }
}
