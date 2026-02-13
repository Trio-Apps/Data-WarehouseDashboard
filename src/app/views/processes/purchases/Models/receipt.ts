
    export interface Receipt {
  receiptPurchaseOrderId?: number;
  purchaseOrderId: number;
  postingDate: string;
  dueDate: string;
  comment: string;
 isDraft: boolean;
  status: string;
  approvalStatus?: string | null;
  canApprove?: boolean;
  approval?: boolean | null;
  processApprovalId?: number;
  isReturn?: boolean | null;
    createdAt?: string;
  updatedAt?: string;
  returnOrderId?:number;
}


export interface ReceiptItem {
  receiptPurchaseOrderItemId?: number;
  receiptPurchaseOrderId?: number;
  itemId: number;
  uoMEntry: number;
  quantity: number;
  barCode?: string;
  itemName?: string;
  itemCode?: string;
  unitName?: string;
  comment?: string;
}


export interface AddReceiptItemRequest {
  barcode?: {
    barCode: string;
  };
  item?: {
    uoMEntry: number;
    quantity: number;
    receiptPurchaseOrderId: number;
    itemId: number;
  };
}

export interface UpdateReceiptItemRequest {
  receiptPurchaseOrderItemId: number;
  quantity: number;
  uoMEntry: number;
}

export interface ReceiptBatch {
  receiptPurchaseOrderBatchId?: number;
  receiptPurchaseOrderItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate: string;
}

export interface AddReceiptBatchRequest {
  receiptPurchaseOrderItemId: number;
  quantity: number;
  comment?: string;
  expiryDate: string;
}

export interface UpdateReceiptBatchRequest {
  receiptPurchaseOrderBatchId: number;
  quantity: number;
  comment?: string;
  expiryDate: string;
}

