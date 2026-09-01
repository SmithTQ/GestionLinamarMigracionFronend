import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

export interface ContextMenuOption {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [NgIf, NgFor, IconComponent],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuComponent {
  @Input() isOpen = false;
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() options: ContextMenuOption[] = [];

  @Output() actionSelected = new EventEmitter<ContextMenuOption>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('menuRef') menuRef?: ElementRef<HTMLDivElement>;

  onAction(option: ContextMenuOption): void {
    if (option.disabled) {
      return;
    }
    this.actionSelected.emit(option);
  }

  onClose(): void {
    this.closed.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) {
      return;
    }
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    const menuEl = this.menuRef?.nativeElement;
    if (menuEl && menuEl.contains(target)) {
      return;
    }
    this.onClose();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }
}
