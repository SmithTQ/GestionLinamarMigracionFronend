import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { Branch, BranchPage, BranchPayload } from '../models/branch.model';

interface BranchDto {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_active: boolean;
}
interface PaginatedBranches extends ApiResponse<BranchDto[] | { data: BranchDto[] }> {
  paginacion: { current_page: number; last_page: number; total: number; per_page: number };
}

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/branches`;
  list(page = 1, pageSize = 10): Observable<BranchPage> {
    const params = new HttpParams()
      .set('page', page)
      .set('per_page', pageSize)
      .set('sort_by', 'name')
      .set('sort_dir', 'asc');
    return this.http.get<PaginatedBranches>(this.url, { params }).pipe(
      map((response) => ({
        items: items(response.datos).map(mapBranch),
        page: response.paginacion.current_page,
        pageSize: response.paginacion.per_page,
        total: response.paginacion.total,
        totalPages: response.paginacion.last_page,
      })),
    );
  }
  create(payload: BranchPayload): Observable<Branch> {
    return this.http
      .post<ApiResponse<BranchDto>>(this.url, payload)
      .pipe(map((response) => mapBranch(response.datos)));
  }
  update(id: number, payload: BranchPayload): Observable<Branch> {
    return this.http
      .patch<ApiResponse<BranchDto>>(`${this.url}/${id}`, payload)
      .pipe(map((response) => mapBranch(response.datos)));
  }
  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
function items(value: BranchDto[] | { data: BranchDto[] }): BranchDto[] {
  return Array.isArray(value) ? value : value.data;
}
function mapBranch(dto: BranchDto): Branch {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    address: dto.address,
    latitude: dto.latitude === null || dto.latitude === undefined ? null : Number(dto.latitude),
    longitude: dto.longitude === null || dto.longitude === undefined ? null : Number(dto.longitude),
    isActive: dto.is_active,
  };
}
