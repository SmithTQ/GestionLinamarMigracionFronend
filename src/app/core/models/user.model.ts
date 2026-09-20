export interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: string;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  permissions: Permission[];
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  is_active: boolean;
  roles: Role[];
  branches?: UserBranch[];
  campaign_context?: CampaignContext;
  operational_context?: OperationalContext;
}

/** Minimal branch shape returned with the authenticated operational scope. */
export interface UserBranch {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface CampaignContext {
  available_count: number;
  default_campaign_id: number | null;
  branch_ids: number[];
  campaign_ids: number[];
}

export type OperationalMode = 'super_admin' | 'branch_admin' | 'campaign_dispatcher' | null;

export interface OperationalContext {
  mode: OperationalMode;
  branch_ids: number[];
  campaign_ids: number[];
  default_branch_id: number | null;
  default_campaign_id: number | null;
}
