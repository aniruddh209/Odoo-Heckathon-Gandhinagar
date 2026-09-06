namespace DealFlow360.API.DTOs.SalesTeams;

public class CreateSalesTeamRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateSalesTeamRequest
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class SalesTeamResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int MemberCount { get; set; }
}
