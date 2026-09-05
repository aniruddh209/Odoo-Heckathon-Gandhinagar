using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DealFlow360.API.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        
        // Target SQL Server connection string for EF Core migrations
        optionsBuilder.UseSqlServer("Server=db66784.databaseasp.net; Database=db66784; User Id=db66784; Password=T!x98A=fb7G_; Encrypt=False; TrustServerCertificate=True; MultipleActiveResultSets=True;");

        return new AppDbContext(optionsBuilder.Options);
    }
}
