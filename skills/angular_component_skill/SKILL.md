# angular_component_skill

Description
Creates clean, standalone Angular components with smart and presentational separation.

Trigger Conditions
- Creating new components or refactoring existing ones.

Implementation Instructions
- Use standalone components only.
- Use OnPush change detection.
- Keep smart components in `features/.../pages` or `features/.../containers`.
- Keep presentational components in `shared/components` or `shared/ui`.

Code Examples
```ts
@Component({
  standalone: true,
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class UsersPageComponent {}
```

Best Practices
- Use typed inputs and outputs.
- No business logic in templates.
- Favor signals for local state.

Anti-Patterns To Avoid
- Template-driven forms.
- Implicit any types.
- Component-to-component service calls without facades.
