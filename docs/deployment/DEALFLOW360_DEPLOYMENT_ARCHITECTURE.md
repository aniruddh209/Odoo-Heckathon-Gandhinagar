# DealFlow360: Master Deployment & Infrastructure Blueprint

---

## 1. Document Control & Infrastructure Overview

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master Deployment & Infrastructure Blueprint |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **Version** | 3.0.0 (Locked Stack: React + ASP.NET Core + SQL Server) |
| **Primary References** | `DealFlow360_ASPNet_SQLServer_React_Complete_Implementation_Spec.pdf` (§1, §30, §35) |
| **Last Updated** | 2026-09-05 |

---

## 2. Infrastructure Topology

DealFlow360 is packaged as a modern, containerized three-tier system:

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Browsers                        │
│         (Internal Sales Workspace & Customer Portal)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (Port 443 / 80)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Nginx Web Server                 │
│              Static React SPA Bundle (Vite Build)           │
│        Reverse Proxy `/api/*` requests to Backend           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP (Port 5000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 ASP.NET Core Web API Service                │
│                 Kestrel High-Throughput Engine              │
│       Hosted .NET BackgroundServices & Entity Framework     │
└──────────────────────────────┬──────────────────────────────┘
                               │ TDS Protocol (Port 1433)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Microsoft SQL Server (Database)               │
│               SQL Server 2022 / Azure SQL Database          │
│        Persistent Volume Storage (MDF/LDF Databases)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Docker Compose Orchestration (`docker-compose.yml`)

The platform can be booted with a single command (`docker compose up -d`):

```yaml
version: '3.8'

services:
  # Microsoft SQL Server Database
  dealflow-db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: dealflow360-sqlserver
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=DealFlow360_SecurePass!2026
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'DealFlow360_SecurePass!2026' -C -Q 'SELECT 1' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - dealflow-net

  # ASP.NET Core Web API Backend
  dealflow-api:
    build:
      context: .
      dockerfile: src/DealFlow360.Api/Dockerfile
    container_name: dealflow360-api
    depends_on:
      dealflow-db:
        condition: service_healthy
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=dealflow-db,1433;Database=DealFlow360Db;User Id=sa;Password=DealFlow360_SecurePass!2026;TrustServerCertificate=True;MultipleActiveResultSets=true;
      - Jwt__SecretKey=DealFlow360_SuperSecret_SecurityKey_2026_AspNetCore_JWT!
      - Jwt__Issuer=DealFlow360Api
      - Jwt__Audience=DealFlow360Clients
      - Portal__BaseUrl=http://localhost:3000/portal/quote
    ports:
      - "5000:8080"
    networks:
      - dealflow-net

  # React Frontend Single Page Application
  dealflow-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: dealflow360-frontend
    depends_on:
      - dealflow-api
    ports:
      - "3000:80"
    networks:
      - dealflow-net

volumes:
  mssql-data:
    driver: local

networks:
  dealflow-net:
    driver: bridge
```

---

## 4. Multi-Stage Dockerfiles

### 4.1 Backend Dockerfile (`src/DealFlow360.Api/Dockerfile`)
```dockerfile
# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY *.sln .
COPY src/DealFlow360.Domain/*.csproj src/DealFlow360.Domain/
COPY src/DealFlow360.Application/*.csproj src/DealFlow360.Application/
COPY src/DealFlow360.Infrastructure/*.csproj src/DealFlow360.Infrastructure/
COPY src/DealFlow360.Api/*.csproj src/DealFlow360.Api/
RUN dotnet restore

COPY . .
WORKDIR /app/src/DealFlow360.Api
RUN dotnet publish -c Release -o /out

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /out .
EXPOSE 8080
ENTRYPOINT ["dotnet", "DealFlow360.Api.dll"]
```

### 4.2 Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 5. Local Developer Setup (Windows Host)

### Prerequisites
- **.NET 9/8 SDK** (`dotnet --version`)
- **Node.js 20+ & npm** (`node -v`)
- **Microsoft SQL Server** (Active LocalDB or running `MSSQLSERVER` instance)

### 1. Database Initialization
```powershell
# Apply EF Core Code-First Migrations
cd src/DealFlow360.Api
dotnet ef database update --project ../DealFlow360.Infrastructure
```

### 2. Run Backend Web API
```powershell
# Runs on https://localhost:7001 / http://localhost:5000
dotnet run --project src/DealFlow360.Api
# Swagger available at http://localhost:5000/swagger
```

### 3. Run React Frontend
```powershell
cd frontend
npm install
npm run dev
# React Vite dev server available at http://localhost:5173
```

---

## 6. Production Hardening Checklist

- [x] **Strict CORS Policy**: Restricted to configured internal domain and customer portal domain.
- [x] **Rate Limiting**: IP-based and user-based throttling (`100 req/min`) on `/api/*` endpoints.
- [x] **Health Check Endpoints**: Dedicated `/healthz` endpoint verifying SQL Server connection and background worker status.
- [x] **Zero Stack Trace Exposure**: Production environment returns RFC 7807 problem details; raw stack traces logged server-side only.
