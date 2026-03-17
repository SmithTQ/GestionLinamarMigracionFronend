# angular_api_integration_skill

Description
Connects to backend APIs using typed clients and repositories.

Trigger Conditions
- Adding new API endpoints or integrations.

Implementation Instructions
- Create API client services in `infrastructure/api-clients`.
- Create repository services in `infrastructure/repositories`.
- Map DTOs to internal models.

Code Examples
```ts
@Injectable({ providedIn: 'root' })
export class UsersApiClient {
  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>('/api/users');
  }
}
```

Best Practices
- Centralize error handling.
- Keep API DTOs separate from domain models.

Anti-Patterns To Avoid
- HTTP calls in components.
- Reusing DTOs as UI models.
