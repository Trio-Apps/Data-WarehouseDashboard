import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import {
  AddQuantityAdjustmentStock,
  AddQuantityAdjustmentStockBatchRequest,
  AddQuantityAdjustmentStockItemRequest,
  QuantityAdjustmentStockResponse,
  UpdateQuantityAdjustmentStock,
  UpdateQuantityAdjustmentStockBatchRequest,
  UpdateQuantityAdjustmentStockItemRequest
} from '../Models/quantity-adjustment-stock.model';

@Injectable({
  providedIn: 'root'
})
export class QuantityAdjustmentStockService {
  private baseUrl = environment.apiUrl;

  headerOption;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.headerOption = {
      headers: new HttpHeaders({
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`
      })
    };
  }

  getQuantityAdjustmentStocksByWarehouse(
    warehouseId: number,
    pageNumber: number,
    pageSize: number
  ): Observable<QuantityAdjustmentStockResponse> {
    const url = `${this.baseUrl}QuantityAdjustmentStock/warehouse/${warehouseId}/${pageNumber}/${pageSize}`;
    return this.http.get<QuantityAdjustmentStockResponse>(url, this.headerOption);
  }

  getQuantityAdjustmentStocksWithFilterationByWarehouse(
    pageNumber: number,
    pageSize: number,
    warehouseId: number,
    status?: string,
    postingDate?: string,
    dueDate?: string
  ): Observable<QuantityAdjustmentStockResponse> {
    const url = `${this.baseUrl}QuantityAdjustmentStock/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;
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

    return this.http.get<QuantityAdjustmentStockResponse>(url, {
      headers: this.headerOption.headers,
      params
    });
  }

  getQuantityAdjustmentStockById(quantityAdjustmentStockId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}QuantityAdjustmentStock/${quantityAdjustmentStockId}`,
      this.headerOption
    );
  }

  getQuantityAdjustmentStockByIdWithWarehouse(quantityAdjustmentStockId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}QuantityAdjustmentStock/with-warehouse/${quantityAdjustmentStockId}`,
      this.headerOption
    );
  }

  createQuantityAdjustmentStock(request: AddQuantityAdjustmentStock): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}QuantityAdjustmentStock`, request, this.headerOption);
  }

  updateQuantityAdjustmentStock(
    quantityAdjustmentStockId: number,
    request: UpdateQuantityAdjustmentStock
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}QuantityAdjustmentStock/${quantityAdjustmentStockId}`,
      request,
      this.headerOption
    );
  }

  retryQuantityAdjustmentStockSap(quantityAdjustmentStockId: number): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}QuantityAdjustmentStock/${quantityAdjustmentStockId}/revert-partially-failed`,
      {},
      this.headerOption
    );
  }

  deleteQuantityAdjustmentStock(quantityAdjustmentStockId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}QuantityAdjustmentStock/${quantityAdjustmentStockId}`,
      this.headerOption
    );
  }

  duplicateQuantityAdjustmentStock(quantityAdjustmentStockId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}QuantityAdjustmentStock/${quantityAdjustmentStockId}/duplicate`,
      {},
      this.headerOption
    );
  }

  getQuantityAdjustmentItemsByStockId(quantityAdjustmentStockId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}QuantityAdjustmentStockItem/quantity-adjustment-stock/${quantityAdjustmentStockId}`,
      this.headerOption
    );
  }

  addQuantityAdjustmentStockItemByBarcode(
    quantityAdjustmentStockId: number,
    barcode: string
  ): Observable<any> {
    const request: AddQuantityAdjustmentStockItemRequest = {
      barcode: {
        barCode: barcode
      }
    };

    return this.http.post<any>(
      `${this.baseUrl}QuantityAdjustmentStockItem/quantity-adjustment-stock/${quantityAdjustmentStockId}/add-barcode-or-no/${true}`,
      request,
      this.headerOption
    );
  }

  addQuantityAdjustmentStockItemManually(
    quantityAdjustmentStockId: number,
    itemData: {
      uoMEntry: number;
      quantity?: number;
      unitPrice?: number;
      vatPercent?: number;
      itemId: number;
      quantityAdjustmentStockId?: number;
    }
  ): Observable<any> {
    const request: AddQuantityAdjustmentStockItemRequest = {
      item: itemData
    };

    return this.http.post<any>(
      `${this.baseUrl}QuantityAdjustmentStockItem/quantity-adjustment-stock/${quantityAdjustmentStockId}/add-barcode-or-no/${false}`,
      request,
      this.headerOption
    );
  }

  updateQuantityAdjustmentStockItem(
    quantityAdjustmentStockItemId: number,
    itemData: UpdateQuantityAdjustmentStockItemRequest
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}QuantityAdjustmentStockItem/quantity-adjustment-stock-item/${quantityAdjustmentStockItemId}`,
      itemData,
      this.headerOption
    );
  }

  deleteQuantityAdjustmentStockItem(quantityAdjustmentStockItemId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}QuantityAdjustmentStockItem/quantity-adjustment-stock-item/${quantityAdjustmentStockItemId}`,
      this.headerOption
    );
  }

  getQuantityAdjustmentStockBatchesByItemId(quantityAdjustmentStockItemId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}QuantityAdjustmentStockBatch/quantity-adjustment-stock-item/${quantityAdjustmentStockItemId}`,
      this.headerOption
    );
  }

  addQuantityAdjustmentStockBatch(
    quantityAdjustmentStockItemId: number,
    batchData: AddQuantityAdjustmentStockBatchRequest
  ): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}QuantityAdjustmentStockBatch/quantity-adjustment-stock-item/${quantityAdjustmentStockItemId}`,
      batchData,
      this.headerOption
    );
  }

  updateQuantityAdjustmentStockBatch(
    quantityAdjustmentStockBatchId: number,
    batchData: UpdateQuantityAdjustmentStockBatchRequest
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}QuantityAdjustmentStockBatch/${quantityAdjustmentStockBatchId}`,
      batchData,
      this.headerOption
    );
  }

  deleteQuantityAdjustmentStockBatch(quantityAdjustmentStockBatchId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}QuantityAdjustmentStockBatch/${quantityAdjustmentStockBatchId}`,
      this.headerOption
    );
  }
}
