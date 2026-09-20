export interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: string;
}
export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  permissions: Permission[];
}
export interface ManagedUser {
  id: number;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  roles: Role[];
  campaignIds: number[];
  branchIds: number[];
}
export interface UserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  is_active: boolean;
  role_ids: number[];
  campaign_ids?: number[];
  branch_ids?: number[];
}
export interface UserPage {
  items: ManagedUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
