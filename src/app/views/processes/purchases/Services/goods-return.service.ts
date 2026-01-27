import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import { AddReturnItemRequest, UpdateReturn, UpdateReturnBatchRequest, UpdateReturnItemRequest } from '../Models/retrun-model';

@Injectable({
  providedIn: 'root',
})
export class GoodsReturnService {
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
   * Get all Receipts for a warehouse with pagination
   * @param warehouseId Warehouse ID
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   */


  /**
   * Get Return by Receipt order ID
   */
  getReturnByReceiptId(ReceiptOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}GoodsReturnOrder/receipt-purchase-order/${ReceiptOrderId}`, this.headerOption);
  }

  /**
   * Update Return
   */
  updateReturn(ReturnId: number, ReturnData: UpdateReturn): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}GoodsReturnOrder/${ReturnId}`, ReturnData, this.headerOption);
  }

  /**
   * Get Return items by Return ID
   */
  getReturnItemsByReturnId(ReturnId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}GoodsReturnOrderItem/goods-return-order/${ReturnId}`, this.headerOption);
  }

  

  /**
   * Add Return item 
   */
  addReturnItem(ReceiptOrderId: number, itemData: AddReturnItemRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}GoodsReturnOrderItem/receipt-purchase-order/${ReceiptOrderId}`, itemData, this.headerOption);
  }

  /**
   * Update Return item
   */
  updateReturnItem(ReturnItemId:number, itemData: UpdateReturnItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}GoodsReturnOrderItem/${ReturnItemId}`, itemData, this.headerOption);
  }

  /**
   * Delete Return item
   */
  deleteReturnItem(ReturnItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}GoodsReturnOrderItem/${ReturnItemId}`, this.headerOption);
  }

   /**
   * Get Return batches by Return item ID
   */
  getReturnBatchesByItemId(ReturnItemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}GoodsReturnOrderBatch/goods-return-order-item/${ReturnItemId}`, this.headerOption);
  }

  /**
   * Add Return batch
   */
  // addReturnBatch(ReturnItemId: number, batchData: AddReturnBatchRequest): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}GoodsReturnOrderBatch/${ReturnItemId}`, batchData, this.headerOption);
  // }

  /**
   * Update Return batch
   */
  updateReturnBatch(batchId: number, batchData: UpdateReturnBatchRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}GoodsReturnOrderBatch/${batchId}`, batchData, this.headerOption);
  }

  /**
   * Delete Return batch
   */
  deleteReturnBatch(batchId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}GoodsReturnOrderBatch/${batchId}`, this.headerOption);
  }
}
