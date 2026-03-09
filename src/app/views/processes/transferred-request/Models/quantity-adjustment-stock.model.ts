export interface QuantityAdjustmentStock {
  quantityAdjustmentStockId?: number;
  userId?: string;
  warehouseId: number;
  warehouseCode?: string;
  comment?: string;
  errorMessage?: string | null;
  status: string;
  itemCount?: number;
  postingDate: string;
  dueDate: string;
  createdAt?: string;
  approval?: boolean | null;
  approvalStatus?: string | null;
  canApprove?: boolean;
  processItemIsProgressId?: number | null;
  processApprovalId?: number | null;
  reason?: string | null;
  hasProgress?: boolean;
  isReturn?: boolean | null;
  returnOrderId?: number | null;
  isDraft?: boolean;
  quantityAdjustmentStockItems?: QuantityAdjustmentStockItem[];
}

export interface AddQuantityAdjustmentStock {
  postingDate: string;
  dueDate: string;
  comment?: string;
  isDraft: boolean;
  warehouseId: number;
}

export interface UpdateQuantityAdjustmentStock {
  quantityAdjustmentStockId: number;
  postingDate?: string;
  dueDate?: string;
  comment?: string;
  isDraft: boolean;
}

export interface QuantityAdjustmentStockItem {
  quantityAdjustmentStockItemId?: number;
  quantity: number;
  status?: string;
  errorMessage?: string;
  uoMEntry: number;
  unitName?: string;
  barCode?: string;
  unitPrice?: number;
  itemCode?: string;
  itemId: number;
  itemName?: string;
  quantityAdjustmentStockId?: number;
}

export interface AddQuantityAdjustmentStockItemRequest {
  barcode?: {
    barCode: string;
  };
  item?: {
    uoMEntry: number;
    quantity?: number;
    unitPrice?: number;
    itemId: number;
    quantityAdjustmentStockId?: number;
  };
}

export interface UpdateQuantityAdjustmentStockItemRequest {
  quantityAdjustmentStockItemId?: number;
  quantity?: number;
  uoMEntry: number;
  unitPrice?: number;
}

export interface QuantityAdjustmentStockBatch {
  quantityAdjustmentStockBatchId?: number;
  quantityAdjustmentStockItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate?: string;
}

export interface AddQuantityAdjustmentStockBatchRequest {
  quantityAdjustmentStockItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface UpdateQuantityAdjustmentStockBatchRequest {
  quantityAdjustmentStockBatchId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface QuantityAdjustmentStockResponse {
  success: boolean;
  message: string;
  data: {
    data: QuantityAdjustmentStock[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}
