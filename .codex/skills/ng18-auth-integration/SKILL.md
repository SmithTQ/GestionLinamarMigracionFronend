---
name: ng18-auth-integration
description: Implement authentication flows in Angular 18 with signals, HttpClient, interceptors, guards, and token storage. Use when adding login, refresh, logout, or securing routes.
---

# Ng18 Auth Integration

## Workflow

1. Define auth types for request/response contracts.
2. Implement an AuthStore using `signal` for tokens and user state.
3. Implement AuthService with `login`, `refresh`, and `logout` methods.
4. Persist tokens in `localStorage` and hydrate on startup.
5. Add an Http interceptor to attach `Authorization` and refresh on 401.
6. Add an Auth guard for protected routes.
7. Wire `provideHttpClient(withInterceptors())` in `app.config.ts`.

## Guardrails

- Do not attach auth headers to login/refresh endpoints.
- Avoid infinite refresh loops; fail fast and clear session.
- Keep refresh logic single-flight to avoid concurrent refresh calls.

## Files

- `src/app/core/auth/auth.types.ts`
- `src/app/core/auth/auth.store.ts`
- `src/app/core/auth/auth.service.ts`
- `src/app/core/auth/auth.interceptor.ts`
- `src/app/core/auth/auth.guard.ts`
- `src/app/app.config.ts`
