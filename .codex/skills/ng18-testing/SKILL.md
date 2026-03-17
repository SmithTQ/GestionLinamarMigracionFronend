---
name: ng18-testing
description: Write unit tests for Angular 18 components and services with TestBed, HttpTestingController, and signal-based state. Use when adding or updating tests.
---

# Ng18 Testing

## Workflow

1. Identify critical paths and edge cases.
2. Test services with `HttpTestingController` for API calls.
3. Test components with `TestBed` and shallow rendering.
4. Mock AuthService and route guards when needed.
5. Keep tests deterministic and fast.

## Guardrails

- Avoid integration logic in unit tests.
- Mock localStorage and time-based code.

## Files

- `src/app/**/*.spec.ts`
- `src/app/core/**`
