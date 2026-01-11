export interface DynamicBarCode {
  dynamicBarCodeId?: number;
  barCode: string;
  isActive: boolean;
  itemBarCodeId: number;
}
export interface AddDynamicBarCode {
  barCode: string;
}

export interface UpdateDynamicBarCode {
  dynamicBarCodeId?: number;
  barCode: string;
}


export interface DynamicBarCodeResponse {
  success: boolean;
  message: string;
  data: {
    data: DynamicBarCode[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

