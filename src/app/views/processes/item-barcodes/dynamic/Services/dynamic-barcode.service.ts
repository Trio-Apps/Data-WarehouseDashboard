import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DynamicBarCode, DynamicBarCodeResponse, AddDynamicBarCode, UpdateDynamicBarCode } from '../Models/dynamic-barcode.model';
import { AuthService } from '../../../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DynamicBarCodeService {
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
   * Get all dynamic barcodes with pagination
   * @param itemBarCodeId Item Barcode ID
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   * @param barCode Optional barcode filter
   */
  getDynamicBarcodes(
    itemBarCodeId: number, 
    pageNumber: number, 
    pageSize: number
    //barCode?: string
  ): Observable<DynamicBarCodeResponse> {
    let url = `${this.baseUrl}DynamicBarCode/dynamic-barcodes/by-barcode/${itemBarCodeId}/${pageNumber}/${pageSize}`;
    
    // Build query parameters
    // const params: string[] = [];
    // if (barCode) {
    //   params.push(`barCode=${encodeURIComponent(barCode)}`);
    // }
    
    // if (params.length > 0) {
    //   url += '?' + params.join('&');
    // }
    
    return this.http.get<DynamicBarCodeResponse>(url, this.headerOption);
  }

  /**
   * Get dynamic barcode by ID
   */
  getDynamicBarcodeById(dynamicBarCodeId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}DynamicBarCode/${dynamicBarCodeId}`, this.headerOption);
  }

  /**
   * Create new dynamic barcode
   */
  createDynamicBarcode(itemBarCodeId: number, dynamicBarcode: AddDynamicBarCode): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}DynamicBarCode/item-barcode-id/${itemBarCodeId}`, dynamicBarcode, this.headerOption);
  }

  /**
   * Update dynamic barcode
   */
  updateDynamicBarcode(dynamicBarcode: UpdateDynamicBarCode): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}DynamicBarCode`, dynamicBarcode, this.headerOption);
  }

  /**
   * Delete dynamic barcode
   */
  deleteDynamicBarcode(dynamicBarCodeId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}DynamicBarCode/${dynamicBarCodeId}`, this.headerOption);
  }
}

