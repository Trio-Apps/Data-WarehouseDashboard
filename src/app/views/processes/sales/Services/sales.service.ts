import { Injectable } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { AddItemRequest, AddSalesBatchRequest, Sales, SalesResponse, UpdateItemRequest, UpdateSalesBatchRequest } from '../Models/sales-model';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import { UoMGroupResponse } from '../../barcodes/Models/item-barcode.model';


@Injectable({
  providedIn: 'root',
})
export class SalesService {
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
   * Get all sales for a warehouse with pagination
   * @param warehouseId Warehouse ID
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   */


  getSalesByWarehouse(
    warehouseId: number,
    pageNumber: number,
    pageSize: number
  ): Observable<SalesResponse> {
    const url = `${this.baseUrl}SalesOrder/warehouse/${warehouseId}/${pageNumber}/${pageSize}`;
    return this.http.get<SalesResponse>(url, this.headerOption);
  }

  
  getItemForSalesByWarehouse(
    warehouseId: number
  ): Observable<any> {
    const url = `${this.baseUrl}SalesOrder/item-for-sales/warehouse/${warehouseId}`;
    return this.http.get<any>(url, this.headerOption);
  }

getSalesWithFilterationByWarehouse(
  pageNumber: number,
  pageSize: number,
  warehouseId: number,
  customerId?: number,
  liveStatus?:string,
  status?: string,
  postingDate?: string,
  dueDate?: string
): Observable<SalesResponse> {
  const baseUrl = `${this.baseUrl}SalesOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

  
  // إعداد الـ query parameters
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
  if (liveStatus) {
    params = params.set('liveStatus', liveStatus.toString());
  }

  return this.http.get<SalesResponse>(baseUrl, {
    headers: this.headerOption.headers,
    params: params
  });
}


  /**
   * Get sales by ID with items
   */
  getItemsbySalesId(salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesOrderItem/status/sales-order/${salesOrderId}/1/1000`, this.headerOption);
  }
   getItemsbyWarehouseId(warehouseId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Warehouse/GetItemsByWarehouseId/${warehouseId}`, this.headerOption);
  }

  getAllItemsbySalesId(salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesOrderItem/sales-order/${salesOrderId}`, this.headerOption);
  }
 /**
   * Get sales by ID with items
   */
  getSalesById  (salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesOrder/with-customer/${salesOrderId}`, this.headerOption);
  }


  /**
   * Create new sales
   */
  createSales(sales: Sales): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesOrder`, sales, this.headerOption);
  }

  /**
   * Update sales
   */
  updateSales(sales: Sales): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesOrder/${sales.salesOrderId}`, sales, this.headerOption);
  }

  /**
   * Delete sales
   */
  deleteSales(salesOrderId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}SalesOrder/${salesOrderId}`, this.headerOption);
  }

  duplicateSales(salesOrderId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}SalesOrder/${salesOrderId}/duplicate`, {}, this.headerOption);
  }

  /**
   * Get all customers
   */
  getCustomer(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Customer`, this.headerOption);
  }

  /**
   * Search customers with pagination
   */
  getCustomersPaged(
    pageNumber: number,
    pageSize: number,
    customerCode?: string,
    customerName?: string
  ): Observable<any> {
    let params = new HttpParams();

    if (customerCode) {
      params = params.set('customerCode', customerCode);
    }

    if (customerName) {
      params = params.set('customerName', customerName);
    }

    const safePage = pageNumber < 1 ? 1 : pageNumber;
    const skip = (safePage - 1) * pageSize;

    const requestByToken = (token: number) => this.http.get<any>(`${this.baseUrl}Customer/${token}/${pageSize}`, {
      headers: this.headerOption.headers,
      params
    });

    const extractItems = (res: any): any[] => {
      const data = res?.data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data)) return data;
      return [];
    };

    const matchesRequestedPage = (res: any): boolean => {
      const current = Number(res?.data?.pageNumber);
      return Number.isFinite(current) && current === safePage;
    };

    return requestByToken(safePage).pipe(
      switchMap((primary) => {
        if (safePage <= 1) {
          return of(primary);
        }

        const primaryItems = extractItems(primary);
        if (matchesRequestedPage(primary)) {
          return of(primary);
        }
        if (primaryItems.length === 0 || skip !== safePage) {
          return requestByToken(skip).pipe(
            map((fallback) => {
              const fallbackItems = extractItems(fallback);
              if (matchesRequestedPage(fallback)) {
                return fallback;
              }
              if (primaryItems.length === 0 && fallbackItems.length > 0) {
                return fallback;
              }
              return primary;
            })
          );
        }

        return of(primary);
      })
    );
  }

  /**
   * Get items for a warehouse (for manual item selection)
   */
  getItemsByWarehouse(warehouseId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesOrder/items-in-warehouse/warehouse/${warehouseId}`, this.headerOption);
  }

  getUoMGroupByItemId(itemId: number): Observable<UoMGroupResponse> {
    return this.http.get<UoMGroupResponse>(`${this.baseUrl}Barcode/item-uom-group/${itemId}`, this.headerOption);
  }

  /**
   * Add item to sales by barcode
   */
  addItemByBarcode(salesOrderId: number, barcode: string): Observable<any> {
    const request: AddItemRequest = {
      barcode: {
        barCode: barcode
      }
    };
    return this.http.post<any>(`${this.baseUrl}salesOrderItem/sales-order/${salesOrderId}/add-barcode-or-no/${true}`, request, this.headerOption);
  }

  /**
   * Add item to sales manually
   */
  addItemManually(salesOrderId: number, itemData: {
    uoMEntry: number;
    quantity: number;
    salesOrderId: number;
    itemId: number;
  }): Observable<any> {
    const request: AddItemRequest = {
      item: itemData
    };
    return this.http.post<any>(`${this.baseUrl}salesOrderItem/sales-order/${salesOrderId}/add-barcode-or-no/${false}`, request, this.headerOption);
  }

  /**
   * Remove item from sales
   */
  removeItemFromSales( salesItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}SalesOrderItem/Sales-item-order/${salesItemId}`, this.headerOption);
  }

  /**
   * Update sales item
   */
  
  updateSalesItem(saleOrderItemId:number, itemData: UpdateItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}SalesOrderItem/Sales-item-order/${saleOrderItemId}`, itemData, this.headerOption);
  }

  /**
   * Finalize sales (convert from draft to final)
   */
  finalizeSales(salesOrderId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}sales/sales/${salesOrderId}/finalize`, {}, this.headerOption);
  }

  
    /**
     * Get Sales batches by Sales item ID
     */
    getSalesBatchesByItemId(salesOrderItemId: number): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}SalesOrderBatch/sales-order-item/${salesOrderItemId}`, this.headerOption);
    }
  
    /**
     * Add Sales batch
     */
    addSalesBatch(salesOrderItemId: number, batchData: AddSalesBatchRequest): Observable<any> {
      return this.http.post<any>(`${this.baseUrl}SalesOrderBatch/sales-order-item/${salesOrderItemId}`, batchData, this.headerOption);
    }
  
    /**
     * Update Sales batch
     */
    updateSalesBatch(batchId: number, batchData: UpdateSalesBatchRequest): Observable<any> {
      return this.http.put<any>(`${this.baseUrl}SalesOrderBatch/${batchId}`, batchData, this.headerOption);
    }
  
    /**
     * Delete Sales batch
     */
    deleteSalesBatch(batchId: number): Observable<any> {
      return this.http.delete<any>(`${this.baseUrl}SalesOrderBatch/${batchId}`, this.headerOption);
    }
  
}
