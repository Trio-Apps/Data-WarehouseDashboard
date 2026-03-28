import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import { SearchScanApiResponse } from '../Models/search-scan.model';

@Injectable({
  providedIn: 'root'
})
export class SearchScanService {
  private readonly baseUrl = environment.apiUrl;

  private readonly headerOption;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`
      })
    };
  }

  searchDocuments(query: string, pageNumber: number, pageSize: number): Observable<SearchScanApiResponse> {
    const url = `${this.baseUrl}SearchScanFlexibility/scan`;
    const params = new HttpParams()
      .set('query', query)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<SearchScanApiResponse>(url, {
      headers: this.headerOption.headers,
      params
    });
  }
}
