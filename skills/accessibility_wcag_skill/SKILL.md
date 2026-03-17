# accessibility_wcag_skill

Description
Ensures WCAG-compliant accessibility across UI components.

Trigger Conditions
- Any UI component or layout change.

Implementation Instructions
- Use semantic HTML elements.
- Provide ARIA attributes only when needed.
- Ensure keyboard navigation and focus visibility.

Code Examples
```html
<button type="button" aria-label="Close dialog">Close</button>
```

Best Practices
- Ensure color contrast and readable fonts.
- Provide descriptive labels for form controls.

Anti-Patterns To Avoid
- Non-semantic divs for interactive elements.
- Missing labels on inputs.
