# OliveConnect Backend

Spring Boot 3.3.5 API with MongoDB, Spring Security (OAuth2 Resource Server), and Swagger.

## Prerequisites

- Java 21
- Maven 3.9+
- MongoDB (local or Atlas)
- Google Cloud project with OAuth2 credentials

## Quick Start

### 1. Set Environment Variables

**Windows PowerShell:**
```powershell
$env:GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Linux/macOS:**
```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 2. Start MongoDB

Local:
```bash
mongod
```

Or use MongoDB Atlas and set `MONGODB_URI` environment variable.

### 3. Build & Run

```bash
# Using the included Maven wrapper (Linux/macOS)
./mvnw spring-boot:run

# Using the included Maven (Windows)
.\apache-maven-3.9.8-bin\apache-maven-3.9.8\bin\mvn.cmd spring-boot:run
```

The API will start at `http://localhost:8081`

### 4. Verify

- Health check: `GET http://localhost:8081/api/public/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
- Actuator: `http://localhost:8081/actuator/health`

## Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:8081/login/oauth2/code/google`
     - (Add your frontend URL later)
4. Copy **Client ID** and **Client Secret** to environment variables

## Project Structure

```
src/main/java/com/oliveconnect/
├── config/         # MongoDB, Security configuration
├── controller/     # REST endpoints
├── dto/            # Data Transfer Objects
├── integration/    # External service clients
├── model/          # MongoDB @Document entities
├── notification/   # Spring Events + listeners
├── repository/     # Spring Data MongoDB repositories
├── security/       # JWT converter, Security config
└── service/        # Business logic
```

## Branching Strategy

- `main` — production-ready code
- `dev` — integration branch (default for PRs)
- `feature/*` — feature branches from `dev`

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `spring-boot-starter-web` | REST API |
| `spring-boot-starter-security` | Authentication/Authorization |
| `spring-boot-starter-data-mongodb` | MongoDB persistence |
| `spring-boot-starter-oauth2-resource-server` | JWT validation (Google OIDC) |
| `spring-boot-starter-validation` | Bean Validation (JSR-380) |
| `spring-boot-starter-actuator` | Health, metrics, monitoring |
| `springdoc-openapi-starter-webmvc-ui` | Swagger/OpenAPI docs |
| `lombok` | Boilerplate reduction |
