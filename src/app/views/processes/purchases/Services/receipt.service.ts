import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Purchase, Supplier, AddItemRequest, Item } from '../Models/purchase.model';
import { AuthService } from '../../../pages/Services/auth.service';
import { UoMGroupResponse } from '../../barcodes/Models/item-barcode.model';
import {
  AddReceiptItemRequest,
  UpdateReceiptItemRequest,
  AddReceiptBatchRequest,
  UpdateReceiptBatchRequest,
  ReceiptResponse
} from '../Models/receipt';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private baseUrl = environment.apiUrl;

  headerOption;
  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        'accept': "*/*",
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.auth.getToken()}`
      })
    };
  }

  /**
   * Get all purchases for a warehouse with pagination
   * @param warehouseId Warehouse ID
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   */

getReceiptsWithFilterationByWarehouse(
  pageNumber: number,
  pageSize: number,
  warehouseId: number,
  supplierId?:number,
  liveStatus?:string,
  status?: string,
  postingDate?: string,
  dueDate?: string
): Observable<ReceiptResponse> {
  const baseUrl = `${this.baseUrl}ReceiptPurchaseOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;
  // إعداد الـ query parameters
  let params = new HttpParams();

  if (supplierId) {
    params = params.set('supplierId', supplierId);
  }
  if (status) {
    params = params.set('status', status);
  }
  if (postingDate) {
    params = params.set('postingDate', postingDate);
  }
  if (dueDate) {
    params = params.set('dueDate', dueDate);
  }
   
   
 if (liveStatus) {
    params = params.set('liveStatus', liveStatus);
  }
  return this.http.get<ReceiptResponse>(baseUrl, {
    headers: this.headerOption.headers,
    params: params
  });
}

  /**
   * Get receipt by purchase order ID
   */
  getReceiptByPurchaseId(purchaseOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}ReceiptPurchaseOrder/purchase-order/${purchaseOrderId}`, this.headerOption);
  }
   getReceiptById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}ReceiptPurchaseOrder/${id}`, this.headerOption);
  }

  /**
   * Create receipt for purchase order
   */
  createReceipt(receiptData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}ReceiptPurchaseOrder`, receiptData, this.headerOption);
  }
  
  createReceiptWithDefaultItems(receiptData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}ReceiptPurchaseOrder/with-default-items`, receiptData, this.headerOption);
  }

  createReceiptWithoutReference(receiptData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}ReceiptPurchaseOrder/without-reference`, receiptData, this.headerOption);
  }
  
  /**
   * Update receipt
   */

  updateReceipt(receiptId: number, receiptData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}ReceiptPurchaseOrder/${receiptId}`, receiptData, this.headerOption);
  }
  updateReceiptWithoutReference(receiptId: number, receiptData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}ReceiptPurchaseOrder/${receiptId}`, receiptData, this.headerOption);
  }
  /**
   * Delete receipt
   */
  deleteReceipt(receiptId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}ReceiptPurchaseOrder/${receiptId}`, this.headerOption);
  }

  /**
   * Retry SAP sync for a receipt order that failed integration.
   */
  retryReceiptSap(receiptPurchaseOrderId: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}ReceiptPurchaseOrder/retry-sap/${receiptPurchaseOrderId}`, {}, this.headerOption);
  }

  /**
   * Get receipt items by receipt ID
   */
  getReceiptItemsByReceiptId(receiptId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}ReceiptPurchaseOrderItem/receipt-purchase-order/${receiptId}`, this.headerOption);
  }




  /**
   * Add receipt item by barcode
   */
  addReceiptItemByBarcode(receiptPurchaseOrderId: number, barcode: string): Observable<any> {
    const request: AddReceiptItemRequest = {
      barcode: {
        barCode: barcode
      }
    };
    return this.http.post<any>(`${this.baseUrl}ReceiptPurchaseOrderItem/Receipt-purchase-order/${receiptPurchaseOrderId}/add-barcode-or-no/${true}`, request, this.headerOption);
  }

  /**
   * Add receipt item manually
   */
  addReceiptItemManually(receiptPurchaseOrderId: number, itemData: {
    uoMEntry: number;
    quantity: number;
    UnitPrice?: number;
    receiptPurchaseOrderId: number;
    itemId: number;
  }): Observable<any> {
    const request: AddReceiptItemRequest = {
      item: itemData
    };
    return this.http.post<any>(`${this.baseUrl}ReceiptPurchaseOrderItem/Receipt-purchase-order/${receiptPurchaseOrderId}/add-barcode-or-no/${false}`, request, this.headerOption);
  }

  /**
   * Update receipt item
   */
  updateReceiptItem(receiptItemId:number, itemData: UpdateReceiptItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}ReceiptPurchaseOrderItem/Receipt-purchase-item-order/${receiptItemId}`, itemData, this.headerOption);
  }

  /**
   * Delete receipt item
   */
  deleteReceiptItem(receiptItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}ReceiptPurchaseOrderItem/Receipt-purchase-item-order/${receiptItemId}`, this.headerOption);
  }

  /**
   * Get receipt batches by receipt item ID
   */
  getReceiptBatchesByItemId(receiptPurchaseOrderItemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}ReceiptPurchaseOrderBatch/receipt-purchase-order-item/${receiptPurchaseOrderItemId}`, this.headerOption);
  }

  /**
   * Add receipt batch
   */
  addReceiptBatch(receiptItemId: number, batchData: AddReceiptBatchRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}ReceiptPurchaseOrderBatch/receipt-purchase-order-item/${receiptItemId}`, batchData, this.headerOption);
  }

  /**
   * Update receipt batch
   */
  updateReceiptBatch(batchId: number, batchData: UpdateReceiptBatchRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}ReceiptPurchaseOrderBatch/${batchId}`, batchData, this.headerOption);
  }

  /**
   * Delete receipt batch
   */
  deleteReceiptBatch(batchId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}ReceiptPurchaseOrderBatch/${batchId}`, this.headerOption);
  }

  
}

