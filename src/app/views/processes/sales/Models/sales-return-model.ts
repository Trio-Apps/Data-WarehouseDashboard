export interface Return {
  salesOrderId?: number;
  deliveryNoteOrderId?: number;
  salesReturnOrderId: number;
  postingDate: string;
  dueDate: string;
  comment: string;
  reasonId?: number | null;
  reason?: string | null;
  errorMessage?: string | null;
  customerId?: number;
  customerCode?: string;
  customerName?: string;
  warehouseId?: number;
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
  customerId?: number;
  reasonId?: number | null;
  warehouseId: number;
  salesOrderId?: number;
  deliveryNoteOrderId?: number;
  isDraft: boolean;
}

export interface UpdateReturn {
  salesReturnOrderId: number;
  postingDate?: string;
  dueDate?: string;
  comment: string;
  customerId?: number;
  reasonId?: number | null;
  warehouseId?: number;
  salesOrderId?: number;
  deliveryNoteOrderId?: number;
  isDraft: boolean;
}

export interface ReturnItem {
  salesOrderItemId?: number;
  salesReturnOrderItemId?: number;
  salesReturnOrderId?: number;
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
  salesOrderItemId: number;
  quantity: number;
  comment: string;
}

export interface UpdateReturnItemRequest {
  salesReturnOrderItemId: number;
  quantity: number;
  uoMEntry?: number;
  UnitPrice?: number;
  VatPercent?: number;
  comment: string;
}

export interface ReturnBatch {
  salesReturnOrderBatchId?: number;
  salesReturnOrderItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate: string;
}

export interface AddReturnBatchRequest {
  salesReturnOrderItemId: number;
  batchNumber: string;
  quantity: number;
  comment?: string;
  expiryDate: string;
}

export interface UpdateReturnBatchRequest {
  salesReturnOrderBatchId: number;
  quantity: number;
  comment?: string;
}

