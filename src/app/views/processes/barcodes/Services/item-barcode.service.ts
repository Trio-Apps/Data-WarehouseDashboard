import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ItemBarcode, ItemBarcodeResponse, UoMGroupResponse } from '../Models/item-barcode.model';
import { AuthService } from '../../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ItemBarcodeService {
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
   * Get all item barcodes with pagination
   * @param itemId Item ID
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   * @param barcode Optional barcode filter
   * @param type Optional type filter (dynamic/static)
   */
  getItemBarcodes(
    itemId: number, 
    pageNumber: number, 
    pageSize: number,
    barcode?: string,
    barCodeType?: string
  ): Observable<ItemBarcodeResponse> {
    let url = `${this.baseUrl}BarCode/item-barcodes/by-item/${itemId}/${pageNumber}/${pageSize}`;
    
    // Build query parameters
    const params: string[] = [];
    if (barcode) {
      params.push(`barcode=${encodeURIComponent(barcode)}`);
    }
    if (barCodeType) {
      params.push(`barCodeType=${encodeURIComponent(barCodeType)}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<ItemBarcodeResponse>(url, this.headerOption);
  }

  /**
   * Get item barcode by ID
   */
  getItemBarcodeById(itemBarcodeId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Barcode/item-barcodes/${itemBarcodeId}`, this.headerOption);
  }

  /**
   * Create new item barcode
   */
  createItemBarcode(itemId: number, itemBarcode: ItemBarcode): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Barcode/item-barcodes/${itemId}`, itemBarcode, this.headerOption);
  }

  /**
   * Update item barcode
   */
  updateItemBarcode(itemBarcode: ItemBarcode): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}Barcode/item-barcodes/${itemBarcode.itemBarCodeId}`, itemBarcode, this.headerOption);
  }

  /**
   * Delete item barcode
   */
  deleteItemBarcode(itemBarcodeId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}Barcode/item-barcodes/${itemBarcodeId}`, this.headerOption);
  }
  /**
   * Get UoM Group by Item ID
   */
  getUoMGroupByItemId(itemId: number): Observable<UoMGroupResponse> {
    return this.http.get<UoMGroupResponse>(`${this.baseUrl}Barcode/item-uom-group/${itemId}`, this.headerOption);
  }

}

