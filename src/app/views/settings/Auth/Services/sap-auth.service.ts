import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SapAuthSettings, SapResponse } from '../Models/sap-auth.model';
import { AuthService } from '../../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SapAuthService {
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
   * Get SAP Auth Settings
   */
  selectSapWithAdmin(sapId: number): Observable<any> {
  return this.http.post<any>(
    `${this.baseUrl}Sap/select-sap/${sapId}`,
    null, // body
    this.headerOption // options (headers)
  );
}

  /**
   * Select SAP
   */
  selectSap(sapId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}Sap/select-sap/${sapId}`,
      null,
      this.headerOption
    );
  }

  /**
   * Get selected SAP details
   */
  getSelectedSap(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Sap/sap-selected`, this.headerOption);
  }

  
   /**
   * Get SAP Auth Settings
   */
  getAllSap(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Sap` , this.headerOption);
  }
  
  /**
   * Get SAP Auth Settings
   */
  getSapAuthSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Sap/sap-setting`, this.headerOption);
  }

  /**
   * Update SAP Auth Settings
   */
  updateSapAuthSettings(settings: SapAuthSettings): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}Sap`, settings, this.headerOption);
  }

  /**
   * Create new SAP connection
   */
  createSap(sap: SapAuthSettings): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Sap`, sap, this.headerOption);
  }
 deleteSap(sapId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}Sap/${sapId}`, this.headerOption);
  }

  /**
   * Get all SAP connections with pagination
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   * @param companyId Optional company ID filter
   * @param sapName Optional SAP name filter
   * @param userName Optional user name filter
   * @param companyDB Optional company DB filter
   */
  getSaps(
    pageNumber: number, 
    pageSize: number, 
    companyId?: number | null,
    sapName?: string,
    userName?: string
  ): Observable<SapResponse> {
        console.log("token",this.auth.getToken());

    let url = `${this.baseUrl}Sap/${pageNumber}/${pageSize}`;
    
    // Build query parameters
    const params: string[] = [];
    if (companyId !== undefined && companyId !== null) {
      params.push(`companyId=${companyId}`);
    }
    if (sapName) {
      params.push(`sapName=${encodeURIComponent(sapName)}`);
    }
    if (userName) {
      params.push(`userName=${encodeURIComponent(userName)}`);
    }
  
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<SapResponse>(url, this.headerOption);
  }

  getSapsbyCompanyId(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}Sap/saps-by-company-id/${companyId}`, this.headerOption);
  }
}

