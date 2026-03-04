import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, concatMap, defaultIfEmpty, filter, map, take } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import {
  AddProductionComponentBatchPayload,
  AddProductionHeaderBatchPayload,
  AddProductionOrderItemPayload,
  AddProductionOrderPayload,
  UpdateProductionComponentBatchPayload,
  UpdateProductionComponentLinePayload,
  UpdateProductionHeaderBatchPayload,
  UpdateProductionOrderItemPayload,
  UpdateProductionOrderPayload
} from '../Models/production.model';

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
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

  getUserWarehouses(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}UserWarehouses/user/${userId}`, this.headerOption);
  }

  getProductionOrders(warehouseId: number, pageNumber = 1, pageSize = 100): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}ProductionOrder/warehouse/${warehouseId}/${pageNumber}/${pageSize}`,
      this.headerOption
    );
  }

  getProductionOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}ProductionOrder/${id}`, this.headerOption);
  }

  createProductionOrder(payload: AddProductionOrderPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}ProductionOrder`, payload, this.headerOption);
  }

  updateProductionOrder(id: number, payload: UpdateProductionOrderPayload): Observable<any> {
    const body = {
      ...payload,
      productionOrderId: id
    };

    return this.http.put<any>(`${this.baseUrl}ProductionOrder/${id}`, body, this.headerOption);
  }

  deleteProductionOrder(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}ProductionOrder/${id}`, this.headerOption);
  }

  submitProductionOrder(id: number, note?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}ProductionOrder/${id}/submit`, { note }, this.headerOption);
  }

  getFinishedGoodsByWarehouse(warehouseId: number, pageNumber = 1, pageSize = 100, itemId?: number): Observable<any> {
    let params = new HttpParams();
    if (itemId) {
      params = params.set('itemId', itemId);
    }

    return this.http.get<any>(
      `${this.baseUrl}FinishedGoodItem/GetFinishedGoodBomItemsByWarehouseId/${warehouseId}/${pageNumber}/${pageSize}`,
      {
        headers: this.headerOption.headers,
        params
      }
    );
  }

  getFinishedGoodItemByItemAndWarehouse(itemId: number, warehouseId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}FinishedGoodItem/item/${itemId}/warehouse/${warehouseId}`, this.headerOption);
  }

  getProductionOrderItems(productionOrderId: number, pageNumber = 1, pageSize = 20): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}ProductionOrderItem/status/production-order/${productionOrderId}/${pageNumber}/${pageSize}`,
      this.headerOption
    );
  }

  createProductionOrderItem(payload: AddProductionOrderItemPayload): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}ProductionOrderItem/production-order/${payload.productionOrderId}`,
      payload,
      this.headerOption
    );
  }

  updateProductionOrderItem(id: number, payload: UpdateProductionOrderItemPayload): Observable<any> {
    const body = {
      ...payload,
      productionOrderItemId: id
    };

    return this.http.put<any>(
      `${this.baseUrl}ProductionOrderItem/production-item-order/${id}`,
      body,
      this.headerOption
    );
  }

  deleteProductionOrderItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}ProductionOrderItem/production-item-order/${id}`, this.headerOption);
  }

  getProductionHeaderBatches(productionOrderId: number, pageNumber = 1, pageSize = 50): Observable<any> {
    const params = new HttpParams()
      .set('productionOrderId', productionOrderId)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<any>(`${this.baseUrl}production-header-batches`, {
      headers: this.headerOption.headers,
      params
    });
  }

  createProductionHeaderBatch(payload: AddProductionHeaderBatchPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}production-header-batches`, payload, this.headerOption);
  }

  updateProductionHeaderBatch(id: number, payload: UpdateProductionHeaderBatchPayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}production-header-batches/${id}`, payload, this.headerOption);
  }

  deleteProductionHeaderBatch(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}production-header-batches/${id}`, this.headerOption);
  }

  getProductionComponentLines(productionOrderId: number, pageNumber = 1, pageSize = 100): Observable<any> {
    const params = new HttpParams()
      .set('productionOrderId', productionOrderId)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<any>(`${this.baseUrl}production-component-lines`, {
      headers: this.headerOption.headers,
      params
    });
  }

  getProductionComponentLineById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}production-component-lines/${id}`, this.headerOption);
  }

  updateProductionComponentLine(id: number, payload: UpdateProductionComponentLinePayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}production-component-lines/${id}`, payload, this.headerOption);
  }

  deleteProductionComponentLine(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}production-component-lines/${id}`, this.headerOption);
  }

  getProductionComponentBatches(productionComponentLineId: number, pageNumber = 1, pageSize = 50): Observable<any> {
    const params = new HttpParams()
      .set('productionComponentLineId', productionComponentLineId)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<any>(`${this.baseUrl}production-component-batches`, {
      headers: this.headerOption.headers,
      params
    });
  }

  getAvailableComponentBatches(productionComponentLineId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}production-component-batches/available/${productionComponentLineId}`, this.headerOption);
  }

  getAvailableComponentBatchesFallback(itemId: number, warehouseId: number): Observable<any[]> {
    const urls = [
      `${this.baseUrl}production-component-batches/available/item/${itemId}/warehouse/${warehouseId}`,
      `${this.baseUrl}InventoryBatch/item/${itemId}/warehouse/${warehouseId}`,
      `${this.baseUrl}WarehouseItemBatch/item/${itemId}/warehouse/${warehouseId}`,
      `${this.baseUrl}Batch/item/${itemId}/warehouse/${warehouseId}`
    ];

    return from(urls).pipe(
      concatMap((url) =>
        this.http.get<any>(url, this.headerOption).pipe(
          map((res) => this.extractArray(res)),
          catchError(() => of([]))
        )
      ),
      filter((rows) => Array.isArray(rows) && rows.length > 0),
      take(1),
      defaultIfEmpty([])
    );
  }

  createProductionComponentBatch(payload: AddProductionComponentBatchPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}production-component-batches`, payload, this.headerOption);
  }

  updateProductionComponentBatch(id: number, payload: UpdateProductionComponentBatchPayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}production-component-batches/${id}`, payload, this.headerOption);
  }

  deleteProductionComponentBatch(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}production-component-batches/${id}`, this.headerOption);
  }

  private extractArray(res: any): any[] {
    if (Array.isArray(res?.data?.data)) {
      return res.data.data;
    }

    if (Array.isArray(res?.data)) {
      return res.data;
    }

    if (Array.isArray(res)) {
      return res;
    }

    return [];
  }
}
