
 export interface Return {
  returnReceiptOrderId?: number;
  goodsReturnOrderId: number;
  postingDate: string;
  dueDate: string;
  comment: string;
  reasonId?: number | null;
  reason?: string | null;
  errorMessage?: string | null;
  supplierId?: number;
  supplierCode?:string;
  supplierName?: string;
  warehouseId?: number;
  receiptPurchaseOrderId?: number;
  itemCount?: number;
  approvalStatus?: string | null;
  canApprove?: boolean;
  processApprovalId?: number;
  isDraft: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddReturn {
  postingDate: string;
  dueDate: string;
  comment: string;
  reasonId?: number | null;
  supplierId?: number;
  warehouseId: number;
  receiptPurchaseOrderId?: number;
  isDraft: boolean;
}

export interface UpdateReturn {
  goodsReturnOrderId: number;
  postingDate?: string;
  dueDate?: string;
  comment: string;
  reasonId?: number | null;
  supplierId?: number;
  warehouseId?: number;
  receiptPurchaseOrderId?: number;
  isDraft: boolean;
}


export interface ReturnItem {
  returnReceiptOrderItemId?: number;
  goodsReturnOrderItemId?: number;
  goodsReturnOrderId?: number;
  receiptPurchaseOrderItemId?: number;
  itemId: number;
  uoMEntry: number;
  quantity: number;
  unitPrice?: number;
  barCode?: string;
  itemName?: string;
  itemCode?: string;
  unitName?: string;
  comment?: string;
  vatPercent?: number;
  vatAmount?: number;
  lineTotalBeforeVat?: number;
  lineTotalAfterVat?: number;
}


export interface AddReturnItemRequest {
  receiptPurchaseOrderItemId: number;
  quantity: number;
  comment: string;
}

export interface UpdateReturnItemRequest {
  goodsReturnOrderItemId: number;
  quantity: number;
  uoMEntry?: number;
  UnitPrice?: number;
  VatPercent?: number;
  comment: string;
}

export interface ReturnBatch {
  goodsReturnOrderBatchId?: number;
  ReturnReceiptOrderItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate: string;
}

export interface AddReturnBatchRequest {
  goodsReturnOrderItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate: string;
}

export interface UpdateReturnBatchRequest {
  goodsReturnOrderBatchId: number;
  quantity: number;
  comment?: string;
}



