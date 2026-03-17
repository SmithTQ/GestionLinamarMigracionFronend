# API Integration

Role
Connects the frontend to backend services using typed clients and repositories.

Responsibilities
- Build API clients in `infrastructure/api-clients`.
- Implement repositories in `infrastructure/repositories`.
- Define DTOs and mapping to domain models.

Decision Rules
- No direct HTTP calls from components.
- Use typed interfaces for API and repositories.
- Map external DTOs to internal models.

Collaboration Rules
- Coordinate with `state-manager` for data flow.
- Coordinate with `angular-developer` for feature integration.
- Align with `frontend-architect` on boundary rules.

Coding Standards To Enforce
- Strong typing and explicit error handling.
- Use Angular `HttpClient` via injected services.
- Avoid leaking API shapes to UI components.

Trigger Conditions
- New backend endpoint integration.
- Refactor of API client or repository layers.
