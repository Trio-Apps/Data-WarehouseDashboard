
 export interface Return {
  returnReceiptOrderId?: number;
  goodsReturnOrderId: number;
  postingDate: string;
  dueDate: string;
  comment: string;
 isDraft: boolean;
  status: string;
    createdAt?: string;
  updatedAt?: string;
}

 export interface UpdateReturn {
  
  goodsReturnOrderId: number;
  comment: string;
 isDraft: boolean;
 
}


export interface ReturnItem {
  returnReceiptOrderItemId?: number;
  goodsReturnOrderItemId?: number;
  goodsReturnOrderId?: number;
  itemId: number;
  uoMEntry: number;
  quantity: number;
  barCode?: string;
  itemName?: string;
  itemCode?: string;
  unitName?: string;
  comment?: string;
}


export interface AddReturnItemRequest {
  receiptPurchaseOrderItemId: number;
  quantity: number;
  comment: string;
}

export interface UpdateReturnItemRequest {
  goodsReturnOrderItemId: number;
  quantity: number;
  comment: number;
}

export interface ReturnBatch {
  ReturnReceiptOrderBatchId?: number;
  ReturnReceiptOrderItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate: string;
}

// export interface AddReturnBatchRequest {
//   ReturnReceiptOrderItemId: number;
//   quantity: number;
//   comment?: string;
//   expiryDate: string;
// }

export interface UpdateReturnBatchRequest {
  goodsReturnOrderBatchId: number;
  quantity: number;
  comment?: string;
}

