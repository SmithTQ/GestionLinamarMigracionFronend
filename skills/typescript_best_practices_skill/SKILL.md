# typescript_best_practices_skill

Description
Applies strong typing and idiomatic TypeScript patterns.

Trigger Conditions
- Any TypeScript file addition or refactor.

Implementation Instructions
- Prefer interfaces and type aliases for contracts.
- Avoid `any` and use `unknown` with type guards.
- Use `readonly` for immutable fields.

Code Examples
```ts
type UserId = string;
interface User { readonly id: UserId; name: string; }
```

Best Practices
- Use discriminated unions for state.
- Enable strict compiler options.

Anti-Patterns To Avoid
- Implicit `any`.
- Overuse of type assertions.
