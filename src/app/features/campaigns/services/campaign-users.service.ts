import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { CampaignUser, CampaignUserPage } from '@features/campaigns/models/campaign-user.model';

interface UserDto {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  is_active: boolean;
  roles?: { name: string }[];
}

interface UserListResponse extends ApiResponse<UserDto[] | { data: UserDto[] }> {
  paginacion: { current_page: number; last_page: number; total: number; per_page: number };
}

@Injectable({ providedIn: 'root' })
export class CampaignUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listAssigned(campaignId: number, search = ''): Observable<CampaignUserPage> {
    let params = new HttpParams().set('page', 1).set('per_page', 100);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http
      .get<UserListResponse>(`${this.baseUrl}/campaigns/${campaignId}/users`, { params })
      .pipe(map(mapPage));
  }

  listAvailable(campaignId: number, search = ''): Observable<CampaignUser[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());
    return this.http
      .get<
        ApiResponse<UserDto[] | { data: UserDto[] }>
      >(`${this.baseUrl}/campaigns/${campaignId}/available-dispatchers`, { params })
      .pipe(map((response) => getItems(response.datos).map(mapUser)));
  }

  assign(campaignId: number, userId: number): Observable<CampaignUser> {
    return this.http
      .post<ApiResponse<UserDto>>(`${this.baseUrl}/campaigns/${campaignId}/users`, {
        user_id: userId,
        is_active: true,
      })
      .pipe(map((response) => mapUser(response.datos)));
  }

  revoke(campaignId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/campaigns/${campaignId}/users/${userId}`);
  }
}

function mapPage(response: UserListResponse): CampaignUserPage {
  return {
    items: getItems(response.datos).map(mapUser),
    page: response.paginacion.current_page,
    pageSize: response.paginacion.per_page,
    total: response.paginacion.total,
    totalPages: response.paginacion.last_page,
  };
}

function getItems(value: UserDto[] | { data: UserDto[] }): UserDto[] {
  return Array.isArray(value) ? value : value.data;
}

function mapUser(dto: UserDto): CampaignUser {
  return {
    id: dto.id,
    name: dto.name,
    username: dto.username,
    email: dto.email,
    isActive: dto.is_active,
    roles: dto.roles?.map((role) => role.name) ?? [],
  };
}
