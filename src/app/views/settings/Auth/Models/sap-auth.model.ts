export interface SapAuthSettings {
  sapId?: number;
  name?: string;
  companyDB: string;
  userName: string;
  password: string;
  sapUrl?: string;
  isActive?: boolean;
  companyId?: number | null;
}

export interface Sap {
  sapId: number;
  sapUrl: string;
  companyDB: string;
  name: string;
  userName: string;
  password: string;
  isActive: boolean;
  companyId?: number | null;
}

export interface SapResponse {
  success: boolean;
  message: string;
  data: {
    data: Sap[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

