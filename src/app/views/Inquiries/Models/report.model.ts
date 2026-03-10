export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: any;
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

export interface TransactionReportFilter {
  warehouseId: number;
  pageNumber: number;
  pageSize: number;
  fromDate?: string;
  toDate?: string;
  transactionType?: string;
  itemCodeOrName?: string;
}

export interface InWarehouseReportFilter {
  warehouseId: number;
  pageNumber: number;
  pageSize: number;
  itemCodeOrName?: string;
  showItemsWithNoQuantityInStock?: boolean;
}

export interface TransactionReportItem {
  document: string;
  transactionType: string;
  direction: string;
  baseReference: number | null;
  transactionDate: string;
  warehouseId: number;
  warehouseCode: string | null;
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
}

export interface InWarehouseReportItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  uoM: string;
  inStock: number | null;
  warehouseId: number;
  warehouseCode: string;
}

export interface TransactionReportSourcesCount {
  warehouseId: number;
  goodsReceiptCount: number;
  goodsIssueCount: number;
  transferOutCount: number;
  transferInCount: number;
  countingCount: number;
  productionReceiptCount: number;
  salesDeliveryCount: number;
  salesReturnCount: number;
  totalCount: number;
}
