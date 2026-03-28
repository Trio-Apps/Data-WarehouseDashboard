import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../../views/pages/Services/auth.service';
import { ApiResponse, AppNotification, PagedResult } from './notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly baseUrl = environment.apiUrl;

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

  getMyNotifications(
    pageNumber: number,
    pageSize: number,
    unreadOnly = false
  ): Observable<ApiResponse<PagedResult<AppNotification>>> {
    const url = `${this.baseUrl}Notification/my/${pageNumber}/${pageSize}?unreadOnly=${unreadOnly}`;
    return this.http.get<ApiResponse<PagedResult<AppNotification>>>(url, this.headerOption);
  }

  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(
      `${this.baseUrl}Notification/unread-count`,
      this.headerOption
    );
  }

  markAsRead(notificationId: number): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(
      `${this.baseUrl}Notification/${notificationId}/read`,
      {},
      this.headerOption
    );
  }

  markAllAsRead(): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(
      `${this.baseUrl}Notification/mark-all-read`,
      {},
      this.headerOption
    );
  }
}
