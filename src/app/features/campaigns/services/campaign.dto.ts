import { ApiResponse } from '@core/models/api-response.model';

export interface CampaignDto {
  id: number;
  code: string;
  name: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  starts_on: string;
  ends_on?: string | null;
  budget?: number | null;
  orders_count?: number;
  delivered_count?: number;
  total_obtained?: number;
}

export interface CampaignPayload {
  code: string;
  name: string;
  status: CampaignDto['status'];
  starts_on: string;
  ends_on?: string;
  branch_ids?: number[];
  district_ids?: number[];
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
export interface CampaignListResponse extends ApiResponse<CampaignDto[]> {
  paginacion: PaginationDto;
}
