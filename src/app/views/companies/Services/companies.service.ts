import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, CompanyResponse } from '../Models/company.model';
import { AuthService } from '../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
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
   * Get all companies with pagination
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   */
  getCompanies(pageNumber: number, pageSize: number): Observable<CompanyResponse> {
    let url = `${this.baseUrl}Company/${pageNumber}/${pageSize}`;
    return this.http.get<CompanyResponse>(url, this.headerOption);
  }

  /**
   * Get company by ID
   */
  getCompanyById(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Company/company-selected`, this.headerOption);
  }

  /**
   * Create new company
   */
  createCompany(company: Company): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Company`, company, this.headerOption);
  }

  /**
   * Update company
   */
  updateCompany(company: Company): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}Company`, company, this.headerOption);
  }

  /**
   * Delete company
   */
  deleteCompany(companyId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}Company/${companyId}`, this.headerOption);
  }

   changeStatusCompany(companyId: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}Company/${companyId}`, null, this.headerOption);
  }
    selectCompany(companyId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Company/select-company/${companyId}`,null, this.headerOption);
  }


}

