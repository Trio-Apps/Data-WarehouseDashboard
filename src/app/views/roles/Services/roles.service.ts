import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddRole, Role, RoleResponse } from '../Models/role.model';
import { AuthService } from '../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
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
   * Get all roles with pagination
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   * @param searchTerm Optional search term for filtering
   * @param roleName Page number (1-based)

   */
  getRoles(pageNumber: number, pageSize: number): Observable<RoleResponse> {
    let url = `${this.baseUrl}Role/${pageNumber}/${pageSize}`;
    
    return this.http.get<RoleResponse>(url, this.headerOption);
  }
   getAllRoles(): Observable<RoleResponse> {
    let url = `${this.baseUrl}Role`;
    
    return this.http.get<RoleResponse>(url, this.headerOption);
  }

  /**
   * Get role by ID
   */
  getRoleById(roleId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}Role/${roleId}`, this.headerOption);
  }

  /**
   * Create new role
   */
  createRole(role: AddRole): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Role`, role, this.headerOption);
  }

  /**
   * Update role
   */
  updateRole(roleId: number, role: Role): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}Role/${roleId}`, role, this.headerOption);
  }

  /**
   * Delete role
   */
  deleteRole(roleName: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}Role/${roleName}`, this.headerOption);
  }
}

