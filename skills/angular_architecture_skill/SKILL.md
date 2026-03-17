# angular_architecture_skill

Description
Defines feature-based architecture and clean boundaries for Angular 18 applications.

Trigger Conditions
- Creating or refactoring feature modules.
- Adding cross-cutting concerns in `core`, `shared`, or `infrastructure`.

Implementation Instructions
- Keep `core` for app-wide services, config, interceptors, and guards.
- Keep `shared` for reusable UI, directives, pipes, and common utilities.
- Keep `features` for lazy-loaded domains only.
- Keep `state` for signal stores and selectors.
- Keep `infrastructure` for API clients and repositories.

Code Examples
```ts
// Feature route definition (standalone)
export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users-page.component').then(m => m.UsersPageComponent),
  },
];
```

Best Practices
- Enforce lazy loading for all features.
- Use facades for services that cross boundaries.
- Keep the domain model in `core/models`.

Anti-Patterns To Avoid
- Direct HTTP calls from components.
- Shared state outside signal stores.
- Feature code leaking into `shared`.
