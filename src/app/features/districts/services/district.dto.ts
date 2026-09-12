import { ApiResponse } from '@core/models/api-response.model';

export interface DistrictDto {
  id: number;
  code: string;
  name: string;
  province?: string | null;
  province_code?: string | null;
  department?: string | null;
  department_code?: string | null;
  is_active?: boolean;
}

export interface DistrictListDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  district_count?: number;
  districts?: DistrictDto[];
}

export interface PaginationDto {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[] | { data: T[] }> {
  paginacion: PaginationDto;
}

export interface LocationOptionDto {
  code: string;
  name: string;
}

export interface DistrictPayload {
  code: string;
  name: string;
  province: string;
  department: string;
}

export interface DistrictListPayload {
  code: string;
  name: string;
  description?: string;
  district_ids: number[];
}
