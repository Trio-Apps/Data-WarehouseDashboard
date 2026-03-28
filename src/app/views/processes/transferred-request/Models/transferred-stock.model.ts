export interface TransferredStock {
  transferredStockId?: number;
  postingDate?: string;
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
  reasonId?: number | null;
  transferredRequestId?: number | null;
  isReceived?: boolean | null;
  receivedStockId?: number | null;
  warehouseName?: string;
  warehouseCode?: string;
  distinationWarehouseName?: string;
  errorMessage?: string | null;
  isDraft?: boolean;
  receivingStatus?: string | number | null;
  ReceivingStatus?: string | number | null;
  transferredItems?: TransferredItem[];
}

export interface AddTransferredStock {
  postingDate: string;
  dueDate: string;
  comment?: string;
  reasonId?: number | null;
  isDraft: boolean;
  warehouseId: number;
  distinationWarehouseId: number;
  transferredRequestId: number;
}

export interface AddTransferredStockWithoutRef {
  postingDate: string;
  dueDate: string;
  comment?: string;
  reasonId?: number | null;
  isDraft: boolean;
  warehouseId: number;
  distinationWarehouseId: number;
}

export interface UpdateTransferredStock {
  transferredStockId: number;
  postingDate?: string;
  dueDate?: string;
  comment?: string;
  reasonId?: number | null;
  distinationWarehouseId?: number;
  isDraft: boolean;
}

export interface TransferredItem {
  transferredItemId?: number;
  quantity: number;
  receivedQuantity?: number | null;
  ReceivedQuantity?: number | null;
  status?: string;
  errorMessage?: string;
  uoMEntry: number;
  barCode?: string;
  unitPrice?: number;
  vatPercent?: number;
  vatAmount?: number;
  lineTotalBeforeVat?: number;
  lineTotalAfterVat?: number;
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
    UnitPrice?: number;
    VatPercent?: number;
  };
}

export interface UpdateTransferredStockItemRequest {
  transferredItemId: number;
  quantity?: number;
  uoMEntry: number;
  UnitPrice?: number;
  VatPercent?: number;
}

export interface TransferredStockBatch {
  transferredStockBatchId?: number;
  transferredItemId: number;
  quantity: number;
  receivedQuantity?: number | null;
  ReceivedQuantity?: number | null;
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


export interface ReceiveTransferredBatchDTO {
  transferredStockBatchId: number;
  quantity: number;
}

export interface ReceiveTransferredItemDTO {
  transferredItemId: number;
  quantity: number;
  batches?: ReceiveTransferredBatchDTO[];
}

export interface ReceiveTransferredStockDTO {
  transferredStockId: number;
  isDraft: boolean;
  items: ReceiveTransferredItemDTO[];
}












