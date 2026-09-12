import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '@core/models/api-response.model';
import { District, DistrictList, LocationOption, PagedResult } from '../models/district.model';
import {
  DistrictListPayload,
  DistrictDto,
  DistrictListDto,
  LocationOptionDto,
  DistrictPayload,
  PaginatedResponse,
} from './district.dto';

export interface DistrictListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  departmentCode?: string;
  provinceCode?: string;
  activeOnly?: boolean;
  sort?: { key: string; direction: 'asc' | 'desc' };
}

@Injectable({ providedIn: 'root' })
export class DistrictsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listDistricts(query: DistrictListQuery = {}): Observable<PagedResult<District>> {
    const pageSize = query.pageSize ?? 10;
    let params = new HttpParams().set('page', query.page ?? 1).set('per_page', pageSize);
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.department?.trim()) {
      params = params.set('department', query.department.trim());
    }
    if (query.departmentCode?.trim()) {
      params = params.set('department_code', query.departmentCode.trim());
    }
    if (query.provinceCode?.trim()) {
      params = params.set('province_code', query.provinceCode.trim());
    }
    if (query.activeOnly) {
      params = params.set('is_active', '1');
    }
    if (query.sort) {
      params = params
        .set('sort_by', mapSortKey(query.sort.key))
        .set('sort_dir', query.sort.direction);
    }
    return this.http
      .get<PaginatedResponse<DistrictDto>>(`${this.baseUrl}/districts`, { params })
      .pipe(map((response) => mapPage(response, pageSize, mapDistrict)));
  }

  listDepartments(): Observable<LocationOption[]> {
    return this.http
      .get<ApiResponse<LocationOptionDto[]>>(`${this.baseUrl}/districts/departments`)
      .pipe(map((response) => response.datos.map(mapLocationOption)));
  }

  listProvinces(departmentCode: string): Observable<LocationOption[]> {
    const params = new HttpParams().set('department_code', departmentCode);
    return this.http
      .get<ApiResponse<LocationOptionDto[]>>(`${this.baseUrl}/districts/provinces`, { params })
      .pipe(map((response) => response.datos.map(mapLocationOption)));
  }

  listAllActiveDistricts(departmentCode?: string, provinceCode?: string): Observable<District[]> {
    const query: DistrictListQuery = {
      page: 1,
      pageSize: 100,
      activeOnly: true,
      sort: { key: 'name', direction: 'asc' },
      departmentCode,
      provinceCode,
    };
    return this.listDistricts(query).pipe(
      expand((page) =>
        page.page < page.totalPages ? this.listDistricts({ ...query, page: page.page + 1 }) : EMPTY,
      ),
      reduce((districts, page) => districts.concat(page.items), [] as District[]),
    );
  }

  listDistrictLists(query: DistrictListQuery = {}): Observable<PagedResult<DistrictList>> {
    const pageSize = query.pageSize ?? 10;
    let params = new HttpParams().set('page', query.page ?? 1).set('per_page', pageSize);
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.sort) {
      params = params
        .set('sort_by', mapSortKey(query.sort.key))
        .set('sort_dir', query.sort.direction);
    }
    return this.http
      .get<PaginatedResponse<DistrictListDto>>(`${this.baseUrl}/district-lists`, { params })
      .pipe(map((response) => mapPage(response, pageSize, mapDistrictList)));
  }

  getDistrict(id: number): Observable<District> {
    return this.http
      .get<ApiResponse<DistrictDto>>(`${this.baseUrl}/districts/${id}`)
      .pipe(map((response) => mapDistrict(response.datos)));
  }

  createDistrict(payload: DistrictPayload): Observable<District> {
    return this.http
      .post<ApiResponse<DistrictDto>>(`${this.baseUrl}/districts`, payload)
      .pipe(map((response) => mapDistrict(response.datos)));
  }

  updateDistrict(id: number, payload: Partial<DistrictPayload>): Observable<District> {
    return this.http
      .patch<ApiResponse<DistrictDto>>(`${this.baseUrl}/districts/${id}`, payload)
      .pipe(map((response) => mapDistrict(response.datos)));
  }

  deleteDistrict(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/districts/${id}`);
  }

  getDistrictList(id: number): Observable<DistrictList> {
    return this.http
      .get<ApiResponse<DistrictListDto>>(`${this.baseUrl}/district-lists/${id}`)
      .pipe(map((response) => mapDistrictList(response.datos)));
  }

  createDistrictList(payload: DistrictListPayload): Observable<DistrictList> {
    return this.http
      .post<ApiResponse<DistrictListDto>>(`${this.baseUrl}/district-lists`, payload)
      .pipe(map((response) => mapDistrictList(response.datos)));
  }

  updateDistrictList(id: number, payload: Partial<DistrictListPayload>): Observable<DistrictList> {
    return this.http
      .patch<ApiResponse<DistrictListDto>>(`${this.baseUrl}/district-lists/${id}`, payload)
      .pipe(map((response) => mapDistrictList(response.datos)));
  }

  deleteDistrictList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/district-lists/${id}`);
  }
}

function mapPage<TDto, TModel>(
  response: PaginatedResponse<TDto>,
  pageSize: number,
  mapper: (value: TDto) => TModel,
): PagedResult<TModel> {
  return {
    items: getListData(response.datos).map(mapper),
    page: response.paginacion.current_page,
    pageSize,
    total: response.paginacion.total,
    totalPages: response.paginacion.last_page,
  };
}

function mapDistrict(dto: DistrictDto): District {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    province: dto.province ?? '',
    provinceCode: dto.province_code ?? '',
    department: dto.department ?? '',
    departmentCode: dto.department_code ?? '',
    isActive: dto.is_active ?? true,
  };
}

function mapLocationOption(dto: LocationOptionDto): LocationOption {
  return { code: dto.code, name: dto.name };
}

function getListData<T>(value: T[] | { data: T[] }): T[] {
  return Array.isArray(value) ? value : value.data;
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

function mapSortKey(key: string): string {
  const allowed: Record<string, string> = {
    code: 'code',
    name: 'name',
    province: 'province',
    department: 'department',
    isActive: 'is_active',
  };
  return allowed[key] ?? 'name';
}
