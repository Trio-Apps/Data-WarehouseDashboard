export interface DueTodayTransferRequest {
  TransferredRequestId: number;
  WarehouseId: number;
  ReferenceNumber: string;
  SourceWarehouseName?: string | null;
  DestinationWarehouseName?: string | null;
  SubmittedBy?: string | null;
  SubmittedDate: string;
  DueDate: string;
  ItemCount: number;
}

export interface DueTodayProductionOrder {
  ProductionOrderId: number;
  WarehouseId: number;
  ReferenceNumber: string;
  ItemName?: string | null;
  PlannedQuantity: number;
  WarehouseName?: string | null;
  DueDate: string;
  ItemCount: number;
}

export interface DueTodayInventoryTask {
  QuantityAdjustmentStockId: number;
  WarehouseId: number;
  ReferenceNumber: string;
  ItemName?: string | null;
  WarehouseName?: string | null;
  DueDate: string;
  ItemCount: number;
}

export interface DashboardHomeInfo {
  userName?: string;
  databaseName?: string;
  lastSyncAt?: string | null;
}

export interface DashboardSyncResponse {
  lastSyncAt?: string | null;
  message?: string;
}

export interface DueTodaySummary {
  PurchaseOrdersDueToday: number;
  DeliveriesDueToday: number;
  ProductionOrdersDueToday: number;
  TransferredRequestsDueToday: number;
  TransferredStockDueToday: number;
  ReceivedStockDueToday: number;
  QuantityAdjustmentsDueToday: number;
  SalesOrdersDueToday: number;
  SalesReturnOrdersDueToday: number;
  ReceiptPurchaseOrdersDueToday: number;
  GoodsReturnOrdersDueToday: number;
  TotalDueToday: number;
  TransferRequests: DueTodayTransferRequest[];
  ProductionOrders: DueTodayProductionOrder[];
  InventoryTasks: DueTodayInventoryTask[];
}
