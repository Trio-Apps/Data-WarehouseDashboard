import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../pages/Services/auth.service';
import {
  DashboardHomeInfo,
  DashboardSyncResponse,
  DueTodayInventoryTask,
  DueTodayProductionOrder,
  DueTodaySummary,
  DueTodayTransferRequest
} from '../Models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
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

  getHomeInfo(): Observable<DashboardHomeInfo> {
    return this.http.get<DashboardHomeInfo>(`${this.baseUrl}Dashboard/home`, this.headerOption);
  }

  syncData(): Observable<DashboardSyncResponse> {
    return this.http.post<DashboardSyncResponse>(`${this.baseUrl}Dashboard/sync`, null, this.headerOption);
  }

  getDueTodaySummary(warehouseId?: number): Observable<DueTodaySummary> {
    const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
    return this.http
      .get<any>(`${this.baseUrl}Dashboard/due-today${query}`, this.headerOption)
      .pipe(map((response) => this.mapDueTodaySummary(response)));
  }

  private mapDueTodaySummary(response: any): DueTodaySummary {
    return {
      PurchaseOrdersDueToday: response?.PurchaseOrdersDueToday ?? response?.purchaseOrdersDueToday ?? 0,
      DeliveriesDueToday: response?.DeliveriesDueToday ?? response?.deliveriesDueToday ?? 0,
      ProductionOrdersDueToday: response?.ProductionOrdersDueToday ?? response?.productionOrdersDueToday ?? 0,
      TransferredRequestsDueToday: response?.TransferredRequestsDueToday ?? response?.transferredRequestsDueToday ?? 0,
      TransferredStockDueToday: response?.TransferredStockDueToday ?? response?.transferredStockDueToday ?? 0,
      ReceivedStockDueToday: response?.ReceivedStockDueToday ?? response?.receivedStockDueToday ?? 0,
      QuantityAdjustmentsDueToday: response?.QuantityAdjustmentsDueToday ?? response?.quantityAdjustmentsDueToday ?? 0,
      SalesOrdersDueToday: response?.SalesOrdersDueToday ?? response?.salesOrdersDueToday ?? 0,
      SalesReturnOrdersDueToday: response?.SalesReturnOrdersDueToday ?? response?.salesReturnOrdersDueToday ?? 0,
      ReceiptPurchaseOrdersDueToday: response?.ReceiptPurchaseOrdersDueToday ?? response?.receiptPurchaseOrdersDueToday ?? 0,
      GoodsReturnOrdersDueToday: response?.GoodsReturnOrdersDueToday ?? response?.goodsReturnOrdersDueToday ?? 0,
      TotalDueToday: response?.TotalDueToday ?? response?.totalDueToday ?? 0,
      TransferRequests: (response?.TransferRequests ?? response?.transferRequests ?? []).map((item: any) =>
        this.mapTransferRequest(item)
      ),
      ProductionOrders: (response?.ProductionOrders ?? response?.productionOrders ?? []).map((item: any) =>
        this.mapProductionOrder(item)
      ),
      InventoryTasks: (response?.InventoryTasks ?? response?.inventoryTasks ?? []).map((item: any) =>
        this.mapInventoryTask(item)
      )
    };
  }

  private mapTransferRequest(item: any): DueTodayTransferRequest {
    return {
      TransferredRequestId: item?.TransferredRequestId ?? item?.transferredRequestId ?? 0,
      WarehouseId: item?.WarehouseId ?? item?.warehouseId ?? 0,
      ReferenceNumber: item?.ReferenceNumber ?? item?.referenceNumber ?? '',
      SourceWarehouseName: item?.SourceWarehouseName ?? item?.sourceWarehouseName ?? null,
      DestinationWarehouseName: item?.DestinationWarehouseName ?? item?.destinationWarehouseName ?? null,
      SubmittedBy: item?.SubmittedBy ?? item?.submittedBy ?? null,
      SubmittedDate: item?.SubmittedDate ?? item?.submittedDate ?? '',
      DueDate: item?.DueDate ?? item?.dueDate ?? '',
      ItemCount: item?.ItemCount ?? item?.itemCount ?? 0
    };
  }

  private mapProductionOrder(item: any): DueTodayProductionOrder {
    return {
      ProductionOrderId: item?.ProductionOrderId ?? item?.productionOrderId ?? 0,
      WarehouseId: item?.WarehouseId ?? item?.warehouseId ?? 0,
      ReferenceNumber: item?.ReferenceNumber ?? item?.referenceNumber ?? '',
      ItemName: item?.ItemName ?? item?.itemName ?? null,
      PlannedQuantity: item?.PlannedQuantity ?? item?.plannedQuantity ?? 0,
      WarehouseName: item?.WarehouseName ?? item?.warehouseName ?? null,
      DueDate: item?.DueDate ?? item?.dueDate ?? '',
      ItemCount: item?.ItemCount ?? item?.itemCount ?? 0
    };
  }

  private mapInventoryTask(item: any): DueTodayInventoryTask {
    return {
      QuantityAdjustmentStockId:
        item?.QuantityAdjustmentStockId ?? item?.quantityAdjustmentStockId ?? 0,
      WarehouseId: item?.WarehouseId ?? item?.warehouseId ?? 0,
      ReferenceNumber: item?.ReferenceNumber ?? item?.referenceNumber ?? '',
      ItemName: item?.ItemName ?? item?.itemName ?? null,
      WarehouseName: item?.WarehouseName ?? item?.warehouseName ?? null,
      DueDate: item?.DueDate ?? item?.dueDate ?? '',
      ItemCount: item?.ItemCount ?? item?.itemCount ?? 0
    };
  }
}
