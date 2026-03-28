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
  reasonId?: number | null;
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
  reasonId?: number | null;
  isDraft: boolean;
  warehouseId: number;
}

export interface UpdateQuantityAdjustmentStock {
  quantityAdjustmentStockId: number;
  postingDate?: string;
  dueDate?: string;
  comment?: string;
  reasonId?: number | null;
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
  vatPercent?: number;
  vatAmount?: number;
  lineTotalBeforeVat?: number;
  lineTotalAfterVat?: number;
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
    vatPercent?: number;
    itemId: number;
    quantityAdjustmentStockId?: number;
  };
}

export interface UpdateQuantityAdjustmentStockItemRequest {
  quantityAdjustmentStockItemId?: number;
  quantity?: number;
  uoMEntry: number;
  unitPrice?: number;
  vatPercent?: number;
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


