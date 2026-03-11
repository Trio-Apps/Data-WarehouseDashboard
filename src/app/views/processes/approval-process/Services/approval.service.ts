import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AddApprovalStepDto,
  ApprovalStepDto,
  ApprovalStepResponse,
  ProcessSettingApprovalDto,
  ProcessApprovalResponse,
  UpdateApprovalStepDto
} from '../Models/approval-model';
import { AuthService } from '../../../pages/Services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApprovalService {
  private baseUrl = environment.apiUrl;

  headerOption;
  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`,
      }),
    };
  }

  /**
   * Get approval steps with pagination and optional filters
   */
  getApprovalSteps(
    pageNumber: number,
    pageSize: number,
    // companyId?: number | null,
    // stepName?: string,
    // roleId?: string,
    // isActive?: boolean | null
  ): Observable<ApprovalStepResponse> {
    let url = `${this.baseUrl}ApprovalStep/${pageNumber}/${pageSize}`;

    // const params: string[] = [];
    // if (companyId !== undefined && companyId !== null) {
    //   params.push(`companyId=${companyId}`);
    // }
    // if (stepName) {
    //   params.push(`stepName=${encodeURIComponent(stepName)}`);
    // }
    // if (roleId) {
    //   params.push(`roleId=${encodeURIComponent(roleId)}`);
    // }
    // if (isActive !== undefined && isActive !== null) {
    //   params.push(`isActive=${isActive}`);
    // }

    // if (params.length > 0) {
    //   url += `?${params.join('&')}`;
    // }

    return this.http.get<ApprovalStepResponse>(url, this.headerOption);
  }

  /**
   * Get approval step by id
   */
  getApprovalStepById(approvalStepId: number): Observable<ApprovalStepDto> {
    return this.http.get<ApprovalStepDto>(
      `${this.baseUrl}ApprovalStep/${approvalStepId}`,
      this.headerOption
    );
  }

  /**
   * Create new approval step
   */
  createApprovalStep(step: AddApprovalStepDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}ApprovalStep`, step, this.headerOption);
  }

  /**
   * Update approval step
   */
  updateApprovalStep(step: UpdateApprovalStepDto): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}ApprovalStep/${step.approvalStepId}`,
      step,
      this.headerOption
    );
  }

  /**
   * Delete approval step
   */
  deleteApprovalStep(approvalStepId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}ApprovalStep/${approvalStepId}`,
      this.headerOption
    );
  }

  getProcessSettings(): Observable<ProcessSettingApprovalDto[] | { data: ProcessSettingApprovalDto[] }> {
    return this.http.get<ProcessSettingApprovalDto[] | { data: ProcessSettingApprovalDto[] }>(
      `${this.baseUrl}ProcessSettingApproval`,
      this.headerOption
    );
  }

  getProcessSettingById(id: number): Observable<ProcessSettingApprovalDto | { data: ProcessSettingApprovalDto }> {
    return this.http.get<ProcessSettingApprovalDto | { data: ProcessSettingApprovalDto }>(
      `${this.baseUrl}ProcessSettingApproval/${id}`,
      this.headerOption
    );
  }

  toggleIgnoreSteps(id: number): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}ProcessSettingApproval/${id}/toggle-ignore`,
      {},
      this.headerOption
    );
  }

  /**
   * Get my process approvals with pagination
   */
  getMyProcessApprovals(pageNumber: number, pageSize: number): Observable<ProcessApprovalResponse> {
    const url = `${this.baseUrl}Approval/my-approval-process/${pageNumber}/${pageSize}`;
    return this.http.get<ProcessApprovalResponse>(url, this.headerOption);
  }

   changeApprovalStatus(approval:boolean, orderProcessApprovalId: number, comment?: string): Observable<any> {
    const url = `${this.baseUrl}Approval/make-order-is-approval/${approval}/order-process-approval-id/${orderProcessApprovalId}${comment ? `?comment=${encodeURIComponent(comment)}` : ''}`;
    return this.http.patch<any>(url, {}, this.headerOption);
  }


}
