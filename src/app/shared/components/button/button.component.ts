import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() size: 'sm' | 'md' = 'md';
  @Output() clicked = new EventEmitter<void>();

  get buttonClass(): Record<string, boolean> {
    return {
      'btn-primary': this.variant === 'primary',
      'btn-secondary': this.variant === 'secondary',
      'btn-ghost': this.variant === 'ghost',
      'btn-outline': this.variant === 'outline',
      'btn-sm': this.size === 'sm',
      'w-full': this.fullWidth,
    };
  }

  onClick(): void {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
