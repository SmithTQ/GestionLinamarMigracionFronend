import { DistrictList } from '@features/districts/models/district.model';

export interface Campaign {
  id: number;
  code: string;
  name: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  formStatus?: 'draft' | 'published' | 'closed' | null;
  hasPublishedForm?: boolean;
  startsOn: string;
  endsOn?: string;
  budget?: number;
  ordersCount?: number;
  deliveredCount?: number;
  totalObtained?: number;
  districtLists?: DistrictList[];
  branch?: CampaignBranch | null;
  districts?: CampaignDistrict[];
}

export interface CampaignBranch {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CampaignDistrict {
  id: number;
  code: string;
  name: string;
  province?: string;
  department?: string;
}

export interface CampaignPage {
  items: Campaign[];
  page: number;
  from: number | null;
  to: number | null;
  pageSize: number;
  total: number;
  totalPages: number;
  links: CampaignPaginationLink[];
}

export interface CampaignPaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}
