import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { CampaignUser } from '@features/campaigns/models/campaign-user.model';
import { CampaignUsersService } from '@features/campaigns/services/campaign-users.service';

@Component({
  selector: 'app-campaign-users-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './campaign-users-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignUsersModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() campaignId: number | null = null;
  @Input() campaignName = '';
  @Input() canManage = false;
  @Output() closed = new EventEmitter<void>();

  private readonly service = inject(CampaignUsersService);
  readonly assignedUsers = signal<CampaignUser[]>([]);
  readonly availableUsers = signal<CampaignUser[]>([]);
  readonly selectedUserId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly assignableUsers = computed(() => {
    const assignedIds = new Set(this.assignedUsers().map((user) => user.id));
    return this.availableUsers().filter((user) => !assignedIds.has(user.id));
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue && this.campaignId) {
      this.load();
    }
  }

  close(): void {
    if (!this.loading() && !this.saving()) {
      this.closed.emit();
    }
  }

  selectUser(value: string): void {
    const userId = Number(value);
    this.selectedUserId.set(Number.isInteger(userId) ? userId : null);
  }

  assign(): void {
    const campaignId = this.campaignId;
    const userId = this.selectedUserId();
    if (!campaignId || !userId || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.service
      .assign(campaignId, userId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({ next: () => this.load(), error: (error) => this.error.set(readError(error)) });
  }

  revoke(user: CampaignUser): void {
    const campaignId = this.campaignId;
    if (!campaignId || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.service
      .revoke(campaignId, user.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({ next: () => this.load(), error: (error) => this.error.set(readError(error)) });
  }

  private load(): void {
    const campaignId = this.campaignId;
    if (!campaignId) return;
    this.loading.set(true);
    this.error.set(null);
    this.selectedUserId.set(null);
    forkJoin({
      assigned: this.service.listAssigned(campaignId),
      available: this.canManage ? this.service.listAvailable(campaignId) : of([]),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ assigned, available }) => {
          this.assignedUsers.set(assigned.items);
          this.availableUsers.set(available);
        },
        error: (error) => this.error.set(readError(error)),
      });
  }
}

function readError(error: unknown): string {
  const candidate = error as { error?: { mensaje?: string } };
  return candidate?.error?.mensaje ?? 'No se pudo cargar la asignación de usuarios.';
}
