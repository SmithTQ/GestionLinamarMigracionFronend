import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass, NgIf, IconComponent],
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
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() iconSize = 18;
  @Input() iconOnly = false;
  @Input() ariaLabel?: string;
  @Input() extraClass = '';
  @Output() clicked = new EventEmitter<void>();

  get buttonClass(): Record<string, boolean> {
    return {
      'btn-primary': this.variant === 'primary',
      'btn-secondary': this.variant === 'secondary',
      'btn-ghost': this.variant === 'ghost',
      'btn-outline': this.variant === 'outline',
      'btn-sm': this.size === 'sm',
      'w-full': this.fullWidth,
      'btn-square': this.iconOnly,
      'gap-2': !!this.icon,
    };
  }

  onClick(): void {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
