import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BarCodeSetting, BarCodeSettingResponse } from '../Models/barcode-setting.model';
import { AuthService } from '../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BarCodeSettingService {
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
   * Get all barcode settings with pagination
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   */
  getBarCodeSettings(pageNumber: number, pageSize: number): Observable<BarCodeSettingResponse> {
    let url = `${this.baseUrl}BarCodeSetting/settings/${pageNumber}/${pageSize}`;
    return this.http.get<BarCodeSettingResponse>(url, this.headerOption);
  }

  /**
   * Get barcode setting by ID
   */
  getBarCodeSettingById(barCodeSettingId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}BarCodeSetting/settings/${barCodeSettingId}`, this.headerOption);
  }

  /**
   * Create new barcode setting
   */
  createBarCodeSetting(barCodeSetting: BarCodeSetting): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}BarCodeSetting/settings`, barCodeSetting, this.headerOption);
  }

  /**
   * Update barcode setting
   */
  updateBarCodeSetting(barCodeSetting: BarCodeSetting): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}BarCodeSetting/settings`, barCodeSetting, this.headerOption);
  }

  /**
   * Delete barcode setting
   */
  deleteBarCodeSetting(barCodeSettingId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}BarCodeSetting/settings/${barCodeSettingId}`, this.headerOption);
  }
}

