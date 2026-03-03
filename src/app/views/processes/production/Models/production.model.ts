export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PagedResult<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface WarehouseOption {
  warehouseId: number;
  warehouseName: string;
  sapId?: number;
}

export interface FinishedGoodItem {
  warehouseItemId?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  warehouseId?: number;
  warehouseCode?: string;
  inStock?: number;
  minStock?: number;
  isBatchManaged?: boolean;
}

export interface ProductionOrder {
  productionOrderId: number;
  postingDate: string;
  dueDate: string;
  remarks?: string;
  status: string;
  userId?: string;
  warehouseId: number;
  numberOfProductionItem?: number;
  approval?: boolean;
  approvalStatus?: string;
  canSubmit?: boolean;
}

export interface ProductionOrderItem {
  productionOrderItemId: number;
  productionOrderId: number;
  itemId: number;
  plannedQuantity: number;
  producedQuantity?: number;
  status: string;
}

export interface ProductionHeaderBatch {
  productionHeaderBatchId: number;
  productionOrderId: number;
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
}

export interface ProductionComponentLine {
  productionComponentLineId: number;
  productionOrderId: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  warehouseId: number;
  requiredQuantity: number;
  issuedQuantity?: number;
  inWhsQuantity?: number;
  issueType: string;
}

export interface ProductionComponentBatch {
  productionComponentBatchId: number;
  productionComponentLineId: number;
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
}

export interface AvailableComponentBatch {
  batchNumber: string;
  expiryDate?: string;
  quantityReceived: number;
  quantityAllocatedInOrder: number;
  quantityAvailable: number;
}

export interface AddProductionOrderPayload {
  postingDate: string;
  dueDate: string;
  remarks?: string;
  warehouseId: number;
}

export interface UpdateProductionOrderPayload extends AddProductionOrderPayload {}

export interface AddProductionOrderItemPayload {
  productionOrderId: number;
  plannedQuantity: number;
  itemId: number;
}

export interface UpdateProductionOrderItemPayload {
  plannedQuantity: number;
  producedQuantity?: number;
}

export interface AddProductionHeaderBatchPayload {
  productionOrderId: number;
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
}

export interface UpdateProductionHeaderBatchPayload {
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
}

export interface UpdateProductionComponentLinePayload {
  warehouseId: number;
  requiredQuantity: number;
  issuedQuantity?: number;
  issueType?: string;
}

export interface AddProductionComponentBatchPayload {
  productionComponentLineId: number;
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
}

export interface UpdateProductionComponentBatchPayload {
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
}
