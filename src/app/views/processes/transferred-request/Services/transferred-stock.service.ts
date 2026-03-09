import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import {
  AddTransferredStock,
  AddTransferredStockBatchRequest,
  AddTransferredStockItemRequest,
  AddTransferredStockWithoutRef,
  TransferredStockResponse,
  UpdateTransferredStock,
  UpdateTransferredStockBatchRequest,
  UpdateTransferredStockItemRequest
} from '../Models/transferred-stock.model';

@Injectable({
  providedIn: 'root'
})
export class TransferredStockService {
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

  getTransferredStocksByWarehouse(
    warehouseId: number,
    pageNumber: number,
    pageSize: number
  ): Observable<TransferredStockResponse> {
    const url = `${this.baseUrl}TransferredStock/warehouse/${warehouseId}/${pageNumber}/${pageSize}`;
    return this.http.get<TransferredStockResponse>(url, this.headerOption);
  }

  getTransferredStocksWithFilterationByWarehouse(
    pageNumber: number,
    pageSize: number,
    warehouseId: number,
    destinationWarehouseId?: number,
    liveStatus?: string,
    status?: string,
    postingDate?: string,
    dueDate?: string
  ): Observable<TransferredStockResponse> {
    const url = `${this.baseUrl}TransferredStock/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

    let params = new HttpParams();

    if (destinationWarehouseId) {
      params = params.set('destinationWarehouseId', destinationWarehouseId);
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

    return this.http.get<TransferredStockResponse>(url, {
      headers: this.headerOption.headers,
      params
    });
  }

  getTransferredStockById(transferredStockId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}TransferredStock/${transferredStockId}`, this.headerOption);
  }

  getTransferredStockWithItems(transferredStockId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}TransferredStock/${transferredStockId}/with-items`,
      this.headerOption
    );
  }

  createTransferredStockWithDefaultItems(
    transferredRequestId: number,
    request: AddTransferredStock
  ): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}TransferredStock/transferred-request/${transferredRequestId}/with-default-items`,
      request,
      this.headerOption
    );
  }

  createTransferredStockWithoutReference(request: AddTransferredStockWithoutRef): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}TransferredStock`, request, this.headerOption);
  }

  updateTransferredStock(request: UpdateTransferredStock): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}TransferredStock/${request.transferredStockId}`,
      request,
      this.headerOption
    );
  }

  deleteTransferredStock(transferredStockId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}TransferredStock/${transferredStockId}`, this.headerOption);
  }

  retryTransferredStockSap(transferredStockId: number): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}TransferredStock/${transferredStockId}/revert-partially-failed`,
      {},
      this.headerOption
    );
  }

  getTransferredItemsByStockId(transferredStockId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}TransferredItem/transferred-stock/${transferredStockId}`,
      this.headerOption
    );
  }

  addTransferredStockItemByBarcode(transferredStockId: number, barcode: string): Observable<any> {
    const request: AddTransferredStockItemRequest = {
      barcode: {
        barCode: barcode
      }
    };

    return this.http.post<any>(
      `${this.baseUrl}TransferredItem/transferred-stock/${transferredStockId}/add-barcode-or-no/${true}`,
      request,
      this.headerOption
    );
  }

  addTransferredStockItemManually(
    transferredStockId: number,
    itemData: {
      uoMEntry: number;
      quantity?: number;
      transferredStockId: number;
      itemId: number;
      transferredRequestItemId: number;
    }
  ): Observable<any> {
    const request: AddTransferredStockItemRequest = {
      item: itemData
    };

    return this.http.post<any>(
      `${this.baseUrl}TransferredItem/transferred-stock/${transferredStockId}/add-barcode-or-no/${false}`,
      request,
      this.headerOption
    );
  }

  createTransferredItemByTransferredRequestItemId(
    transferredStockId: number,
    transferredRequestItemId: number,
    quantity?: number
  ): Observable<any> {
    let params = new HttpParams();
    if (quantity !== undefined && quantity !== null) {
      params = params.set('quantity', quantity);
    }

    return this.http.post<any>(
      `${this.baseUrl}TransferredItem/transferred-stock/${transferredStockId}/transferred-request-item/${transferredRequestItemId}`,
      {},
      {
        headers: this.headerOption.headers,
        params
      }
    );
  }

  updateTransferredStockItem(
    transferredItemId: number,
    itemData: UpdateTransferredStockItemRequest
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}TransferredItem/transferred-item/${transferredItemId}`,
      itemData,
      this.headerOption
    );
  }

  deleteTransferredItem(transferredItemId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}TransferredItem/transferred-item/${transferredItemId}`,
      this.headerOption
    );
  }

  getTransferredStockBatchesByItemId(transferredItemId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}TransferredStockBatch/transferred-item/${transferredItemId}`,
      this.headerOption
    );
  }

  addTransferredStockBatch(
    transferredItemId: number,
    batchData: AddTransferredStockBatchRequest
  ): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}TransferredStockBatch/transferred-item/${transferredItemId}`,
      batchData,
      this.headerOption
    );
  }

  updateTransferredStockBatch(
    transferredStockBatchId: number,
    batchData: UpdateTransferredStockBatchRequest
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}TransferredStockBatch/${transferredStockBatchId}`,
      batchData,
      this.headerOption
    );
  }

  deleteTransferredStockBatch(transferredStockBatchId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}TransferredStockBatch/${transferredStockBatchId}`,
      this.headerOption
    );
  }
}
