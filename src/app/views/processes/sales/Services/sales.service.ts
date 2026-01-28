import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AddItemRequest, Sales, SalesResponse } from '../Models/sales-model';
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
   * Get all saless for a warehouse with pagination
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

getSalesWithFilterationByWarehouse(
  pageNumber: number,
  pageSize: number,
  warehouseId: number,
  liveStatus?:string,
  status?: string,
  postingDate?: string,
  dueDate?: string
): Observable<SalesResponse> {
  const baseUrl = `${this.baseUrl}SalesOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

  // إعداد الـ query parameters
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

  getAllItemsbySalesId(salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesOrderItem/sales-order/${salesOrderId}`, this.headerOption);
  }
 /**
   * Get sales by ID with items
   */
  getSalesById  (salesOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}SalesOrder/with-supplier/${salesOrderId}`, this.headerOption);
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

  /**
   * Get all suppliers
   */
  getSuppliers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Supplier`, this.headerOption);
  }

  /**
   * Get items for a warehouse (for manual item selection)
   */
  getItemsByWarehouse(warehouseId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}FinishedGoodsalesOrder/warehouse/${warehouseId}`, this.headerOption);
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
  removeItemFromSales(salesOrderId: number, salesItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}sales/${salesOrderId}/items/${salesItemId}`, this.headerOption);
  }

  /**
   * Update sales item
   */
  updateSalesItem(itemData: {
    salesOrderItemId: number;
    quantity: number;
    uoMEntry: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}salesOrderItem`, itemData, this.headerOption);
  }

  /**
   * Finalize sales (convert from draft to final)
   */
  finalizeSales(salesOrderId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}sales/sales/${salesOrderId}/finalize`, {}, this.headerOption);
  }

  
}
