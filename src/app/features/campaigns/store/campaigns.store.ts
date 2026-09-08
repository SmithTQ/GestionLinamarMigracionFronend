import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, EMPTY } from 'rxjs';
import { Campaign, CampaignPage } from '../models/campaign.model';
import { CampaignListQuery, CampaignsService } from '../services/campaigns.service';
import { CampaignPayload } from '../services/campaign.dto';

@Injectable({ providedIn: 'root' })
export class CampaignsStore {
  private readonly campaignsService = inject(CampaignsService);
  private readonly campaignsSignal = signal<Campaign[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private loadRequestId = 0;
  private readonly paginationSignal = signal<CampaignPage>({
    items: [],
    page: 1,
    from: null,
    to: null,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    links: [],
  });

  readonly campaigns = this.campaignsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly activeCount = computed(
    () => this.campaignsSignal().filter((campaign) => campaign.status === 'open').length,
  );

  load(query: CampaignListQuery = {}): void {
    const requestId = ++this.loadRequestId;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.campaignsService
      .list(query)
      .pipe(
        tap((campaignPage) => {
          if (requestId !== this.loadRequestId) {
            return;
          }
          this.paginationSignal.set(campaignPage);
          this.campaignsSignal.set(campaignPage.items);
        }),
        catchError(() => {
          if (requestId === this.loadRequestId) {
            this.errorSignal.set('No se pudieron cargar las campanas.');
          }
          return EMPTY;
        }),
        finalize(() => {
          if (requestId === this.loadRequestId) {
            this.loadingSignal.set(false);
          }
        }),
      )
      .subscribe();
  }

  create(payload: CampaignPayload): Observable<Campaign> {
    this.errorSignal.set(null);
    return this.campaignsService.create(payload).pipe(
      catchError((error: unknown) => {
        this.errorSignal.set('No se pudo crear la campana.');
        throw error;
      }),
    );
  }

  update(id: number, payload: Partial<CampaignPayload>): Observable<Campaign> {
    this.errorSignal.set(null);
    return this.campaignsService.update(id, payload).pipe(
      catchError((error: unknown) => {
        this.errorSignal.set('No se pudo actualizar la campana.');
        throw error;
      }),
    );
  }

  remove(id: number): Observable<void> {
    this.errorSignal.set(null);
    return this.campaignsService.remove(id).pipe(
      catchError((error: unknown) => {
        this.errorSignal.set('No se pudo cerrar la campana.');
        throw error;
      }),
    );
  }
}
