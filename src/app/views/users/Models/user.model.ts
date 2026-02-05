export interface User {
  id?: string;
  email: string;
  userName?: string;
  fullName?: string;
  phoneNumber?: string;
  roleName: string;
  companyId?: number | null;
  sapIds?: number[] | null;
  warehouseIds?: number[] | null;
}
export interface AddUser {
  id?: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  roleName: string;
  companyId?: number | null;
  sapIds?: number[] | null;
  warehouseIds?: number[] | null;
}
export interface UpdateUser {
  id?: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  roleName: string;
  companyId?: number | null;
  sapId?: number | null;
}
export interface UserResponse {
  success: boolean;
  message: string;
  data: {
    data: User[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}



export interface UserResponse {
  success: boolean;
  message: string;
  data: {
    data: User[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

