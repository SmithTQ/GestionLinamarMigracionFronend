import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'search' | 'number' | 'date' = 'text';
  @Input() value = '';
  @Input() helper?: string;
  @Input() error?: string;
  @Input() size: 'sm' | 'md' = 'md';
  @Input() disabled = false;
  @Input() id = '';
  @Input() inputClass = '';
  @Output() valueChanged = new EventEmitter<string>();

  onInput(value: string): void {
    this.valueChanged.emit(value);
  }
}
