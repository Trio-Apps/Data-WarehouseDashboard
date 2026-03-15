import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';

export interface UploadDocumentRequest {
  documentType: string;
  documentId: number;
  files: File[];
  description?: string;
}

export interface DocumentAttachmentDto {
  documentAttachmentId: number;
  documentType: string | number;
  documentName?: string | null;
  sourcePath: string;
  filePath: string;
  fullPath: string;
  documentId: number;
  fileName: string;
  originalFileName: string;
  fileExtension: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  contentType: string;
  description?: string | null;
  attachmentDate: string;
  uploadedBy: string;
  downloadUrl: string;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AttachmentsService {
  private baseUrl = environment.apiUrl;
  private documentsUrl = `${this.baseUrl}Documents`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(includeJsonContentType = true): HttpHeaders {
    const headersConfig: Record<string, string> = {
      accept: '*/*',
      Authorization: `Bearer ${this.auth.getToken()}`,
    };

    if (includeJsonContentType) {
      headersConfig['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headersConfig);
  }

  uploadDocuments(payload: UploadDocumentRequest): Observable<ApiResult<DocumentAttachmentDto[]>> {
    const formData = new FormData();
    formData.append('documentType', payload.documentType);
    formData.append('documentId', String(payload.documentId));

    if (payload.description) {
      formData.append('description', payload.description);
    }

    payload.files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.http.post<ApiResult<DocumentAttachmentDto[]>>(
      `${this.documentsUrl}/upload`,
      formData,
      {
        headers: this.getHeaders(false),
      }
    );
  }

  getDocuments(documentType: string, documentId: number): Observable<ApiResult<DocumentAttachmentDto[]>> {
    return this.http.get<ApiResult<DocumentAttachmentDto[]>>(
      `${this.documentsUrl}/${encodeURIComponent(documentType)}/${documentId}`,
      { headers: this.getHeaders() }
    );
  }

  downloadDocument(documentAttachmentId: number): Observable<HttpResponse<Blob>> {
    return this.http.patch(`${this.documentsUrl}/${documentAttachmentId}/download`, {}, {
      headers: this.getHeaders(),
      observe: 'response',
      responseType: 'blob',
    });
  }

  deleteDocument(documentAttachmentId: number): Observable<ApiResult> {
    return this.http.delete<ApiResult>(
      `${this.documentsUrl}/${documentAttachmentId}`,
      { headers: this.getHeaders() }
    );
  }

  getDocumentStatus(): Observable<ApiResult> {
    return this.http.get<ApiResult>(
      `${this.documentsUrl}/status`,
      { headers: this.getHeaders() }
    );
  }
}
