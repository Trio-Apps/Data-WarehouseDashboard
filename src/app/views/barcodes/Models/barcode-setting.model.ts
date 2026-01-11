export interface BarCodeSetting {
  barCodeSettingId?: number;
  totalLength: number;
  startsWith: string;
  sapStartPosition: number;
  sapLength: number;
  quantityStartPosition: number;
  quantityLength: number;
  ignoreLastDigit: boolean;
  defaultUom: string;
  createdDate?: Date;
  modifiedDate?: Date | null;

}

export interface BarCodeSettingResponse {
  success: boolean;
  message: string;
  data: {
    data: BarCodeSetting[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

