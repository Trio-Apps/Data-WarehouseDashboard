import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../pages/Services/auth.service';
import { DashboardHomeInfo, DashboardSyncResponse } from '../Models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
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

  getHomeInfo(): Observable<DashboardHomeInfo> {
    return this.http.get<DashboardHomeInfo>(`${this.baseUrl}Dashboard/home`, this.headerOption);
  }

  syncData(): Observable<DashboardSyncResponse> {
    return this.http.post<DashboardSyncResponse>(`${this.baseUrl}Dashboard/sync`, null, this.headerOption);
  }
}
