---
name: ng18-project-setup
description: Bootstrap or adjust Angular 18 project configuration (standalone, routing, HttpClient), Tailwind + DaisyUI, global styles, and environment/API base. Use when creating the frontend, adding Tailwind/DaisyUI, or updating build config.
---

# Ng18 Project Setup

## Workflow

1. Create or verify the Angular 18 app with standalone components and routing enabled.
2. Install Tailwind CSS, PostCSS, Autoprefixer, and DaisyUI.
3. Configure `tailwind.config.js` with `content` paths and DaisyUI theme.
4. Add Tailwind directives and typography in `src/styles.css`.
5. Add `postcss.config.js` and verify Angular builds use it.
6. Set `API_BASE_URL` in a central config file.
7. Ensure `provideHttpClient` and router are wired in `app.config.ts`.

## Guardrails

- Keep build configuration minimal and deterministic.
- Prefer a single API base constant for all services.
- Do not hardcode environment secrets in the frontend.

## Files

- `tailwind.config.js`
- `postcss.config.js`
- `src/styles.css`
- `src/app/app.config.ts`
- `src/app/core/config/api.config.ts`
