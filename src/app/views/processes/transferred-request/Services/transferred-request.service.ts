import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AddTransferredItemRequest,
  AddTransferredRequest,
  DestinationWarehouse,
  TransferredRequestResponse,
  UpdateTransferredRequest,
  UpdateTransferredRequestItem
} from '../Models/transferred-request.model';
import { AuthService } from '../../../pages/Services/auth.service';
import { UoMGroupResponse } from '../../barcodes/Models/item-barcode.model';

@Injectable({
  providedIn: 'root'
})
export class TransferredRequestService {
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

  getTransferredRequestsByWarehouse(
    warehouseId: number,
    pageNumber: number,
    pageSize: number
  ): Observable<TransferredRequestResponse> {
    const url = `${this.baseUrl}TransferredRequestOrder/warehouse/${warehouseId}/${pageNumber}/${pageSize}`;
    return this.http.get<TransferredRequestResponse>(url, this.headerOption);
  }

  getTransferredRequestsWithFilterationByWarehouse(
    pageNumber: number,
    pageSize: number,
    warehouseId: number,
    destinationWarehouseId?: number,
    liveStatus?: string,
    status?: string,
    postingDate?: string,
    dueDate?: string
  ): Observable<TransferredRequestResponse> {
    const url = `${this.baseUrl}TransferredRequestOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

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

    return this.http.get<TransferredRequestResponse>(url, {
      headers: this.headerOption.headers,
      params
    });
  }

  getTransferredRequestById(transferredRequestId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}TransferredRequestOrder/with-warehouses/${transferredRequestId}`,
      this.headerOption
    );
  }

  getTransferredRequestByIdBasic(transferredRequestId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}TransferredRequestOrder/${transferredRequestId}`,
      this.headerOption
    );
  }

  createTransferredRequest(request: AddTransferredRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}TransferredRequestOrder`, request, this.headerOption);
  }

  updateTransferredRequest(request: UpdateTransferredRequest): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}TransferredRequestOrder/${request.transferredRequestId}`,
      request,
      this.headerOption
    );
  }

  deleteTransferredRequest(transferredRequestId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}TransferredRequestOrder/${transferredRequestId}`,
      this.headerOption
    );
  }

  duplicateTransferredRequest(transferredRequestId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}TransferredRequestOrder/${transferredRequestId}/duplicate`,
      {},
      this.headerOption
    );
  }

  retryTransferredRequestSap(transferredRequestId: number): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}TransferredRequestOrder/${transferredRequestId}/revert-partially-failed`,
      {},
      this.headerOption
    );
  }

  getItemsByTransferredRequestId(transferredRequestId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}TransferredRequestItem/transferred-request/${transferredRequestId}`,
      this.headerOption
    );
  }

  getItemsByWarehouse(warehouseId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}TransferredRequestOrder/items-in-warehouse/warehouse/${warehouseId}`,
      this.headerOption
    );
  }

  getUoMGroupByItemId(itemId: number): Observable<UoMGroupResponse> {
    return this.http.get<UoMGroupResponse>(`${this.baseUrl}Barcode/item-uom-group/${itemId}`, this.headerOption);
  }

  addItemByBarcode(transferredRequestId: number, barcode: string): Observable<any> {
    const request: AddTransferredItemRequest = {
      barcode: {
        barCode: barcode
      }
    };

    return this.http.post<any>(
      `${this.baseUrl}TransferredRequestItem/transferred-request/${transferredRequestId}/add-barcode-or-no/${true}`,
      request,
      this.headerOption
    );
  }

  addItemManually(
    transferredRequestId: number,
    itemData: {
      uoMEntry: number;
      quantity: number;
      UnitPrice?: number;
      transferredRequestId: number;
      itemId: number;
    }
  ): Observable<any> {
    const request: AddTransferredItemRequest = {
      item: itemData
    };

    return this.http.post<any>(
      `${this.baseUrl}TransferredRequestItem/transferred-request/${transferredRequestId}/add-barcode-or-no/${false}`,
      request,
      this.headerOption
    );
  }

  updateTransferredRequestItem(
    transferredRequestItemId: number,
    itemData: UpdateTransferredRequestItem
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}TransferredRequestItem/transferred-request-item/${transferredRequestItemId}`,
      itemData,
      this.headerOption
    );
  }

  deleteTransferredRequestItem(transferredRequestItemId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}TransferredRequestItem/transferred-request-item/${transferredRequestItemId}`,
      this.headerOption
    );
  }

  getWarehouses(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Warehouse`, this.headerOption);
  }

  getWarehousesPaged(
    skip: number,
    pageSize: number,
    warehouseCode?: string,
    warehouseName?: string
  ): Observable<any> {
    const url = `${this.baseUrl}Warehouse/${skip}/${pageSize}`;
    let params = new HttpParams();

    if (warehouseCode) {
      params = params.set('warehouseCode', warehouseCode);
    }

    if (warehouseName) {
      params = params.set('warehouseName', warehouseName);
    }

    return this.http.get<any>(url, {
      headers: this.headerOption.headers,
      params
    });
  }

  mapWarehouse(raw: any): DestinationWarehouse {
    return {
      warehouseId: raw?.warehouseId ?? raw?.id ?? raw?.WarehouseId,
      warehouseName: raw?.warehouseName ?? raw?.name ?? raw?.WarehouseName ?? '',
      warehouseCode: raw?.warehouseCode ?? raw?.code ?? raw?.WarehouseCode ?? ''
    };
  }
}
