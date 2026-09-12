export interface District {
  id: number;
  code: string;
  name: string;
  province: string;
  provinceCode?: string;
  department: string;
  departmentCode?: string;
  isActive: boolean;
}

export interface LocationOption {
  code: string;
  name: string;
}

export interface DistrictList {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  districtCount?: number;
  districts: District[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
