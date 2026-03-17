# angular_performance_skill

Description
Optimizes Angular applications for runtime and bundle efficiency.

Trigger Conditions
- Performance regressions or large bundles.

Implementation Instructions
- Enforce OnPush and lazy loading.
- Use computed selectors to reduce recalculation.
- Avoid large shared dependencies.

Code Examples
```ts
readonly filtered = computed(() =>
  this.items().filter(item => item.active)
);
```

Best Practices
- Measure before optimizing.
- Use `trackBy` in `ngFor`.

Anti-Patterns To Avoid
- Global subscriptions without cleanup.
- Large feature imports in shared modules.
