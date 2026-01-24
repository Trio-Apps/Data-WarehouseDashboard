export interface Purchase {
  purchaseOrderId?: number;
  postingDate: string;
  dueDate: string;
  comment: string;
  supplierId: number;
  warehouseId: number;

  isDraft: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  supplier?: Supplier;
  supplierName?:string;
  items?: PurchaseItem[];
}

export interface AddPurchase {
  postingDate: string;
  dueDate: string;
  comment: string;
  supplierId: number;
  warehouseId: number;

  isDraft: boolean;
  
}

export interface Supplier {
  supplierId: number;
  supplierName: string;
  supplierCode?: string;
}

export interface PurchaseItem {
  purchaseItemId?: number;
  purchaseId?: number;
  itemId: number;
  uoMEntry: number;
  quantity: number;
  purchaseOrderId?: number;
  barCode?: string;
  itemName: string;
  itemCode: string;
  perantStatus?: string;
  unitName?: string;
}

export interface Item {
  itemId: number;
  itemName: string;
  itemCode: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data: {
    data: Purchase[];
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
    purchaseOrderId: number;
    itemId: number;
  };
}

export interface UpdateItemRequest {
  purchaseOrderItemId: number;
  quantity: number;
  uoMEntry: number;
}
