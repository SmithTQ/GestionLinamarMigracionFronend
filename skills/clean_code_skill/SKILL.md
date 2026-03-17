# clean_code_skill

Description
Enforces clean code, SOLID, and DRY principles across the codebase.

Trigger Conditions
- Any code change or review.

Implementation Instructions
- Keep functions small and single-purpose.
- Extract reusable logic into utilities or services.
- Enforce clear naming and typing.

Code Examples
```ts
function mapUserDto(dto: UserDto): User {
  return { id: dto.id, name: dto.name };
}
```

Best Practices
- Use guard clauses.
- Keep classes focused.

Anti-Patterns To Avoid
- God components or services.
- Implicit dependencies.
