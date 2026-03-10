import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Item } from '../Models/item.model';
import { AuthService } from '../../pages/Services/auth.service';
import {
  ApiResponse,
  InWarehouseReportFilter,
  InWarehouseReportItem,
  PagedResult,
  TransactionReportFilter,
  TransactionReportItem,
  TransactionReportSourcesCount
} from '../Models/report.model';

@Injectable({
  providedIn: 'root'
})
export class InquiryService {
  private baseUrl = environment.apiUrl;
 headerOption;
    constructor(private http:HttpClient,private auth:AuthService) {
      this.headerOption = {
        headers: new HttpHeaders({
          'accept': "*/*",
          'Content-Type': 'application/json',
          'Authorization':`Bearer ${this.auth.getToken()}`
        })
      };
     }

  /**
   * Get list of warehouses
   * Example endpoint: GET {baseUrl}/warehouses
   */

  
  getWarehouses(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Warehouse`, this.headerOption);
  }
  getSap(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Warehouse/sap`, this.headerOption);
  }

  /**
   * Get items by warehouse id
   * Example endpoint: GET {baseUrl}/warehouses/{id}/items
   */
  getItemsByWarehouse(warehouseId: string | number,skip:number,pageSize:number): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.baseUrl}Warehouse/GetItemsByWarehouseId/${warehouseId}/${skip}/${pageSize}`, this.headerOption);
  }

//GetItemsByWarehouseIdWithItemCodeAndName/1/items/1/10?itemCode=1&itemName=
 getItemsByWarehouseIdWithItemCodeAndName(
  warehouseId: string | number,
  itemCode: string,
  itemName: string,
  skip: number,
  pageSize: number
): Observable<Item[]> {

  return this.http.get<Item[]>(
    `${this.baseUrl}Warehouse/GetItemsByWarehouseIdWithItemCodeAndName/${warehouseId}/items/${skip}/${pageSize}` +
    `?itemCode=${encodeURIComponent(itemCode)}&itemName=${encodeURIComponent(itemName)}`, this.headerOption
  );
}

  getTransactionReport(
    filter: TransactionReportFilter
  ): Observable<ApiResponse<PagedResult<TransactionReportItem>>> {
    let params = new HttpParams()
      .set('warehouseId', filter.warehouseId)
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);

    if (filter.fromDate) {
      params = params.set('fromDate', filter.fromDate);
    }

    if (filter.toDate) {
      params = params.set('toDate', filter.toDate);
    }

    if (filter.transactionType) {
      params = params.set('transactionType', filter.transactionType);
    }

    if (filter.itemCodeOrName) {
      params = params.set('itemCodeOrName', filter.itemCodeOrName);
    }

    return this.http.get<ApiResponse<PagedResult<TransactionReportItem>>>(
      `${this.baseUrl}client/Warehouse/reports/transactions`,
      {
        ...this.headerOption,
        params
      }
    );
  }

  getTransactionReportSourcesCounts(
    warehouseId: number
  ): Observable<ApiResponse<TransactionReportSourcesCount>> {
    const params = new HttpParams().set('warehouseId', warehouseId);

    return this.http.get<ApiResponse<TransactionReportSourcesCount>>(
      `${this.baseUrl}client/Warehouse/reports/transactions/sources-counts`,
      {
        ...this.headerOption,
        params
      }
    );
  }

  getInWarehouseReport(
    filter: InWarehouseReportFilter
  ): Observable<ApiResponse<PagedResult<InWarehouseReportItem>>> {
    let params = new HttpParams()
      .set('warehouseId', filter.warehouseId)
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);

    if (filter.itemCodeOrName) {
      params = params.set('itemCodeOrName', filter.itemCodeOrName);
    }

    if (typeof filter.showItemsWithNoQuantityInStock === 'boolean') {
      params = params.set(
        'showItemsWithNoQuantityInStock',
        filter.showItemsWithNoQuantityInStock
      );
    }

    return this.http.get<ApiResponse<PagedResult<InWarehouseReportItem>>>(
      `${this.baseUrl}client/Warehouse/reports/in-warehouse`,
      {
        ...this.headerOption,
        params
      }
    );
  }

}
