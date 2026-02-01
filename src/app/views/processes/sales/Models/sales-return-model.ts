
 export interface Return {
  salesOrderId?: number;
  salesReturnOrderId: number;
  postingDate: string;
  dueDate: string;
  comment: string;
  isDraft: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

 export interface UpdateReturn {
  salesReturnOrderId: number;
  comment: string;
 isDraft: boolean;
 
}


export interface ReturnItem {
  salesOrderItemId?: number;
  salesReturnOrderItemId?: number;
  salesReturnOrderId?: number;
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
  salesOrderItemId: number;
  quantity: number;
  comment: string;
}

export interface UpdateReturnItemRequest {
  salesReturnOrderItemId: number;
  quantity: number;
  comment: number;
}

export interface ReturnBatch {
  salesReturnOrderBatchId?: number;
  salesReturnOrderItemId: number;
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
  salesReturnOrderBatchId: number;
  quantity: number;
  comment?: string;
}

