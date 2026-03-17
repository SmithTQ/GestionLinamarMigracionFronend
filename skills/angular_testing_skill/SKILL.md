# angular_testing_skill

Description
Defines testing practices for Angular components, services, and stores.

Trigger Conditions
- New feature or refactor.
- Adding or changing critical logic.

Implementation Instructions
- Use Angular TestBed for component testing.
- Test stores and services with isolated unit tests.
- Mock API calls and repositories.

Code Examples
```ts
it('should expose users', () => {
  const store = new UsersStore();
  store.setUsers([{ id: '1', name: 'A' }]);
  expect(store.users().length).toBe(1);
});
```

Best Practices
- Keep tests small and deterministic.
- Test behavior, not implementation details.

Anti-Patterns To Avoid
- Snapshot tests for complex UI without assertions.
- End-to-end tests for simple logic.
