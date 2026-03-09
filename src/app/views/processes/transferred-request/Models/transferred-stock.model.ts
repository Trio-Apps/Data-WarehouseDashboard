export interface TransferredStock {
  transferredStockId?: number;
  status: string;
  dueDate: string;
  userId?: string;
  comment?: string;
  warehouseId: number;
  distinationWarehouseId: number;
  createdAt?: string;
  itemCount?: number;
  approval?: boolean | null;
  approvalStatus?: string | null;
  canApprove?: boolean;
  processItemIsProgressId?: number | null;
  processApprovalId?: number | null;
  reason?: string | null;
  transferredRequestId?: number | null;
  isReceived?: boolean | null;
  receivedStockId?: number | null;
  warehouseCode?: string;
  distinationWarehouseName?: string;
  errorMessage?: string | null;
  isDraft?: boolean;
  transferredItems?: TransferredItem[];
}

export interface AddTransferredStock {
  dueDate: string;
  comment?: string;
  isDraft: boolean;
  warehouseId: number;
  distinationWarehouseId: number;
  transferredRequestId: number;
}

export interface AddTransferredStockWithoutRef {
  dueDate: string;
  comment?: string;
  isDraft: boolean;
  warehouseId: number;
  distinationWarehouseId: number;
}

export interface UpdateTransferredStock {
  transferredStockId: number;
  dueDate?: string;
  comment?: string;
  distinationWarehouseId?: number;
  isDraft: boolean;
}

export interface TransferredItem {
  transferredItemId?: number;
  quantity: number;
  status?: string;
  errorMessage?: string;
  uoMEntry: number;
  barCode?: string;
  unitPrice?: number;
  comment?: string;
  transferredStockId?: number;
  itemId: number;
  transferredRequestItemId?: number;
  itemCode?: string;
  itemName?: string;
  unitName?: string;
  batches?: TransferredStockBatch[];
}

export interface AddTransferredStockItemRequest {
  barcode?: {
    barCode: string;
  };
  item?: {
    uoMEntry: number;
    quantity?: number;
    transferredStockId: number;
    itemId: number;
    transferredRequestItemId: number;
  };
}

export interface UpdateTransferredStockItemRequest {
  transferredItemId: number;
  quantity?: number;
  uoMEntry: number;
}

export interface TransferredStockBatch {
  transferredStockBatchId?: number;
  transferredItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate?: string;
}

export interface AddTransferredStockBatchRequest {
  transferredItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface UpdateTransferredStockBatchRequest {
  transferredStockBatchId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface TransferredStockResponse {
  success: boolean;
  message: string;
  data: {
    data: TransferredStock[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}
