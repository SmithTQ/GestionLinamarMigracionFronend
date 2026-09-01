import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ButtonComponent, ButtonVariant } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import {
  ContextMenuComponent,
  ContextMenuOption,
} from '@shared/components/context-menu/context-menu.component';

export type TableColumnAlign = 'left' | 'center' | 'right';
export type TableColumnType = 'text' | 'badge' | 'date' | 'currency';
export type TableSize = 'xs' | 'sm' | 'md' | 'lg';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  align?: TableColumnAlign;
  width?: string;
  type?: TableColumnType;
}

export interface TableAction {
  id: string;
  label: string;
  variant?: ButtonVariant;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    ButtonComponent,
    InputComponent,
    IconComponent,
    ContextMenuComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() columns: TableColumn[] = [];
  @Input() rows: Array<Record<string, unknown>> = [];
  @Input() actions: TableAction[] = [];
  @Input() showHeader = true;
  @Input() showFilters = true;
  @Input() showActions = true;
  @Input() showPagination = true;
  @Input() useContextMenuActions = false;
  @Input() emptyStateText = 'No hay registros disponibles.';
  @Input() sortable = true;
  @Input() size: TableSize = 'md';
  @Input() pagination?: TablePagination;
  @Input() sort?: { key: string; direction: 'asc' | 'desc' };

  @Output() actionClicked = new EventEmitter<{ action: TableAction; row: Record<string, unknown> }>();
  @Output() sortChanged = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();
  @Output() filterChanged = new EventEmitter<{ key: string; value: string }>();
  @Output() pageChanged = new EventEmitter<number>();
  @Output() pageSizeChanged = new EventEmitter<number>();

  contextMenuOpen = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuRow: Record<string, unknown> | null = null;

  get totalPages(): number {
    if (!this.pagination) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.pagination.total / this.pagination.pageSize));
  }

  trackByIndex(index: number): number {
    return index;
  }

  onSort(column: TableColumn): void {
    if (!this.sortable || !column.sortable) {
      return;
    }
    const direction =
      this.sort?.key === column.key && this.sort.direction === 'asc' ? 'desc' : 'asc';
    this.sortChanged.emit({ key: column.key, direction });
  }

  onFilter(column: TableColumn, value: string): void {
    if (!column.filterable) {
      return;
    }
    this.filterChanged.emit({ key: column.key, value });
  }

  onAction(action: TableAction, row: Record<string, unknown>): void {
    this.actionClicked.emit({ action, row });
  }

  onRowContextMenu(event: MouseEvent, row: Record<string, unknown>): void {
    if (!this.useContextMenuActions || !this.showActions || !this.actions.length) {
      return;
    }
    event.preventDefault();
    const menuWidth = 220;
    const menuHeight = Math.max(44, this.actions.length * 36 + 16);
    const maxX = Math.max(8, window.innerWidth - menuWidth - 8);
    const maxY = Math.max(8, window.innerHeight - menuHeight - 8);

    this.contextMenuPosition = {
      x: Math.min(event.clientX, maxX),
      y: Math.min(event.clientY, maxY),
    };
    this.contextMenuRow = row;
    this.contextMenuOpen = true;
  }

  closeContextMenu(): void {
    this.contextMenuOpen = false;
    this.contextMenuRow = null;
  }

  onContextMenuAction(action: ContextMenuOption): void {
    if (!this.contextMenuRow) {
      return;
    }
    this.onAction(action as TableAction, this.contextMenuRow);
    this.closeContextMenu();
  }

  onPageChange(next: number): void {
    if (!this.pagination) {
      return;
    }
    const page = Math.min(Math.max(1, next), this.totalPages);
    this.pageChanged.emit(page);
  }

  onPageSizeChange(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.pageSizeChanged.emit(parsed);
  }

  resolveAlign(align?: TableColumnAlign): string {
    if (align === 'center') {
      return 'text-center';
    }
    if (align === 'right') {
      return 'text-right';
    }
    return 'text-left';
  }

  isContextMenuRow(row: Record<string, unknown>): boolean {
    return this.contextMenuOpen && this.contextMenuRow === row;
  }
}
