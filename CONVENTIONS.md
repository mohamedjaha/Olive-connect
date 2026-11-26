\# OliveConnect — Coding Conventions



\*\*Version:\*\* 1.0  

\*\*Team:\*\* Jahha, Sof, Fedi  

\*\*Milestone:\*\* 0 — Kickoff \& Setup  

\*\*Status:\*\* Pending team approval



\## 1. Technology Stack



\- Java 21

\- Spring Boot 3.3.5

\- Maven

\- MongoDB and Spring Data MongoDB

\- Spring Security and Google OAuth2 / OIDC

\- Springdoc OpenAPI 2.6.0

\- React and Tailwind CSS

\- Mapbox



\## 2. Java Coding Conventions



| Element | Convention | Example |

|---|---|---|

| Class | PascalCase | VergerService |

| Interface | PascalCase | VergerRepository |

| Method | camelCase | findByProprietaireId |

| Variable | camelCase | dateRecolte |

| Constant | UPPER\_SNAKE\_CASE | MAX\_CAPACITY |

| Package | lowercase | repository |

| Enum value | UPPER\_SNAKE\_CASE | EN\_COURS |



\- Use four spaces for indentation.

\- Use meaningful and descriptive names.

\- Avoid unnecessary abbreviations.

\- Prefer constructor-based dependency injection.

\- Remove unused imports.

\- Use UTF-8 encoding.



\## 3. Backend Architecture



The backend follows a layered architecture:



\- `controller/`: REST API endpoints.

\- `service/`: business logic.

\- `repository/`: database access.

\- `model/`: domain objects.

\- `dto/`: request and response objects.

\- `security/`: authentication and authorization.

\- `notification/`: application events and notifications.

\- `integration/`: external data imports.

\- `config/`: application configuration.



Controllers delegate business operations to services. Services use repositories to access MongoDB.



\## 4. MongoDB Conventions



\- Database name: `oliveconnect`.

\- Collection names: lowercase.

\- Multiple-word collection names: snake\_case.

\- Document fields: camelCase.

\- Document identifier: `\_id`.

\- Dates: BSON Date, stored in UTC.

\- GeoJSON coordinate order: longitude, latitude.

\- Measurement units must be documented.

\- Indexes must be justified according to query requirements.

\- Embedding and referencing decisions must be documented.



The final data model and collection schemas will be validated during Milestone 1.



\## 5. Frontend Conventions



\- React components: PascalCase.

\- Functions and variables: camelCase.

\- Use two spaces for JavaScript and JSX indentation.

\- Use reusable components.

\- Use Tailwind CSS for styling.

\- Keep API communication centralized.

\- Provide responsive and accessible interfaces.

\- Display clear validation and error messages.



\## 6. REST API Conventions



\- Base path: `/api`.

\- Resource names: lowercase and plural.

\- Data exchange format: JSON.

\- Use appropriate HTTP methods and status codes.

\- Validate incoming requests.

\- Document endpoints using Swagger/OpenAPI.

\- Enforce authorization on the backend.



Example endpoints:



\- `GET /api/vergers`

\- `POST /api/vergers`

\- `GET /api/vergers/{id}`



Final API contracts must be validated by the team.



\## 7. Git Branching Strategy



\- `main`: stable versions.

\- `dev`: integration branch.

\- `feature/\*`: new functionality.

\- `fix/\*`: bug fixes.

\- `docs/\*`: documentation.



Examples:



\- `feature/mongodb-setup`

\- `feature/swagger-config`

\- `docs/coding-conventions`



Rules:



\- Create working branches from `dev`.

\- Do not push unfinished changes directly to `main`.

\- Keep commits focused on a single purpose.

\- Use pull requests to integrate changes.

\- Review and test changes before merging.



\## 8. Commit Message Format



Use Conventional Commits:



`type(scope): description`



| Type | Purpose |

|---|---|

| feat | New functionality |

| fix | Bug correction |

| docs | Documentation |

| refactor | Code restructuring |

| test | Tests |

| chore | Maintenance |

| build | Build and dependencies |

| style | Code formatting |



Examples:



\- `docs(project): add coding conventions`

\- `chore(database): configure MongoDB connection`

\- `feat(swagger): configure OpenAPI documentation`

\- `test(database): verify MongoDB connection`

\- `fix(security): restrict unauthorized access`



Commit messages must be short, descriptive and written in English.



\## 9. Security Conventions



\- Never commit passwords, tokens or API secrets.

\- Use environment variables for sensitive configuration.

\- Maintain `.env.example` with placeholder values only.

\- Never commit actual `.env` files.

\- Validate incoming data.

\- Apply role-based authorization on the backend.

\- Do not expose private user data.



\## 10. Code Quality



\- Avoid duplicated code.

\- Write clear and maintainable code.

\- Test changes before merging.

\- Document important technical decisions.

\- Keep UML, Java models, MongoDB schemas and API contracts consistent.

\- Use fictitious data for development tests.



\## 11. Team Responsibilities



\- Jahha: Backend, business logic and security.

\- Sof: Data modeling, MongoDB, repositories and assigned backend modules.

\- Fedi: Frontend and web server deployment.



Shared technical decisions must be validated by the team.

