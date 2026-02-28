import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import {
  AddReturn,
  AddReturnBatchRequest,
  AddReturnItemRequest,
  UpdateReturn,
  UpdateReturnBatchRequest,
  UpdateReturnItemRequest
} from '../Models/sales-return-model';
import { AddGeneralItemRequest, UpdateGeneralItemRequest } from '../../Models/general-order';

@Injectable({
  providedIn: 'root',
})
export class SalesReturnService {
  private baseUrl = environment.apiUrl;

  headerOption;
  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.auth.getToken()}`
      })
    };
  }

  getSalesReturnOrdersWithFilterationByWarehouse(
    pageNumber: number,
    pageSize: number,
    warehouseId: number,
    customerId?: number,
    status?: string,
    postingDate?: string,
    dueDate?: string
  ): Observable<any> {
    const baseUrl = `${this.baseUrl}SalesReturnOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

    let params = new HttpParams();

    if (customerId) {
      params = params.set('customerId', customerId);
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

    return this.http.get<any>(baseUrl, {
      headers: this.headerOption.headers,
      params
    });
  }

  getReturnBySalesId(salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrder/sales-order/${salesOrderId}`, this.headerOption);
  }

  getReturnWithCustomerBySalesId(salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrder/by-sales-order/${salesOrderId}`, this.headerOption);
  }

  getReturnById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrder/${id}`, this.headerOption);
  }

  createReturn(returnData: AddReturn): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrder`, returnData, this.headerOption);
  }

  createReturnWithOutReference(returnData: AddReturn): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrder/without-reference`, returnData, this.headerOption);
  }

  createReturnWithDefaultItems(returnData: AddReturn): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrder/with-default-items`, returnData, this.headerOption);
  }

  updateReturn(returnId: number, returnData: UpdateReturn): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesReturnOrder/${returnId}`, returnData, this.headerOption);
  }

  deleteReturnOrder(returnId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}SalesReturnOrder/${returnId}`, this.headerOption);
  }

  getReturnItemsByReturnId(returnId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrderItem/sales-return-order/${returnId}`, this.headerOption);
  }

  addReturnItem(salesOrderId: number, itemData: AddReturnItemRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrderItem/sales-order/${salesOrderId}`, itemData, this.headerOption);
  }

  addReturnItemByBarcode(returnOrderId: number, barcode: string): Observable<any> {
    const request: AddGeneralItemRequest = {
      barcode: {
        barCode: barcode
      }
    };
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrderItem/witout-reference/sales-return-order/${returnOrderId}/add-barcode-or-no/${true}`, request, this.headerOption);
  }

  addReturnItemManually(returnOrderId: number, itemData: {
    uoMEntry: number;
    quantity: number;
    itemId: number;
  }): Observable<any> {
    const request: AddGeneralItemRequest = {
      item: itemData
    };
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrderItem/witout-reference/sales-return-order/${returnOrderId}/add-barcode-or-no/${false}`, request, this.headerOption);
  }

  updateReturnItem(returnItemId: number, itemData: UpdateReturnItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesReturnOrderItem/${returnItemId}`, itemData, this.headerOption);
  }

  updateReturnItemWithoutReference(returnItemId: number, itemData: UpdateGeneralItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesReturnOrderItem/witout-reference/${returnItemId}`, itemData, this.headerOption);
  }

  deleteReturnItem(returnItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}SalesReturnOrderItem/${returnItemId}`, this.headerOption);
  }

  getReturnBatchesByItemId(returnItemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesReturnOrderBatch/sales-return-order-item/${returnItemId}`, this.headerOption);
  }

  addReturnBatch(returnItemId: number, batchData: AddReturnBatchRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesReturnOrderBatch/sales-return-order-item/${returnItemId}`, batchData, this.headerOption);
  }

  updateReturnBatch(batchId: number, batchData: UpdateReturnBatchRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesReturnOrderBatch/${batchId}`, batchData, this.headerOption);
  }

  deleteReturnBatch(batchId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}SalesReturnOrderBatch/${batchId}`, this.headerOption);
  }
}
