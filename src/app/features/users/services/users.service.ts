import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { ManagedUser, Role, UserPage, UserPayload } from '../models/user.model';
interface Dto {
  id: number;
  name: string;
  username: string;
  email: string;
  is_active: boolean;
  roles: Role[];
  campaigns: { id: number }[];
  branches: { id: number }[];
}
interface Page extends ApiResponse<Dto[] | { data: Dto[] }> {
  paginacion: { current_page: number; last_page: number; total: number; per_page: number };
}

export interface UserListQuery {
  branchId?: number;
  roleId?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;
  list(page = 1, pageSize = 10, query: UserListQuery = {}): Observable<UserPage> {
    let params = new HttpParams().set('page', page).set('per_page', pageSize);
    if (query.branchId) params = params.set('branch_id', query.branchId);
    if (query.roleId) params = params.set('role_id', query.roleId);
    return this.http.get<Page>(this.url, { params }).pipe(
      map((r) => ({
        items: list(r.datos).map(user),
        page: r.paginacion.current_page,
        pageSize: r.paginacion.per_page,
        total: r.paginacion.total,
        totalPages: r.paginacion.last_page,
      })),
    );
  }
  roles(): Observable<Role[]> {
    return this.http
      .get<ApiResponse<Role[]>>(`${environment.apiUrl}/roles`)
      .pipe(map((r) => r.datos));
  }
  create(p: UserPayload): Observable<ManagedUser> {
    return this.http.post<ApiResponse<Dto>>(this.url, p).pipe(map((r) => user(r.datos)));
  }
  update(id: number, p: UserPayload, branchId?: number): Observable<ManagedUser> {
    const params = branchId ? new HttpParams().set('branch_id', branchId) : undefined;
    return this.http
      .patch<ApiResponse<Dto>>(`${this.url}/${id}`, p, { params })
      .pipe(map((r) => user(r.datos)));
  }
  deactivate(id: number, branchId?: number): Observable<void> {
    const params = branchId ? new HttpParams().set('branch_id', branchId) : undefined;
    return this.http.delete<void>(`${this.url}/${id}`, { params });
  }
}
function list(v: Dto[] | { data: Dto[] }): Dto[] {
  return Array.isArray(v) ? v : v.data;
}
function user(v: Dto): ManagedUser {
  return {
    id: v.id,
    name: v.name,
    username: v.username,
    email: v.email,
    isActive: v.is_active,
    roles: v.roles ?? [],
    campaignIds: (v.campaigns ?? []).map((x) => x.id),
    branchIds: (v.branches ?? []).map((x) => x.id),
  };
}
