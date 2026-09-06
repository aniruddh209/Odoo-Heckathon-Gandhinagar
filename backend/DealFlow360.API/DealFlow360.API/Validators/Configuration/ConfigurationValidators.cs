using DealFlow360.API.DTOs.CustomerTiers;
using DealFlow360.API.DTOs.Categories;
using DealFlow360.API.DTOs.SalesTeams;
using DealFlow360.API.DTOs.SubscriptionPlans;
using DealFlow360.API.DTOs.UpsellRules;
using FluentValidation;

namespace DealFlow360.API.Validators.Configuration;

public class CreateCustomerTierRequestValidator : AbstractValidator<CreateCustomerTierRequest>
{
    public CreateCustomerTierRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tier name is required.")
            .MaximumLength(50);

        RuleFor(x => x.MaxDiscountPercent)
            .InclusiveBetween(0, 100).WithMessage("Max discount must be between 0 and 100.");
    }
}

public class UpdateCustomerTierRequestValidator : AbstractValidator<UpdateCustomerTierRequest>
{
    public UpdateCustomerTierRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tier name is required.")
            .MaximumLength(50);

        RuleFor(x => x.MaxDiscountPercent)
            .InclusiveBetween(0, 100).WithMessage("Max discount must be between 0 and 100.");
    }
}

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100);
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100);
    }
}

public class CreateSalesTeamRequestValidator : AbstractValidator<CreateSalesTeamRequest>
{
    public CreateSalesTeamRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Team name is required.")
            .MaximumLength(100);
    }
}

public class UpdateSalesTeamRequestValidator : AbstractValidator<UpdateSalesTeamRequest>
{
    public UpdateSalesTeamRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Team name is required.")
            .MaximumLength(100);
    }
}

public class CreateSubscriptionPlanRequestValidator : AbstractValidator<CreateSubscriptionPlanRequest>
{
    public CreateSubscriptionPlanRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Plan name is required.")
            .MaximumLength(100);

        RuleFor(x => x.BillingFrequency)
            .NotEmpty().WithMessage("Billing frequency is required.");

        RuleFor(x => x.BillingIntervalMonths)
            .GreaterThan(0).WithMessage("Billing interval must be > 0 months.");
    }
}

public class UpdateSubscriptionPlanRequestValidator : AbstractValidator<UpdateSubscriptionPlanRequest>
{
    public UpdateSubscriptionPlanRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Plan name is required.")
            .MaximumLength(100);

        RuleFor(x => x.BillingFrequency)
            .NotEmpty().WithMessage("Billing frequency is required.");

        RuleFor(x => x.BillingIntervalMonths)
            .GreaterThan(0).WithMessage("Billing interval must be > 0 months.");
    }
}

public class CreateUpsellRuleRequestValidator : AbstractValidator<CreateUpsellRuleRequest>
{
    public CreateUpsellRuleRequestValidator()
    {
        RuleFor(x => x.TriggerProductId)
            .GreaterThan(0).WithMessage("Trigger product is required.");

        RuleFor(x => x.SuggestedProductId)
            .GreaterThan(0).WithMessage("Suggested product is required.")
            .NotEqual(x => x.TriggerProductId).WithMessage("Suggested product must differ from trigger product.");

        RuleFor(x => x.RuleType)
            .NotEmpty()
            .Must(t => t == "CrossSell" || t == "Upsell" || t == "Promotion")
            .WithMessage("Rule type must be CrossSell, Upsell, or Promotion.");

        RuleFor(x => x.Score)
            .GreaterThanOrEqualTo(0).WithMessage("Score must be >= 0.");
    }
}

public class UpdateUpsellRuleRequestValidator : AbstractValidator<UpdateUpsellRuleRequest>
{
    public UpdateUpsellRuleRequestValidator()
    {
        RuleFor(x => x.TriggerProductId)
            .GreaterThan(0).WithMessage("Trigger product is required.");

        RuleFor(x => x.SuggestedProductId)
            .GreaterThan(0).WithMessage("Suggested product is required.")
            .NotEqual(x => x.TriggerProductId).WithMessage("Suggested product must differ from trigger product.");

        RuleFor(x => x.Score)
            .GreaterThanOrEqualTo(0).WithMessage("Score must be >= 0.");
    }
}
