export interface Company {
  companyId?: number;
  name: string;
  isActive: boolean;
}

export interface CompanyResponse {
  success: boolean;
  message: string;
  data: {
    data: Company[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

