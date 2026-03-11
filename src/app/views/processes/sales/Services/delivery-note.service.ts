import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import {
  AddDeliveryNote,
  AddDeliveryNoteBatchRequest,
  AddDeliveryNoteItemRequest,
  UpdateDeliveryNote,
  UpdateDeliveryNoteBatchRequest,
  UpdateDeliveryNoteItemRequest
} from '../Models/delivery-note-model';
import { AddGeneralItemRequest, UpdateGeneralItemRequest } from '../../Models/general-order';

@Injectable({
  providedIn: 'root',
})
export class DeliveryNoteService {
  private baseUrl = environment.apiUrl;

  headerOption;
  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`
      })
      
    };
  }

  getSalesDeliveryNoteOrdersWithFilterationByWarehouse(
    pageNumber: number,
    pageSize: number,
    warehouseId: number,
    customerId?: number,
    status?: string,
    postingDate?: string,
    dueDate?: string
  ): Observable<any> {
    const baseUrl = `${this.baseUrl}DeliveryNoteOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

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

  getDeliveryNoteBySalesId(salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}DeliveryNoteOrder/sales-order/${salesOrderId}`, this.headerOption);
  }

  getDeliveryNoteWithCustomerBySalesId(salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}DeliveryNoteOrder/by-sales-order/${salesOrderId}`, this.headerOption);
  }

  getDeliveryNoteById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}DeliveryNoteOrder/${id}`, this.headerOption);
  }

  createDeliveryNote(deliveryNoteData: AddDeliveryNote): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}DeliveryNoteOrder`, deliveryNoteData, this.headerOption);
  }

  createDeliveryNoteWithOutReference(deliveryNoteData: AddDeliveryNote): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}DeliveryNoteOrder/without-reference`, deliveryNoteData, this.headerOption);
  }

  createDeliveryNoteWithDefaultItems(deliveryNoteData: AddDeliveryNote): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}DeliveryNoteOrder/with-default-items`, deliveryNoteData, this.headerOption);
  }

  updateDeliveryNote(deliveryNoteId: number, deliveryNoteData: UpdateDeliveryNote): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}DeliveryNoteOrder/${deliveryNoteId}`, deliveryNoteData, this.headerOption);
  }


  deleteDeliveryNoteOrder(deliveryNoteId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}DeliveryNoteOrder/${deliveryNoteId}`, this.headerOption);
  }

  /**
   * Revert a partially failed delivery note order back to processing for SAP sync.
   */
  retryDeliveryNoteSap(deliveryNoteOrderId: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}DeliveryNoteOrder/${deliveryNoteOrderId}/revert-partially-failed`, {}, this.headerOption);
  }

  getDeliveryNoteItemsByDeliveryNoteId(deliveryNoteId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}DeliveryNoteItem/delivery-note-order/${deliveryNoteId}`, this.headerOption);
  }

  addDeliveryNoteItem(salesOrderId: number, itemData: AddDeliveryNoteItemRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}DeliveryNoteItem/sales-order/${salesOrderId}`, itemData, this.headerOption);
  }

  addDeliveryNoteItemByBarcode(deliveryNoteOrderId: number, barcode: string): Observable<any> {
    const request: AddGeneralItemRequest = {
      barcode: {
        barCode: barcode
      }
    };
    return this.http.post<any>(`${this.baseUrl}DeliveryNoteItem/witout-reference/delivery-note-order/${deliveryNoteOrderId}/add-barcode-or-no/${true}`, request, this.headerOption);
  }

  addDeliveryNoteItemManually(deliveryNoteOrderId: number, itemData: {
    uoMEntry: number;
    quantity: number;
    itemId: number;
  }): Observable<any> {
    const request: AddGeneralItemRequest = {
      item: itemData
    };
    return this.http.post<any>(`${this.baseUrl}DeliveryNoteItem/witout-reference/delivery-note-order/${deliveryNoteOrderId}/add-barcode-or-no/${false}`, request, this.headerOption);
  }

  updateDeliveryNoteItem(deliveryNoteItemId: number, itemData: UpdateDeliveryNoteItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}DeliveryNoteItem/${deliveryNoteItemId}`, itemData, this.headerOption);
  }

  updateDeliveryNoteItemWithoutReference(deliveryNoteItemId: number, itemData: UpdateGeneralItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}DeliveryNoteItem/without-reference/${deliveryNoteItemId}`, itemData, this.headerOption);
  }

  deleteDeliveryNoteItem(deliveryNoteItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}DeliveryNoteItem/${deliveryNoteItemId}`, this.headerOption);
  }

  getDeliveryNoteBatchesByItemId(deliveryNoteItemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}DeliveryNoteBatch/delivery-note-item/${deliveryNoteItemId}`, this.headerOption);
  }

  addDeliveryNoteBatch(deliveryNoteItemId: number, batchData: AddDeliveryNoteBatchRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}DeliveryNoteBatch/delivery-note-item/${deliveryNoteItemId}`, batchData, this.headerOption);
  }

  updateDeliveryNoteBatch(batchId: number, batchData: UpdateDeliveryNoteBatchRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}DeliveryNoteBatch/${batchId}`, batchData, this.headerOption);
  }

  deleteDeliveryNoteBatch(batchId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}DeliveryNoteBatch/${batchId}`, this.headerOption);
  }
}
