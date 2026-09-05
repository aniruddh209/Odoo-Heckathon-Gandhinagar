using System.Text;
using DealFlow360.API.Data;
using DealFlow360.API.Middleware;
using DealFlow360.API.Services;
using DealFlow360.API.Services.Engines;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

namespace DealFlow360.API;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // ─── Database Context ──────────────────────────────────
        var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase", false);
        var connStr = builder.Configuration.GetConnectionString("DefaultConnection");

        builder.Services.AddDbContext<AppDbContext>(options =>
        {
            if (useInMemory || string.IsNullOrEmpty(connStr))
            {
                options.UseInMemoryDatabase("DealFlow360Db");
            }
            else
            {
                options.UseSqlServer(connStr, sqlOptions => sqlOptions.EnableRetryOnFailure());
            }
        });

        // ─── Controllers & Validators ────────────────────────
        builder.Services.AddControllers();
        builder.Services.AddValidatorsFromAssemblyContaining<Program>();

        // ─── CORS ──────────────────────────────────────────────
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowReact", policy =>
            {
                policy
                    .AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        // ─── JWT Authentication ────────────────────────────────
        var secretKey = builder.Configuration["Jwt:SecretKey"] ?? "DealFlow360SuperSecretMasterKeyThatIsAtLeast32BytesLongForHS256Encryption!";
        var issuer = builder.Configuration["Jwt:Issuer"] ?? "DealFlow360API";
        var audience = builder.Configuration["Jwt:Audience"] ?? "DealFlow360App";

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        // ─── Authorization Policies ─────────────────────────────
        builder.Services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
            options.AddPolicy("RequireSalesRep", policy => policy.RequireRole("SalesRep", "SalesManager", "Admin"));
            options.AddPolicy("RequireSalesManager", policy => policy.RequireRole("SalesManager", "Admin"));
            options.AddPolicy("RequireFinance", policy => policy.RequireRole("FinanceOperations", "Admin"));
            options.AddPolicy("RequireCustomer", policy => policy.RequireRole("Customer", "Admin"));
        });

        // ─── OpenAPI / Scalar ──────────────────────────────────
        builder.Services.AddOpenApi();

        // ─── Register 13 Core Domain Engines ───────────────────
        builder.Services.AddScoped<IDiscountGovernanceEngine, DiscountGovernanceEngine>();
        builder.Services.AddScoped<IBlendedDiscountRiskEngine, BlendedDiscountRiskEngine>();
        builder.Services.AddScoped<IApprovalRoutingEngine, ApprovalRoutingEngine>();
        builder.Services.AddScoped<IMarginCalculationEngine, MarginCalculationEngine>();
        builder.Services.AddScoped<IUpsellCrossSellEngine, UpsellCrossSellEngine>();
        builder.Services.AddScoped<IWarehouseAllocationEngine, WarehouseAllocationEngine>();
        builder.Services.AddScoped<IFulfillmentEngine, FulfillmentEngine>();
        builder.Services.AddScoped<IBackorderConsolidationEngine, BackorderConsolidationEngine>();
        builder.Services.AddScoped<IHybridBillingEngine, HybridBillingEngine>();
        builder.Services.AddScoped<ISubscriptionEngine, SubscriptionEngine>();
        builder.Services.AddScoped<ICustomerNegotiationEngine, CustomerNegotiationEngine>();
        builder.Services.AddScoped<IDealHealthEngine, DealHealthEngine>();

        // ─── Register Application Services ────────────────────
        builder.Services.AddScoped<IJwtService, JwtService>();
        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<INotificationService, NotificationService>();
        builder.Services.AddScoped<IAdminService, AdminService>();
        builder.Services.AddScoped<ICustomerService, CustomerService>();
        builder.Services.AddScoped<IQuotationService, QuotationService>();
        builder.Services.AddScoped<IApprovalService, ApprovalService>();
        builder.Services.AddScoped<IFulfillmentService, FulfillmentService>();
        builder.Services.AddScoped<IBillingService, BillingService>();
        builder.Services.AddScoped<IPortalService, PortalService>();
        builder.Services.AddScoped<IDealHealthService, DealHealthService>();
        builder.Services.AddScoped<IDashboardReportService, DashboardReportService>();

        // ─── Build Application ─────────────────────────────────
        var app = builder.Build();

        // ─── Seed Database On Startup ───────────────────────────
        using (var scope = app.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            try
            {
                DbInitializer.SeedAsync(dbContext).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogWarning(ex, "Could not complete database initialization/seeding.");
            }
        }

        // ─── Custom Middlewares ─────────────────────────────────
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseMiddleware<ConcurrencyMiddleware>();

        if (app.Environment.IsDevelopment())
        {
            app.MapScalarApiReference();
            app.MapOpenApi();
        }

        app.UseHttpsRedirection();
        app.UseCors("AllowReact");

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        app.Run();
    }
}