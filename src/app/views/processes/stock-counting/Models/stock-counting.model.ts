export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | null;
}

export interface WarehouseOption {
  warehouseId: number;
  warehouseName: string;
}

export interface CountStockOrder {
  countStockId: number;
  status: string;
  liveStatus?: string | null;
  userId: string;
  comment?: string | null;
  createdAt?: string;
  postingDate: string;
  dueDate?: string | null;
  mode?: string | null;
  warehouseId: number;
}

export interface CountStockItem {
  countStockItemId: number;
  quantity: number;
  status: string;
  errorMessage?: string | null;
  uoMEntry: number;
  barCode?: string | null;
  unitPrice?: number | null;
  comment?: string | null;
  countStockId: number;
  itemId: number;
  isBatchManaged?: boolean;
}

export interface CountStockBatch {
  countStockBatchId: number;
  countStockItemId: number;
  quantity: number;
  comment?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
}

export interface AddCountStockOrderPayload {
  isDraft: boolean;
  comment?: string;
  postingDate: string;
  mode?: 'Counting' | 'Posting';
  warehouseId: number;
}

export interface UpdateCountStockOrderPayload {
  countStockId: number;
  postingDate: string;
  comment?: string;
  mode?: 'Counting' | 'Posting';
}

export interface AddCountStockItemPayload {
  uoMEntry: number;
  quantity: number;
  countStockId: number;
  itemId: number;
}

export interface UpdateCountStockItemPayload {
  countStockItemId: number;
  quantity?: number;
  uoMEntry: number;
}

export interface AddCountStockBatchPayload {
  countStockItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface UpdateCountStockBatchPayload {
  countStockBatchId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string;
  expiryDate?: string;
}
