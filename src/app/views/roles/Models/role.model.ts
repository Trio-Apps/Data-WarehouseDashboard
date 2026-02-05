export interface Role {
  id?: number;
  roleName: string;
  // description?: string;
  // isActive?: boolean;
  // permissions?: string[];
  // createdAt?: Date;
  // updatedAt?: Date;
}

export interface AddRole {
  roleName: string
}

export interface RoleFormPayload {
  id?: number;
  roleName: string;
  permissionIds: number[];
}

export interface AddRoleWithPermissions {
  roleName: string;
  permissionIds: number[];
}

export interface UpdateRoleWithPermissions {
  roleId: number;
  roleName?: string;
  permissionIds?: number[];
}

export interface Permission {
  permissionId: number;
  key: string;          // e.g. "Users.Create"
  name: string;         // e.g. "Create User"
  group?: string;       // e.g. "Users"
  description?: string;
}
export interface PermissionForRole {
  permissionId: number;
  key: string;
  name: string;
  description?: string;
  group?: string;
  isSelected: boolean;
}


export interface PermissionForRoleResponse {
  success: boolean;
  message: string;
  data:PermissionForRole[] | null;
  errors: any;
}

export interface PermissionResponse {
  success: boolean;
  message: string;
  data:Permission[] | null;
  errors: any;
}

export interface RoleResponse {
  success: boolean;
  message: string;
  data: {
    data: Role[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

