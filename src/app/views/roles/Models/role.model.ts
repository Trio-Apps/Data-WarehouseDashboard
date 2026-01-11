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

