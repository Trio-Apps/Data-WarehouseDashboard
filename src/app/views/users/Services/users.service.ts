import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddUser, UpdateUser, User, UserResponse } from '../Models/user.model';
import { AuthService } from '../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
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
   * Get all users with pagination
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   * @param companyId Optional company ID filter
   * @param sapId Optional SAP ID filter
   * @param email Optional email filter
   * @param name Optional name filter
   */
  getUsers(
    pageNumber: number, 
    pageSize: number,
    companyId?: number | null,
    sapId?: number | null,
    email?: string,
    name?: string
  ): Observable<UserResponse> {
    let url = `${this.baseUrl}User/${pageNumber}/${pageSize}`;
    
    // Build query parameters
    const params: string[] = [];
    if (companyId !== undefined && companyId !== null) {
      params.push(`companyId=${companyId}`);
    }
    if (sapId !== undefined && sapId !== null) {
      params.push(`sapId=${sapId}`);
    }
    if (email) {
      params.push(`email=${encodeURIComponent(email)}`);
    }
    if (name) {
      params.push(`name=${encodeURIComponent(name)}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
  
    return this.http.get<UserResponse>(url);
  }

  /**
   * Get user by ID
   */
  getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}User/${userId}`);
  }

   getWarehousesBySapId(sapId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Warehouse/sap/${sapId}`, this.headerOption);
  }

  /**
   * Create new user
   */
  createUser(user: User): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}User`, user, this.headerOption);
  }

  /**
   * Update user
   */
  updateUser(user: User): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}User`, user, this.headerOption);
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}User/${userId}`, this.headerOption);
  }
}

