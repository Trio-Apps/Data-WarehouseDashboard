import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse } from '../Models/warehouse.model';
import { Item } from '../Models/item.model';
import { AuthService } from '../../pages/Services/auth.service';

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

}
