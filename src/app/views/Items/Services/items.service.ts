import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../pages/Services/auth.service';

export interface WarehouseItemLookup {
  itemId: number;
  itemCode?: string;
  itemName?: string;
}

export type WarehouseItemLookupSource = 'transferred' | 'purchase' | 'sales';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
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

  searchItemsByWarehouseForInventory(
    warehouseId: number,
    itemCodeOrItemName?: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Observable<any> {
    return this.searchItemsByWarehouseByController(
      'TransferredRequestOrder',
      warehouseId,
      itemCodeOrItemName,
      pageNumber,
      pageSize
    );
  }

  searchItemsByWarehouseForPurchase(
    warehouseId: number,
    itemCodeOrItemName?: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Observable<any> {
    return this.searchItemsByWarehouseByController(
      'FinishedGoodPurchaseOrder',
      warehouseId,
      itemCodeOrItemName,
      pageNumber,
      pageSize
    );
  }

  searchItemsByWarehouseForSales(
    warehouseId: number,
    itemCodeOrItemName?: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Observable<any> {
    return this.searchItemsByWarehouseByController(
      'SalesOrder',
      warehouseId,
      itemCodeOrItemName,
      pageNumber,
      pageSize
    );
  }

  private searchItemsByWarehouseByController(
    controller: 'TransferredRequestOrder' | 'FinishedGoodPurchaseOrder' | 'SalesOrder',
    warehouseId: number,
    itemCodeOrItemName?: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Observable<any> {
    const url = `${this.baseUrl}${controller}/search-pagination/warehouse/${warehouseId}`;

    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (itemCodeOrItemName?.trim()) {
      params = params.set('itemCodeOrItemName', itemCodeOrItemName.trim());
    }

    return this.http.get<any>(url, {
      headers: this.headerOption.headers,
      params
    });
  }
}
