import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Purchase, Supplier, PurchaseResponse, AddItemRequest, Item } from '../Models/purchase.model';
import { AuthService } from '../../../pages/Services/auth.service';
import { UoMGroupResponse } from '../../barcodes/Models/item-barcode.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
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


  getPurchasesByWarehouse(
    warehouseId: number,
    pageNumber: number,
    pageSize: number
  ): Observable<PurchaseResponse> {
    const url = `${this.baseUrl}PurchaseOrder/warehouse/${warehouseId}/${pageNumber}/${pageSize}`;
    return this.http.get<PurchaseResponse>(url, this.headerOption);
  }

getPurchasesWithFilterationByWarehouse(
  pageNumber: number,
  pageSize: number,
  warehouseId: number,
  liveStatus?:string,
  status?: string,
  postingDate?: string,
  dueDate?: string
): Observable<PurchaseResponse> {
  const baseUrl = `${this.baseUrl}PurchaseOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

  // إعداد الـ query parameters
  let params = new HttpParams();


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
  return this.http.get<PurchaseResponse>(baseUrl, {
    headers: this.headerOption.headers,
    params: params
  });
}


  /**
   * Get purchase by ID with items
   */
  getItemsbyPurchaseId(purchaseOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}PurchaseOrderItem/status/purchase-order/${purchaseOrderId}/1/1000`, this.headerOption);
  }

  getAllItemsbyPurchaseId(purchaseOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}PurchaseOrderItem/purchase-order/${purchaseOrderId}`, this.headerOption);
  }
 /**
   * Get purchase by ID with items
   */
  getPurchaseById(purchaseOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}PurchaseOrder/with-supplier/${purchaseOrderId}`, this.headerOption);
  }


  /**
   * Create new purchase
   */
  createPurchase(purchase: Purchase): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}PurchaseOrder`, purchase, this.headerOption);
  }

  /**
   * Update purchase
   */
  updatePurchase(purchase: Purchase): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}PurchaseOrder/${purchase.purchaseOrderId}`, purchase, this.headerOption);
  }

  /**
   * Delete purchase
   */
  deletePurchase(purchaseOrderId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}PurchaseOrder/${purchaseOrderId}`, this.headerOption);
  }

  /**
   * Get all suppliers
   */
  getSuppliers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Supplier`, this.headerOption);
  }

  /**
   * Get items for a warehouse (for manual item selection)
   */
  getItemsByWarehouse(warehouseId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}FinishedGoodPurchaseOrder/warehouse/${warehouseId}`, this.headerOption);
  }

  getUoMGroupByItemId(itemId: number): Observable<UoMGroupResponse> {
    return this.http.get<UoMGroupResponse>(`${this.baseUrl}Barcode/item-uom-group/${itemId}`, this.headerOption);
  }

  /**
   * Add item to purchase by barcode
   */
  addItemByBarcode(purchaseOrderId: number, barcode: string): Observable<any> {
    const request: AddItemRequest = {
      barcode: {
        barCode: barcode
      }
    };
    return this.http.post<any>(`${this.baseUrl}PurchaseOrderItem/Purchase-order/${purchaseOrderId}/add-barcode-or-no/${true}`, request, this.headerOption);
  }

  /**
   * Add item to purchase manually
   */
  addItemManually(purchaseOrderId: number, itemData: {
    uoMEntry: number;
    quantity: number;
    purchaseOrderId: number;
    itemId: number;
  }): Observable<any> {
    const request: AddItemRequest = {
      item: itemData
    };
    return this.http.post<any>(`${this.baseUrl}PurchaseOrderItem/Purchase-order/${purchaseOrderId}/add-barcode-or-no/${false}`, request, this.headerOption);
  }

  /**
   * Remove item from purchase
   */
  removeItemFromPurchase(purchaseOrderId: number, purchaseItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}Purchase/purchases/${purchaseOrderId}/items/${purchaseItemId}`, this.headerOption);
  }

  /**
   * Update purchase item
   */
  updatePurchaseItem(id:number ,itemData: {
    quantity: number;
    uoMEntry: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}PurchaseOrderItem/Purchase-item-order/${id}`, itemData, this.headerOption);
  }

  /**
   * Finalize purchase (convert from draft to final)
   */
  finalizePurchase(purchaseOrderId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}Purchase/purchases/${purchaseOrderId}/finalize`, {}, this.headerOption);
  }

  
}
