export interface GeneralOrder {
}


export interface AddGeneralItemRequest {
  barcode?: {
    barCode: string;
  };
  item?: {
    uoMEntry: number;
    quantity: number;
    itemId: number;
  };
}

export interface UpdateGeneralItemRequest {
  quantity: number;
  uoMEntry: number;
}
