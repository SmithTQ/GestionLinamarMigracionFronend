import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appDebounceClick]',
  standalone: true,
})
export class DebounceClickDirective {
  @Input() debounceTime = 300;
  @Output() debounceClick = new EventEmitter<Event>();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.debounceClick.emit(event);
      this.timeoutId = null;
    }, this.debounceTime);
  }
}
