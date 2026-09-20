export interface CampaignUser {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  isActive: boolean;
  roles: string[];
}

export interface CampaignUserPage {
  items: CampaignUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
