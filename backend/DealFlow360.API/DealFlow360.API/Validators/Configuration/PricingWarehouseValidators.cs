using DealFlow360.API.DTOs.PriceLists;
using DealFlow360.API.DTOs.DiscountRules;
using DealFlow360.API.DTOs.ApprovalRules;
using DealFlow360.API.DTOs.Warehouses;
using FluentValidation;

namespace DealFlow360.API.Validators.Configuration;

public class CreatePriceListRequestValidator : AbstractValidator<CreatePriceListRequest>
{
    public CreatePriceListRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Price list name is required.")
            .MaximumLength(100);

        RuleFor(x => x.CurrencyCode)
            .NotEmpty().WithMessage("Currency code is required.")
            .MaximumLength(10);
    }
}

public class UpdatePriceListRequestValidator : AbstractValidator<UpdatePriceListRequest>
{
    public UpdatePriceListRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Price list name is required.")
            .MaximumLength(100);

        RuleFor(x => x.CurrencyCode)
            .NotEmpty().WithMessage("Currency code is required.")
            .MaximumLength(10);
    }
}

public class UpsertPriceListItemRequestValidator : AbstractValidator<UpsertPriceListItemRequest>
{
    public UpsertPriceListItemRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Product is required.");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price must be >= 0.");
    }
}

public class CreateDiscountRuleRequestValidator : AbstractValidator<CreateDiscountRuleRequest>
{
    public CreateDiscountRuleRequestValidator()
    {
        RuleFor(x => x.TierId)
            .GreaterThan(0).WithMessage("Customer tier is required.");

        RuleFor(x => x.MaxDiscountPercent)
            .InclusiveBetween(0, 100).WithMessage("Max discount must be between 0 and 100.");

        RuleFor(x => x.ManagerThreshold)
            .InclusiveBetween(0, 100).WithMessage("Manager threshold must be between 0 and 100.");

        RuleFor(x => x.FinanceThreshold)
            .InclusiveBetween(0, 100).WithMessage("Finance threshold must be between 0 and 100.")
            .GreaterThanOrEqualTo(x => x.ManagerThreshold)
            .WithMessage("Finance threshold must be >= manager threshold.");
    }
}

public class UpdateDiscountRuleRequestValidator : AbstractValidator<UpdateDiscountRuleRequest>
{
    public UpdateDiscountRuleRequestValidator()
    {
        RuleFor(x => x.TierId)
            .GreaterThan(0).WithMessage("Customer tier is required.");

        RuleFor(x => x.MaxDiscountPercent)
            .InclusiveBetween(0, 100).WithMessage("Max discount must be between 0 and 100.");

        RuleFor(x => x.ManagerThreshold)
            .InclusiveBetween(0, 100).WithMessage("Manager threshold must be between 0 and 100.");

        RuleFor(x => x.FinanceThreshold)
            .InclusiveBetween(0, 100).WithMessage("Finance threshold must be between 0 and 100.")
            .GreaterThanOrEqualTo(x => x.ManagerThreshold)
            .WithMessage("Finance threshold must be >= manager threshold.");
    }
}

public class CreateApprovalRuleRequestValidator : AbstractValidator<CreateApprovalRuleRequest>
{
    public CreateApprovalRuleRequestValidator()
    {
        RuleFor(x => x.Level)
            .NotEmpty()
            .Must(l => l == "Manager" || l == "Finance")
            .WithMessage("Level must be Manager or Finance.");

        RuleFor(x => x.MinRisk)
            .GreaterThanOrEqualTo(0).WithMessage("Min risk must be >= 0.");

        RuleFor(x => x.MaxRisk)
            .GreaterThanOrEqualTo(x => x.MinRisk)
            .WithMessage("Max risk must be >= min risk.");

        RuleFor(x => x.RequiredRole)
            .NotEmpty().WithMessage("Required role is required.");

        RuleFor(x => x.Sequence)
            .GreaterThan(0).WithMessage("Sequence must be > 0.");
    }
}

public class UpdateApprovalRuleRequestValidator : AbstractValidator<UpdateApprovalRuleRequest>
{
    public UpdateApprovalRuleRequestValidator()
    {
        RuleFor(x => x.Level)
            .NotEmpty()
            .Must(l => l == "Manager" || l == "Finance")
            .WithMessage("Level must be Manager or Finance.");

        RuleFor(x => x.MinRisk)
            .GreaterThanOrEqualTo(0).WithMessage("Min risk must be >= 0.");

        RuleFor(x => x.MaxRisk)
            .GreaterThanOrEqualTo(x => x.MinRisk)
            .WithMessage("Max risk must be >= min risk.");

        RuleFor(x => x.RequiredRole)
            .NotEmpty().WithMessage("Required role is required.");

        RuleFor(x => x.Sequence)
            .GreaterThan(0).WithMessage("Sequence must be > 0.");
    }
}

public class CreateWarehouseRequestValidator : AbstractValidator<CreateWarehouseRequest>
{
    public CreateWarehouseRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse name is required.")
            .MaximumLength(100);

        RuleFor(x => x.ShippingCostWeight)
            .GreaterThanOrEqualTo(0).WithMessage("Shipping cost weight must be >= 0.");
    }
}

public class UpdateWarehouseRequestValidator : AbstractValidator<UpdateWarehouseRequest>
{
    public UpdateWarehouseRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse name is required.")
            .MaximumLength(100);

        RuleFor(x => x.ShippingCostWeight)
            .GreaterThanOrEqualTo(0).WithMessage("Shipping cost weight must be >= 0.");
    }
}

public class AdjustStockRequestValidator : AbstractValidator<AdjustStockRequest>
{
    public AdjustStockRequestValidator()
    {
        RuleFor(x => x.OnHand)
            .GreaterThanOrEqualTo(0).WithMessage("On-hand quantity must be >= 0.");
    }
}
