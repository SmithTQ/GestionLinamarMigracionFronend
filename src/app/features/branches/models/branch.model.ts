export interface Branch {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
}

export interface BranchPage {
  items: Branch[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface BranchPayload {
  code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
}
