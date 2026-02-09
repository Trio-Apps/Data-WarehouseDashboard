import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
    headerOption;
 // baseUrl: string = 'http://localhost:7252/api/Account/';
  private userPayload:any;

  constructor(private router:Router,private http:HttpClient) {
    this.headerOption = {
      headers: new HttpHeaders({
        'accept': "'/*",
        'Content-Type': 'application/json',
        'Authorization':`Bearer ${this.getToken()}`
      })
    };
    //this.userPayload=this.decodedToken();
  }

  //return this.httpClient.get<IProdect>(`${environment.apiUrl}Product/${proId}`,this.headerOption);
  login(model: any): Observable<any> {

    return this.http.post<any>(`${environment.apiUrl}Auth/login`, model);

  }
 
  // register(model:any){
  //   return this.http.post<any>(`${environment.apiUrl}register`, model);
  // }
 

  // //

  // verifyCode(model:any){
  //   return this.http.post<any>(`${environment.apiUrl}email/verify-code`, model);
  // }

  // sendCodeToEmail(model:any){
  //   return this.http.post<any>(`${environment.apiUrl}email/request-code`, model);
  // }

  // // Forget Password
  
  //  sendCodeForResetPassword(model:any){
  //   return this.http.post<any>(`${environment.apiUrl}forgot-password`, model);
  // }

  // resetPassword(model:any){
  //   return this.http.post<any>(`${environment.apiUrl}reset-password`, model);
  // }

  // // policies-regulations

  // getAllPoliciesRegulations() {
  //   return this.http.get<any>(`${environment.apiUrl}policies-regulations`);

  // }


  logOut(): void {
      // Clear auth state first, then force navigation to login.
      localStorage.clear();
      this.tokenSignal.set(null);
      this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // roles

storeRoles(roles: string[]): void {
  localStorage.setItem('roles', JSON.stringify(roles));
}

getRoles(): string[] {
  const value = localStorage.getItem('roles');
  return value ? JSON.parse(value) as string[] : [];
}

hasRole(role: string): boolean {
  return this.getRoles().includes(role);
}

  // permissions

  storePermissions(permissions: string[]): void {
    localStorage.setItem('permissions', JSON.stringify(permissions || []));
  }

  getPermissions(): string[] {
    const value = localStorage.getItem('permissions');
    return value ? (JSON.parse(value) as string[]) : [];
  }

  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    const current = new Set(this.getPermissions());
    return permissions.some((permission) => current.has(permission));
  }

  storeEmailRegister(email: string) {
    localStorage.setItem('EmailRegister', email)
  }
  getEmailRegister(): string | null {
    return localStorage.getItem('EmailRegister');
  }
 

   // companyId
  storeCompanyId(companyId: number) {
    localStorage.setItem('CompanyId', companyId.toString())
  }
  getCompanyId(): number | null {
    const value = localStorage.getItem('CompanyId');
    return value ? parseInt(value) : null;
  }
  
  // Token
private readonly tokenSignal = signal<string | null>(
  localStorage.getItem('token')
);

token = this.tokenSignal.asReadonly();

// getToken(): string | null {
//   return this.token(); // ✅
// }

getToken(): string | null {
  return localStorage.getItem('token');
}

setToken(token: string): void {
  localStorage.setItem('token', token);
  this.tokenSignal.set(token);
}

clearToken(): void {
  localStorage.removeItem('token');
  this.tokenSignal.set(null);
}
  isLoggedIn(): boolean {
    return !!this.token();
  }


  // email
  storeEmail(emailValue: string) {
    localStorage.setItem('email',emailValue )
  }
  getEmail(): string | null {
    return localStorage.getItem('email');
  }
 // ClientType
  storeClientType(emailValue: string) {
    localStorage.setItem('ClientType',emailValue )
  }
  getClientType(): string | null {
    return localStorage.getItem('ClientType');
  }

  
  // id
  storeID(IdValue: string) {
    localStorage.setItem('VerifyId',IdValue)
  }
  getID(): string | null {
    return localStorage.getItem('VerifyId');
  }

  // phone
  storePhone(PhoneValue: string) {
    localStorage.setItem('Phone',PhoneValue )
  }
  getPhone(): string | null {
    return localStorage.getItem('Phone');
  }

  // name
  storeName(nameValue: string) {
    localStorage.setItem('Name',nameValue )
  }
  getName(): string | null {
    return localStorage.getItem('Name');
  }
  // name
  storeAvatar(AvatarValue: string) {
    // if(AvatarValue != 'null')
    // AvatarValue = AvatarValue.substring('/storage'.length);

    localStorage.setItem('Avatar', AvatarValue)
  }
  getAvatar(): string | null {
    return localStorage.getItem('Avatar');
  }


  //user name
  setUserName(nameValue: string) {
    localStorage.setItem('UserName',nameValue )
  }
  getUserName(): string | null {
    return localStorage.getItem('UserName');
  }

 
  // Decode token

  // decodedToken(){
  //   const jwtHelper = new JwtHelperService();
  //   const token = this.getToken()!;
  //   console.log(jwtHelper.decodeToken(token))
  //   return jwtHelper.decodeToken(token)
  // }

  // getfullNameFromToken(){
  //   if(this.userPayload)
  //   return this.userPayload.email;
  // }

  // getRoleFromToken(){
  //   if(this.userPayload)
  //   return this.userPayload.aud;
  // }
}
