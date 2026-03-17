# angular_state_management_skill

Description
Creates signal-based stores and facades for feature state.

Trigger Conditions
- New feature requiring shared or complex state.

Implementation Instructions
- Stores live in `state/stores` or feature `state` folders.
- Expose a facade service for components.
- Use computed selectors for derived state.

Code Examples
```ts
export class UsersStore {
  private readonly _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();
  readonly hasUsers = computed(() => this._users().length > 0);
}
```

Best Practices
- Keep stores free of UI concerns.
- Normalize collections when necessary.

Anti-Patterns To Avoid
- Direct store mutations in components.
- Storing transient UI state in global stores.
