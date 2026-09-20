import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: 'form[appFocusInvalid]',
  standalone: true,
})
export class FocusInvalidDirective {
  private readonly elementRef = inject(ElementRef<HTMLFormElement>);

  @HostListener('submit')
  onSubmit(): void {
    setTimeout(() => {
      const invalidControl = this.elementRef.nativeElement.querySelector(
        '.ng-invalid:not(form)',
      ) as HTMLElement | null;
      if (!invalidControl) return;
      invalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      invalidControl.focus({ preventScroll: true });
    });
  }
}
