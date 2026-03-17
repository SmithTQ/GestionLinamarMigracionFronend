# angular_ui_component_skill

Description
Builds reusable UI components with accessibility and performance in mind.

Trigger Conditions
- Creating shared UI elements.

Implementation Instructions
- Use `shared/ui` for generic components.
- Provide typed inputs and outputs.
- Include ARIA attributes when needed.

Code Examples
```ts
@Component({
  standalone: true,
  selector: 'ui-button',
  template: '<button type="button" class="btn"><ng-content /></button>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {}
```

Best Practices
- Keep UI components stateless.
- Provide clear documentation in the component header.

Anti-Patterns To Avoid
- Business logic in UI components.
- Coupling to feature-specific models.
