import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import { AddReturnItemRequest, UpdateReturn, UpdateReturnBatchRequest, UpdateReturnItemRequest } from '../Models/sales-return-model';

@Injectable({
  providedIn: 'root',
})
export class SalesReturnService {
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
   * Get all Saless for a warehouse with pagination
   * @param warehouseId Warehouse ID
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   */


  
  /**
   * Get Return by Sales order ID
   */
  getReturnBySalesId(SalesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrder/sales-order/${SalesOrderId}`, this.headerOption);
  }

    getReturnWithCustomerBySalesId(SalesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrder/by-sales-order/${SalesOrderId}`, this.headerOption);
  }

  /**
   * Update Return
   */
  updateReturn(ReturnId: number, ReturnData: UpdateReturn): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesReturnOrder/${ReturnId}`, ReturnData, this.headerOption);
  }

  /**
   * Get Return items by Return ID
   */
  getReturnItemsByReturnId(ReturnId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrderItem/sales-return-order/${ReturnId}`, this.headerOption);
  }

  

  /**
   * Add Return item 
   */
  addReturnItem(SalesOrderId: number, itemData: AddReturnItemRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrderItem/sales-order/${SalesOrderId}`, itemData, this.headerOption);
  }

  /**
   * Update Return item
   */
  updateReturnItem(ReturnItemId:number, itemData: UpdateReturnItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesReturnOrderItem/${ReturnItemId}`, itemData, this.headerOption);
  }

  /**
   * Delete Return item
   */
  deleteReturnItem(ReturnItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}SalesReturnOrderItem/${ReturnItemId}`, this.headerOption);
  }

   /**
   * Get Return batches by Return item ID
   */
  getReturnBatchesByItemId(ReturnItemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrderBatch/sales-return-order-item/${ReturnItemId}`, this.headerOption);
  }

  /**
   * Add Return batch
   */
  // addReturnBatch(ReturnItemId: number, batchData: AddReturnBatchRequest): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}SalesReturnOrderBatch/${ReturnItemId}`, batchData, this.headerOption);
  // }

  /**
   * Update Return batch
   */
  updateReturnBatch(batchId: number, batchData: UpdateReturnBatchRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesReturnOrderBatch/${batchId}`, batchData, this.headerOption);
  }

  /**
   * Delete Return batch
   */
  deleteReturnBatch(batchId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}SalesReturnOrderBatch/${batchId}`, this.headerOption);
  }
}
