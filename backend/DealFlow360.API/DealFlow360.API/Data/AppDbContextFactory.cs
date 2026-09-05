using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DealFlow360.API.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        
        // Target SQL Server connection string for EF Core migrations
        optionsBuilder.UseSqlServer("Server=localhost,1433;Database=DealFlow;User Id=SA;Password=Aniruddh18;TrustServerCertificate=True;MultipleActiveResultSets=True;");

        return new AppDbContext(optionsBuilder.Options);
    }
}
