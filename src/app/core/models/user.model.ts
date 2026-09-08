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
}
