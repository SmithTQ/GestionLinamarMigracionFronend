---
name: ng18-feature-slice
description: Create a new Angular 18 feature slice using standalone components, feature routes, services, and signal-based state. Use when adding new screens or business areas.
---

# Ng18 Feature Slice

## Workflow

1. Create feature folder under `src/app/<feature>`.
2. Add standalone components and route configuration.
3. Create feature service for API calls and domain logic.
4. Add a lightweight store using `signal` for view state.
5. Connect routes in `app.routes.ts` and protect with guards if needed.
6. Update UI with Tailwind + DaisyUI classes.

## Guardrails

- Keep components standalone and focused on UI.
- Keep business logic in services.
- Keep API base in the shared config.

## Files

- `src/app/<feature>/*`
- `src/app/app.routes.ts`
