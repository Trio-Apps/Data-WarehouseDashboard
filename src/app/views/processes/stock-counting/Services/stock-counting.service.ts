import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import {
  AddCountStockBatchPayload,
  AddCountStockItemPayload,
  AddCountStockOrderPayload,
  UpdateCountStockBatchPayload,
  UpdateCountStockItemPayload,
  UpdateCountStockOrderPayload
} from '../Models/stock-counting.model';

@Injectable({
  providedIn: 'root'
})
export class StockCountingService {
  private baseUrl = environment.apiUrl;
  private headerOption;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`
      })
    };
  }

  getWarehouses(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Warehouse`, this.headerOption);
  }

  getOrdersByWarehouse(warehouseId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}CountStock/warehouse/${warehouseId}`, this.headerOption);
  }

  getOrdersByWarehousePaged(warehouseId: number, pageNumber = 1, pageSize = 100): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}CountStock/warehouse/${warehouseId}/${pageNumber}/${pageSize}`,
      this.headerOption
    );
  }

  getOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}CountStock/${id}`, this.headerOption);
  }

  createOrder(payload: AddCountStockOrderPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}CountStock`, payload, this.headerOption);
  }

  updateOrder(id: number, payload: UpdateCountStockOrderPayload): Observable<any> {
    const body = { ...payload, countStockId: id };
    return this.http.put<any>(`${this.baseUrl}CountStock/${id}`, body, this.headerOption);
  }

  deleteOrder(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}CountStock/${id}`, this.headerOption);
  }

  submitOrder(id: number, note?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}CountStock/${id}/submit`, { note }, this.headerOption);
  }

  getItemsByOrder(countStockId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}CountStockItem/count-stock/${countStockId}`, this.headerOption);
  }

  getWarehouseItemsForSelection(
    warehouseId: number,
    pageNumber = 1,
    pageSize = 1000,
    itemCode = '',
    itemName = ''
  ): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}Warehouse/GetItemsByWarehouseIdWithItemCodeAndName/${warehouseId}/items/${pageNumber}/${pageSize}` +
      `?itemCode=${encodeURIComponent(itemCode)}&itemName=${encodeURIComponent(itemName)}`,
      this.headerOption
    );
  }

  addItem(countStockId: number, payload: AddCountStockItemPayload): Observable<any> {
    const body = { item: payload };
    return this.http.post<any>(
      `${this.baseUrl}CountStockItem/Count-stock/${countStockId}/add-barcode-or-no/false`,
      body,
      this.headerOption
    );
  }

  updateItem(id: number, payload: UpdateCountStockItemPayload): Observable<any> {
    const body = { ...payload, countStockItemId: id };
    return this.http.put<any>(`${this.baseUrl}CountStockItem/Count-stock-item/${id}`, body, this.headerOption);
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}CountStockItem/Count-stock-item/${id}`, this.headerOption);
  }

  getBatchesByItem(countStockItemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}CountStockBatch/count-stock-item/${countStockItemId}`, this.headerOption);
  }

  addBatch(countStockItemId: number, payload: AddCountStockBatchPayload): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}CountStockBatch/count-stock-item/${countStockItemId}`,
      payload,
      this.headerOption
    );
  }

  updateBatch(id: number, payload: UpdateCountStockBatchPayload): Observable<any> {
    const body = { ...payload, countStockBatchId: id };
    return this.http.put<any>(`${this.baseUrl}CountStockBatch/${id}`, body, this.headerOption);
  }

  deleteBatch(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}CountStockBatch/${id}`, this.headerOption);
  }
}
