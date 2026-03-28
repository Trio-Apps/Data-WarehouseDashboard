export interface TransferredRequest {
  transferredRequestId?: number;
  postingDate?: string;
  dueDate: string;
  comment?: string;
  status: string;
  warehouseId: number;
  distinationWarehouseId: number;
  userId?: string;
  createdAt?: string;
  itemCount?: number;
  approval?: boolean | null;
  approvalStatus?: string | null;
  canApprove?: boolean;
  processItemIsProgressId?: number | null;
  processApprovalId?: number | null;
  reason?: string | null;
  warehouseName?: string;
  distinationWarehouseName?: string;
  transferredStockId?: number | null;
  errorMessage?: string | null;
  isDraft?: boolean;
  items?: TransferredRequestItem[];
}

export interface AddTransferredRequest {
  postingDate: string;
  dueDate: string;
  comment?: string;
  reasonId?: number | null;
  isDraft: boolean;
  warehouseId: number;
  distinationWarehouseId: number;
}

export interface UpdateTransferredRequest {
  transferredRequestId: number;
  postingDate: string;
  dueDate: string;
  comment?: string;
  reasonId?: number | null;
  distinationWarehouseId: number;
  isDraft: boolean;
}

export interface TransferredRequestItem {
  transferredRequestItemId?: number;
  quantity: number;
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
  transferredRequestId?: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  unitName?: string;
  batches?: TransferredRequestBatch[];
}

export interface AddTransferredRequestItem {
  uoMEntry: number;
  quantity: number;
  transferredRequestId: number;
  itemId: number;
  UnitPrice?: number;
  VatPercent?: number;
}

export interface UpdateTransferredRequestItem {
  transferredRequestItemId: number;
  quantity?: number;
  uoMEntry: number;
  UnitPrice?: number;
  VatPercent?: number;
}

export interface TransferredRequestBatch {
  transferredRequestBatchId?: number;
  transferredRequestItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate?: string;
}

export interface AddTransferredRequestBatchRequest {
  transferredRequestItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface UpdateTransferredRequestBatchRequest {
  transferredRequestBatchId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Item {
  itemId: number;
  itemName: string;
  itemCode: string;
}

export interface DestinationWarehouse {
  warehouseId: number;
  warehouseName: string;
  warehouseCode?: string;
}

export interface AddTransferredItemRequest {
  barcode?: {
    barCode: string;
  };
  item?: {
    uoMEntry: number;
    quantity: number;
    UnitPrice?: number;
    VatPercent?: number;
    transferredRequestId: number;
    itemId: number;
  };
}

export interface TransferredRequestResponse {
  success: boolean;
  message: string;
  data: {
    data: TransferredRequest[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}




