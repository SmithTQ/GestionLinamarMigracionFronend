import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  inject,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonComponent, ButtonVariant } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
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
  disabled?: boolean;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  lastPage?: number;
  pageSizeOptions?: number[];
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    NgClass,
    ButtonComponent,
    InputComponent,
    IconComponent,
    ContextMenuComponent,
    LoadingComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);
  @Input() title?: string;
  @Input() description?: string;
  @Input() columns: TableColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() actions: TableAction[] = [];
  @Input() showHeader = true;
  @Input() showFilters = true;
  @Input() showActions = true;
  @Input() showPagination = true;
  @Input() useContextMenuActions = false;
  @Input() emptyStateText = 'No hay registros disponibles.';
  @Input() loading = false;
  @Input() serverSide = false;
  @Input() sortable = true;
  @Input() size: TableSize = 'md';
  @Input() pagination?: TablePagination;
  @Input() sort?: { key: string; direction: 'asc' | 'desc' };
  @Input() filterValues: Record<string, string> = {};
  @Input() filterDebounceMs = 300;

  @Output() actionClicked = new EventEmitter<{
    action: TableAction;
    row: Record<string, unknown>;
  }>();
  @Output() sortChanged = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();
  @Output() filterChanged = new EventEmitter<{ key: string; value: string }>();
  @Output() pageChanged = new EventEmitter<number>();
  @Output() pageSizeChanged = new EventEmitter<number>();

  contextMenuOpen = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuRow: Record<string, unknown> | null = null;
  private readonly filterValuesState: Record<string, string> = {};
  private readonly filterTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private localSort: { key: string; direction: 'asc' | 'desc' } | undefined;

  get totalPages(): number {
    if (!this.pagination) {
      return 1;
    }
    return (
      this.pagination.lastPage ??
      Math.max(1, Math.ceil(this.pagination.total / this.pagination.pageSize))
    );
  }

  get contextMenuOptions(): ContextMenuOption[] {
    return this.actions.map(({ id, label, icon, disabled }) => ({ id, label, icon, disabled }));
  }

  get activeSort(): { key: string; direction: 'asc' | 'desc' } | undefined {
    return this.localSort ?? this.sort;
  }

  get displayedRows(): Record<string, unknown>[] {
    if (this.serverSide) {
      return this.rows;
    }

    let result = [...this.rows];
    const filters = Object.entries(this.filterValuesState).filter(([, value]) => value.trim());

    if (filters.length) {
      result = result.filter((row) =>
        filters.every(([key, value]) =>
          String(row[key] ?? '')
            .toLocaleLowerCase()
            .includes(value.trim().toLocaleLowerCase()),
        ),
      );
    }

    const sort = this.localSort ?? this.sort;
    if (sort) {
      result.sort((left, right) => this.compareRows(left, right, sort));
    }
    return result;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterValues']) {
      Object.keys(this.filterValuesState).forEach((key) => delete this.filterValuesState[key]);
      Object.assign(this.filterValuesState, this.filterValues);
    }
  }

  ngOnDestroy(): void {
    this.filterTimers.forEach((timer) => clearTimeout(timer));
    this.filterTimers.clear();
  }

  onSort(column: TableColumn): void {
    if (!this.sortable || !column.sortable) {
      return;
    }
    const currentSort = this.localSort ?? this.sort;
    const direction =
      currentSort?.key === column.key && currentSort.direction === 'asc' ? 'desc' : 'asc';
    const nextSort = { key: column.key, direction } as const;
    this.localSort = nextSort;
    this.sortChanged.emit(nextSort);
  }

  onFilter(column: TableColumn, value: string): void {
    if (!column.filterable) {
      return;
    }
    this.filterValuesState[column.key] = value;
    const currentTimer = this.filterTimers.get(column.key);
    if (currentTimer) {
      clearTimeout(currentTimer);
    }
    const timer = setTimeout(() => {
      this.filterChanged.emit({ key: column.key, value });
      this.filterTimers.delete(column.key);
    }, this.filterDebounceMs);
    this.filterTimers.set(column.key, timer);
  }

  onAction(action: TableAction, row: Record<string, unknown>): void {
    if (action.disabled) {
      return;
    }
    this.actionClicked.emit({ action, row });
  }

  onRowContextMenu(event: MouseEvent, row: Record<string, unknown>): void {
    if (!this.useContextMenuActions || !this.showActions || !this.actions.length) {
      return;
    }
    event.preventDefault();
    const menuWidth = 220;
    const menuHeight = Math.max(44, this.actions.length * 36 + 16);
    const viewport = this.document.defaultView;
    const maxX = Math.max(8, (viewport?.innerWidth ?? 1024) - menuWidth - 8);
    const maxY = Math.max(8, (viewport?.innerHeight ?? 768) - menuHeight - 8);

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
    const selectedAction = this.actions.find((item) => item.id === action.id);
    if (!this.contextMenuRow || !selectedAction) {
      return;
    }
    this.onAction(selectedAction, this.contextMenuRow);
    this.closeContextMenu();
  }

  onPageChange(next: number): void {
    if (!this.pagination) {
      return;
    }
    const page = Math.min(Math.max(1, next), this.totalPages);
    if (page === this.pagination.page) {
      return;
    }
    this.pageChanged.emit(page);
  }

  onPageSizeChange(value: string): void {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return;
    }
    const allowedSizes = this.pagination?.pageSizeOptions;
    if (allowedSizes?.length && !allowedSizes.includes(parsed)) {
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

  filterValue(key: string): string {
    return this.filterValuesState[key] ?? '';
  }

  formatCell(row: Record<string, unknown>, column: TableColumn): string {
    const value = row[column.key];
    if (value === null || value === undefined) {
      return '';
    }
    if (column.type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
    }
    if (column.type === 'date' && typeof value === 'string') {
      const date = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('es-PE').format(date);
      }
    }
    return String(value);
  }

  rowKey(row: Record<string, unknown>, index: number): string | number {
    return String(row['id'] ?? row['code'] ?? index);
  }

  private compareRows(
    left: Record<string, unknown>,
    right: Record<string, unknown>,
    sort: { key: string; direction: 'asc' | 'desc' },
  ): number {
    const leftValue = left[sort.key];
    const rightValue = right[sort.key];
    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    const comparison =
      Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
        ? leftNumber - rightNumber
        : String(leftValue ?? '').localeCompare(String(rightValue ?? ''), 'es', {
            sensitivity: 'base',
            numeric: true,
          });
    return sort.direction === 'asc' ? comparison : -comparison;
  }
}
