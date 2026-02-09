export interface Sales {
  salesOrderId?: number;
  postingDate: string;
  dueDate: string;
  comment: string;
  customerId: number;
  warehouseId: number;
  itemCount?:number;
  isDraft: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer;
  customerName?:string;
  items?: SalesItem[];
  canApprove?: boolean;
  approval?: boolean | null;
  approvalStatus?: string | null;
  reason?: string;
  processApprovalId?: number;
  processItemIsProgressId?:number;
  isReturn?: boolean|null;
}

export interface AddSales {
  postingDate: string;
  dueDate: string;
  comment: string;
  customerId: number;
  warehouseId: number;
  isDraft: boolean;
  
}

export interface Customer {
  customerId: number;
  customerName: string;
  customerCode?: string;
}

export interface SalesItem {
  salesOrderItemId: number;
  itemId: number;
  uoMEntry: number;
  quantity: number;
  salesOrderId?: number;
  barCode?: string;
  itemName: string;
  itemCode: string;
  perantStatus?: string;
  unitName?: string;
  comment?: string;
}

export interface Item {
  itemId: number;
  itemName: string;
  itemCode: string;
}

export interface SalesResponse {
  success: boolean;
  message: string;
  data: {
    data: Sales[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

export interface AddItemRequest {
  barcode?: {
    barCode: string;
  };
  item?: {
    uoMEntry: number;
    quantity: number;
    salesOrderId: number;
    itemId: number;
  };
}

export interface UpdateItemRequest {
  SalesOrderItemId: number;
  quantity: number;
  uoMEntry: number;
}

export interface SalesBatch {
  salesOrderBatchId?: number;
  salesOrderItemId: number;
  quantity: number;
  comment?: string;
  batchNumber?: string | null;
  expiryDate: string;
}

export interface AddSalesBatchRequest {
  salesOrderItemId: number;
  quantity: number;
  comment?: string;
  expiryDate: string;
}

export interface UpdateSalesBatchRequest {
  salesOrderBatchId: number;
  quantity: number;
  comment?: string;
  expiryDate: string;
}
