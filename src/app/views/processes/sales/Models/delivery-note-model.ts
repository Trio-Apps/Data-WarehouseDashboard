export interface DeliveryNote {
  salesOrderId?: number;
  deliveryNoteOrderId: number;
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

export interface AddDeliveryNote {
  postingDate: string;
  dueDate: string;
  comment: string;
  customerId?: number;
  reasonId?: number | null;
  warehouseId: number;
  salesOrderId?: number;
  isDraft: boolean;
}

export interface UpdateDeliveryNote {
  deliveryNoteOrderId: number;
  postingDate?: string;
  dueDate?: string;
  comment: string;
  customerId?: number;
  reasonId?: number | null;
  warehouseId?: number;
  salesOrderId?: number;
  isDraft: boolean;
}

export interface DeliveryNoteItem {
  salesOrderItemId?: number;
  deliveryNoteItemId?: number;
  deliveryNoteOrderId?: number;
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

export interface AddDeliveryNoteItemRequest {
  salesOrderItemId: number;
  quantity: number;
  comment: string;
}

export interface UpdateDeliveryNoteItemRequest {
  deliveryNoteItemId: number;
  quantity: number;
  uoMEntry?: number;
  UnitPrice?: number;
  VatPercent?: number;
  comment: string;
}

export interface DeliveryNoteBatch {
  deliveryNoteBatchId?: number;
  deliveryNoteItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate: string;
}

export interface AddDeliveryNoteBatchRequest {
  deliveryNoteItemId: number;
  batchNumber: string;
  quantity: number;
  comment?: string;
  expiryDate: string;
}

export interface UpdateDeliveryNoteBatchRequest {
  deliveryNoteBatchId: number;
  quantity: number;
  comment?: string;
}

