# DealFlow360 — Production Deployment & DevOps Architecture

This document provides production deployment procedures, build artifacts packaging, environment variable management, and containerization guidelines for **DealFlow360**.

---

## 1. Production Build Procedures

### 1.1 Backend Packaging (.NET 10 Web API)
Compile and publish self-contained or framework-dependent production binaries:

```powershell
# Navigate to backend directory
cd "backend\DealFlow360.API\DealFlow360.API"

# Clean prior artifacts
dotnet clean --configuration Release

# Publish release package
dotnet publish DealFlow360.API.csproj \
  --configuration Release \
  --output "./publish" \
  --self-contained false \
  --runtime win-x64
```

The published output directory (`./publish`) contains:
- `DealFlow360.API.dll` (Core application assembly)
- `DealFlow360.API.exe` (Executable wrapper)
- `appsettings.json` & `appsettings.Production.json`
- All required NuGet dependencies and native libraries

---

### 1.2 Frontend Compilation (React 19 / Vite)
Compile and bundle optimized static HTML/CSS/JS client assets:

```powershell
# Navigate to frontend directory
cd "frontend"

# Install production dependencies
npm ci

# Run oxlint quality check
npm run lint

# Compile and bundle
npm run build
```

The compiled output directory (`frontend/dist`) contains:
- `index.html` (Single page entry point)
- `assets/` (Minified JavaScript bundles, compiled Tailwind CSS v4 stylesheets, and SVG assets)

---

## 2. Production Environment Configuration

In a production environment, never hardcode credentials in JSON configuration files. Use environment variables or enterprise secret vaults (e.g. Azure Key Vault, AWS Secrets Manager, HashiCorp Vault).

### Key Production Variables:

```bash
# ------------------------------------------------------------------------------
# HOSTING & ENVIRONMENT
# ------------------------------------------------------------------------------
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:5042

# ------------------------------------------------------------------------------
# DATABASE CONNECTION
# ------------------------------------------------------------------------------
# Production SQL Server connection string with encrypted transport
ConnectionStrings__DefaultConnection="Server=sql.internal.dealflow360.com,1433;Database=DealFlow360_Prod;User Id=df360_app_user;Password=<STRONG_VAULT_PASSWORD>;Encrypt=True;TrustServerCertificate=False;MultipleActiveResultSets=True;Connection Timeout=30;"

# Disable in-memory fallback
UseInMemoryDatabase=false

# ------------------------------------------------------------------------------
# CRYPTOGRAPHIC SECURITY
# ------------------------------------------------------------------------------
# High-entropy secret key for HS256 JWT access tokens (minimum 64 characters)
Jwt__SecretKey="<ENTERPRISE_HIGH_ENTROPY_CRYPTOGRAPHIC_SECRET_KEY_AT_LEAST_64_CHARS>"
Jwt__Issuer="DealFlow360API"
Jwt__Audience="DealFlow360App"
Jwt__ExpiryMinutes=120
```

---

## 3. Containerization Architecture (Docker & Compose)

### 3.1 Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["DealFlow360.API/DealFlow360.API.csproj", "DealFlow360.API/"]
RUN dotnet restore "DealFlow360.API/DealFlow360.API.csproj"
COPY . .
WORKDIR "/src/DealFlow360.API"
RUN dotnet build "DealFlow360.API.csproj" -c Release -o /app/build
RUN dotnet publish "DealFlow360.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5042
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "DealFlow360.API.dll"]
```

### 3.2 Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Nginx Serving Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.3 Nginx Reverse Proxy Configuration (`frontend/nginx.conf`)
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://backend:5042/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. Production Hardening & Pre-Flight Checklist

Before launching DealFlow360 in a production environment, verify:

- [ ] **SQL Server Transport Encryption:** `Encrypt=True` configured on connection string with a valid TLS certificate.
- [ ] **Database Backup Schedule:** Automated daily full backups and transactional log backups enabled.
- [ ] **JWT Secret Strength:** Replace the default development secret with a cryptographically generated 256-bit or 512-bit string.
- [ ] **HTTPS Enforcement:** Reverse proxy (Nginx, IIS, Cloudflare) terminates TLS with modern cipher suites (TLS 1.2 / TLS 1.3).
- [ ] **CORS Restrictions:** Modify `Program.cs` CORS policy from `AllowAnyOrigin()` to explicit production host domains (`https://app.dealflow360.com`).
- [ ] **QuestPDF License Compliance:** Verify organizational eligibility for QuestPDF Community or Enterprise license.
- [ ] **Rate Limiting:** Enable rate limiting at the API gateway / reverse proxy level for `/api/auth/login` and `/api/portal/*`.
