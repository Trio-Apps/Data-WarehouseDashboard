import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddRole, AddRoleWithPermissions, Permission, PermissionForRoleResponse, PermissionResponse, Role, RoleResponse, UpdateRoleWithPermissions } from '../Models/role.model';
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
    
    return this.http.get<RoleResponse>(url);
  }

  getPermissions(): Observable<PermissionResponse> {
    let url = `${this.baseUrl}Permissions`;
    
    return this.http.get<PermissionResponse>(url);
  }
   getAllRoles(): Observable<RoleResponse> {
    let url = `${this.baseUrl}Role`;
    return this.http.get<RoleResponse>(url);
  }

  getRoleWithInAndUnactivePermissions(roleId :number): Observable<PermissionForRoleResponse> {
    let url = `${this.baseUrl}Permissions/role/${roleId}`;
    
    return this.http.get<PermissionForRoleResponse>(url);
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

    createRoleWithPermissions(role: AddRoleWithPermissions): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Permissions/roles`, role);
  }


  /**
   * Update role
   */
  updateRole(roleId: number, role: Role): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}Role/${roleId}`, role);
  }

   updateRoleWithPermissions(roleId: number, role: UpdateRoleWithPermissions): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}Permissions/roles/${roleId}/permissions`, role);
  }

  /**
   * Delete role
   */
  deleteRole(roleName: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}Role/${roleName}`, this.headerOption);
  }
  
}

