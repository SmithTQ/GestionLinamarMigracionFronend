import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Campaign, CampaignPage } from '../models/campaign.model';
import { CampaignListResponse, CampaignPayload, CampaignResponse } from './campaign.dto';

export interface CampaignListQuery {
  page?: number;
  pageSize?: number;
  sort?: { key: string; direction: 'asc' | 'desc' };
  filters?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class CampaignsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/campaigns`;

  list(query: CampaignListQuery = {}): Observable<CampaignPage> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    let params = new HttpParams().set('page', page).set('per_page', pageSize);
    const sortKey = query.sort ? mapSortKey(query.sort.key) : undefined;
    if (sortKey) {
      params = params.set('sort_by', sortKey).set('sort_dir', query.sort?.direction ?? 'asc');
    }

    const filters = query.filters ?? {};
    const search = filters['id']?.trim() || filters['name']?.trim();
    if (search) {
      params = params.set('search', search);
    }
    const status = mapStatusFilter(filters['status']);
    if (status) {
      params = params.set('status', status);
    }
    if (filters['startDate']?.trim()) {
      params = params.set('starts_on_from', filters['startDate'].trim());
      params = params.set('starts_on_to', filters['startDate'].trim());
    }
    if (filters['endDate']?.trim()) {
      params = params.set('ends_on_from', filters['endDate'].trim());
      params = params.set('ends_on_to', filters['endDate'].trim());
    }
    return this.http.get<CampaignListResponse>(this.baseUrl, { params }).pipe(
      map((response) => ({
        items: response.datos.map(mapCampaign),
        page: response.paginacion.current_page,
        from: response.paginacion.from,
        to: response.paginacion.to,
        // Keep the requested size as the UI source of truth after the reload.
        pageSize,
        total: response.paginacion.total,
        totalPages: response.paginacion.last_page,
        links: response.paginacion.links,
      })),
    );
  }

  create(payload: CampaignPayload): Observable<Campaign> {
    return this.http
      .post<CampaignResponse>(this.baseUrl, payload)
      .pipe(map((response) => mapCampaign(response.datos)));
  }

  update(id: number, payload: Partial<CampaignPayload>): Observable<Campaign> {
    return this.http
      .patch<CampaignResponse>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((response) => mapCampaign(response.datos)));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

function mapSortKey(key: string): string | undefined {
  const allowedSortKeys: Record<string, string> = {
    id: 'code',
    name: 'name',
    startDate: 'starts_on',
    endDate: 'ends_on',
    status: 'status',
  };
  return allowedSortKeys[key];
}

function mapStatusFilter(value?: string): Campaign['status'] | undefined {
  const normalized = value?.trim().toLocaleLowerCase();
  const statuses: Record<string, Campaign['status']> = {
    draft: 'draft',
    borrador: 'draft',
    open: 'open',
    abierta: 'open',
    closed: 'closed',
    cerrada: 'closed',
    cancelled: 'cancelled',
    cancelada: 'cancelled',
  };
  return normalized ? statuses[normalized] : undefined;
}

function mapCampaign(dto: CampaignResponse['datos']): Campaign {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    status: dto.status,
    startsOn: dto.starts_on,
    endsOn: dto.ends_on ?? undefined,
    budget: dto.budget ?? undefined,
    ordersCount: dto.orders_count,
    deliveredCount: dto.delivered_count,
    totalObtained: dto.total_obtained,
  };
}
