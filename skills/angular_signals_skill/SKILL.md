# angular_signals_skill

Description
Implements signals-based reactivity for local and feature state.

Trigger Conditions
- Any new stateful component or store.

Implementation Instructions
- Use `signal` for local state.
- Use `computed` for derived state.
- Use `effect` for side effects only.

Code Examples
```ts
readonly isLoading = signal(false);
readonly items = signal<Item[]>([]);
readonly hasItems = computed(() => this.items().length > 0);
```

Best Practices
- Keep signals private when possible and expose readonly views.
- Avoid side effects in computed.
- Co-locate signal state near usage.

Anti-Patterns To Avoid
- RxJS Subjects as primary state containers.
- Mutating arrays or objects without `set` or `update`.
