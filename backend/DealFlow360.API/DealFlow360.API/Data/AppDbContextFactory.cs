using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace DealFlow360.API.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        
        var basePath = Directory.GetCurrentDirectory();
        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? config.GetConnectionString("DefaultConnection")
            ?? "Data Source=localhost,1433;Initial Catalog=DealFlow360;User ID=sa;Password=Meet2007;TrustServerCertificate=True;Encrypt=False;";

        optionsBuilder.UseSqlServer(connStr);

        return new AppDbContext(optionsBuilder.Options);
    }
}
