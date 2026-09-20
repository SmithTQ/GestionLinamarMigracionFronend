import { ApiResponse } from '@core/models/api-response.model';
import { DistrictListDto } from '@features/districts/services/district.dto';

export interface CampaignDto {
  id: number;
  code: string;
  name: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  form_status?: 'draft' | 'published' | 'closed' | null;
  has_published_form?: boolean;
  starts_on: string;
  starts_on_iso?: string | null;
  ends_on?: string | null;
  ends_on_iso?: string | null;
  budget?: number | null;
  orders_count?: number;
  delivered_count?: number;
  total_obtained?: number;
  district_lists?: DistrictListDto[];
  branch?: BranchDto | null;
  districts?: DistrictDto[];
}

export interface BranchDto {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface DistrictDto {
  id: number;
  code: string;
  name: string;
  province?: string | null;
  department?: string | null;
}

export interface CampaignPayload {
  code: string;
  name: string;
  status: CampaignDto['status'];
  starts_on: string;
  ends_on?: string;
  branch_id: number;
  district_list_ids?: number[];
}

export interface PaginationDto {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationLinkDto[];
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLinkDto {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export type CampaignResponse = ApiResponse<CampaignDto>;
export interface CampaignListResponse extends ApiResponse<CampaignDto[] | { data: CampaignDto[] }> {
  paginacion: PaginationDto;
}
