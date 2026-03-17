# angular_reactive_forms_skill

Description
Implements reactive forms with strong typing and validation.

Trigger Conditions
- Any form creation or update.

Implementation Instructions
- Use `FormBuilder` and typed `FormGroup`.
- Use `NonNullableFormBuilder` where possible.
- Keep validation logic in the component or a dedicated validator utility.

Code Examples
```ts
readonly form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  isActive: [true],
});
```

Best Practices
- Use `updateOn: 'blur'` for heavy validation.
- Keep form mapping in a single method.

Anti-Patterns To Avoid
- Template-driven forms.
- Mutating form controls without `setValue` or `patchValue`.
