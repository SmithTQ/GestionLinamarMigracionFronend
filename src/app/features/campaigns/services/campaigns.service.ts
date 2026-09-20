import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '@core/models/api-response.model';
import { Campaign, CampaignPage } from '../models/campaign.model';
import { District, DistrictList } from '@features/districts/models/district.model';
import { DistrictDto, DistrictListDto } from '@features/districts/services/district.dto';
import {
  CampaignDto,
  CampaignListResponse,
  CampaignPayload,
  CampaignResponse,
} from './campaign.dto';

export interface CampaignListQuery {
  page?: number;
  pageSize?: number;
  branchId?: number;
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
    if (query.branchId) {
      params = params.set('branch_id', query.branchId);
    }
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
        items: getListData(response.datos).map(mapCampaign),
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

  listAvailable(branchId?: number): Observable<Campaign[]> {
    let params = new HttpParams();
    if (branchId) {
      params = params.set('branch_id', branchId);
    }
    return this.http
      .get<
        ApiResponse<CampaignDto[] | { data: CampaignDto[] }>
      >(`${this.baseUrl}/available`, { params })
      .pipe(map((response) => getListData(response.datos).map(mapCampaign)));
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

  get(id: number): Observable<Campaign> {
    return this.http
      .get<CampaignResponse>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => mapCampaign(response.datos)));
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
    formStatus: dto.form_status ?? null,
    hasPublishedForm: dto.has_published_form ?? false,
    startsOn: toDateInputValue(dto.starts_on_iso ?? dto.starts_on) ?? '',
    endsOn: dto.ends_on_iso ? toDateInputValue(dto.ends_on_iso) : toDateInputValue(dto.ends_on),
    budget: dto.budget ?? undefined,
    ordersCount: dto.orders_count,
    deliveredCount: dto.delivered_count,
    totalObtained: dto.total_obtained,
    districtLists: (dto.district_lists ?? []).map(mapDistrictList),
    branch: dto.branch
      ? {
          id: dto.branch.id,
          code: dto.branch.code,
          name: dto.branch.name,
          address: dto.branch.address,
          latitude:
            dto.branch.latitude === null || dto.branch.latitude === undefined
              ? null
              : Number(dto.branch.latitude),
          longitude:
            dto.branch.longitude === null || dto.branch.longitude === undefined
              ? null
              : Number(dto.branch.longitude),
        }
      : null,
    districts: (dto.districts ?? []).map(({ id, code, name, province, department }) => ({
      id,
      code,
      name,
      province: province ?? undefined,
      department: department ?? undefined,
    })),
  };
}

function toDateInputValue(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function mapDistrictList(dto: DistrictListDto): DistrictList {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description ?? undefined,
    isActive: dto.is_active ?? true,
    districtCount: dto.district_count,
    districts: (dto.districts ?? []).map(mapDistrict),
  };
}

function mapDistrict(dto: DistrictDto): District {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    province: dto.province ?? '',
    department: dto.department ?? '',
    isActive: dto.is_active ?? true,
  };
}

function getListData<T>(value: T[] | { data: T[] }): T[] {
  return Array.isArray(value) ? value : value.data;
}
