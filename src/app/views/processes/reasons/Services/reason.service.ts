import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AddReasonDto, ProcessTypeOption, ReasonDto, UpdateReasonDto } from '../Models/reason.model';
import { AuthService } from '../../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReasonService {
  private readonly baseUrl = `${environment.apiUrl}Reasons`;
  private readonly headerOption;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.headerOption = {
      headers: new HttpHeaders({
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`
      })
    };
  }

  getProcessTypes(): Observable<ProcessTypeOption[] | { data: ProcessTypeOption[] }> {
    return this.http.get<ProcessTypeOption[] | { data: ProcessTypeOption[] }>(
      `${this.baseUrl}/process-types`,
      this.headerOption
    );
  }

  getReasonsByProcessType(processType: string): Observable<ReasonDto[] | { data: ReasonDto[] }> {
    return this.http.get<ReasonDto[] | { data: ReasonDto[] }>(
      `${this.baseUrl}/by-process-type/${encodeURIComponent(processType)}`,
      this.headerOption
    );
  }

  
  addReason(dto: AddReasonDto): Observable<any> {
    return this.http.post<any>(this.baseUrl, dto, this.headerOption);
  }


  updateReason(reasonId: number, dto: UpdateReasonDto): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${reasonId}`, dto, this.headerOption);
  }


  deleteReason(reasonId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${reasonId}`, this.headerOption);
  }


}
