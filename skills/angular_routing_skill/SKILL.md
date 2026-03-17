# angular_routing_skill

Description
Defines lazy-loaded, feature-based routing with standalone components.

Trigger Conditions
- Adding or modifying routes.

Implementation Instructions
- Use `loadComponent` or `loadChildren` for lazy loading.
- Keep feature routes in feature folders.
- Use guards in `core/guards`.

Code Examples
```ts
export const APP_ROUTES: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES),
  },
];
```

Best Practices
- Keep route config minimal.
- Use route data for titles and breadcrumbs.

Anti-Patterns To Avoid
- Eagerly loading feature routes.
- Deeply nested routing in a single file.
