import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignPayload } from './campaign.dto';
import { CampaignsStore } from '@features/campaigns/store/campaigns.store';

@Injectable({ providedIn: 'root' })
export class CampaignManagementFacade {
  private readonly campaignsStore = inject(CampaignsStore);

  readonly isSaving = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly error = signal<string | null>(null);

  save(campaignId: number | null, payload: CampaignPayload): Observable<Campaign> {
    this.isSaving.set(true);
    this.error.set(null);
    const request = campaignId
      ? this.campaignsStore.update(campaignId, payload)
      : this.campaignsStore.create(payload);
    return request.pipe(
      catchError((error: unknown) => {
        this.error.set(
          campaignId ? 'No se pudo actualizar la campaña.' : 'No se pudo crear la campaña.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.isSaving.set(false)),
    );
  }

  loadDetail(campaignId: number): Observable<Campaign> {
    this.isLoadingDetail.set(true);
    this.error.set(null);
    return this.campaignsStore.get(campaignId).pipe(
      catchError((error: unknown) => {
        this.error.set('No se pudo cargar el detalle de la campaña.');
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingDetail.set(false)),
    );
  }

  close(campaignId: number): Observable<void> {
    this.error.set(null);
    return this.campaignsStore.remove(campaignId).pipe(
      catchError((error: unknown) => {
        this.error.set('No se pudo cerrar la campaña.');
        return throwError(() => error);
      }),
    );
  }
}
