export interface ItemBarcode {
  itemBarCodeId?: number;
  barCode: string;
  uoMEntry: number;
  freeText: string;
    unitName?: string;

  //barCodeType?: 'dynamic' | 'static';
}


export interface ItemBarcodeResponse {
  success: boolean;
  message: string;
  data: {
    data: ItemBarcode[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

export interface UoMGroup {
  baseQty: number;
  uomCode: string;
  uomEntry: number;
}

export interface UoMGroupResponse {
  success: boolean;
  message: string;
  data: UoMGroup[];
  errors: any;
}

