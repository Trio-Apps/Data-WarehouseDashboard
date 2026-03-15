import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ButtonModule, CardModule, FormModule, TableModule, UtilitiesModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { finalize } from 'rxjs';
import {
  ApiResult,
  AttachmentsService,
  DocumentAttachmentDto,
  UploadDocumentRequest,
} from './Services/attachments.service';

@Component({
  selector: 'app-attachments',
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ButtonModule,
    FormModule,
    UtilitiesModule,
    IconDirective,
    DatePipe,
  ],
  templateUrl: './attachments.component.html',
  styleUrl: './attachments.component.scss',
})
export class AttachmentsComponent implements OnChanges {
  @Input() title = 'Attachments';
  @Input() documentType = '';
  @Input() documentId: number | null = null;
  @Input() allowActions = true;
  @Output() attachmentsChanged = new EventEmitter<DocumentAttachmentDto[]>();

  attachments: DocumentAttachmentDto[] = [];
  loading = false;
  uploading = false;
  deletingId: number | null = null;
  downloadingId: number | null = null;
  errorMessage = '';

  constructor(
    private attachmentsService: AttachmentsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentType'] || changes['documentId']) {
      if (this.hasValidDocument()) {
        this.loadAttachments();
      } else {
        this.attachments = [];
        this.errorMessage = '';
      }
    }
  }

  triggerAddFile(fileInput: HTMLInputElement): void {
    if (!this.hasValidDocument() || this.uploading) {
      return;
    }
    fileInput.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files ? Array.from(input.files) : [];

    if (!selectedFiles.length) {
      input.value = '';
      return;
    }

    if (!this.hasValidDocument()) {
      this.errorMessage = 'Document type and document id are required before upload.';
      input.value = '';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';

    const payload: UploadDocumentRequest = {
      documentType: this.documentType,
      documentId: this.documentId!,
      files: selectedFiles,
    };

    this.attachmentsService
      .uploadDocuments(payload)
      .pipe(
        finalize(() => {
          this.uploading = false;
          input.value = '';
          this.safeDetectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.errorMessage = this.getErrorMessage(response, 'Failed to upload attachment.');
            return;
          }

          this.loadAttachments();
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.errorMessage = this.getHttpErrorMessage(error, 'Failed to upload attachment.');
        },
      });
  }

  loadAttachments(): void {
    if (!this.hasValidDocument()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.attachmentsService
      .getDocuments(this.documentType, this.documentId!)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.safeDetectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          const rows = this.extractAttachments(response);
          this.attachments = rows.sort((a, b) => {
            const firstDate = new Date(a.attachmentDate ?? 0).getTime();
            const secondDate = new Date(b.attachmentDate ?? 0).getTime();
            return secondDate - firstDate;
          });
          this.attachmentsChanged.emit(this.attachments);
        },
        error: (error) => {
          console.error('Loading attachments failed:', error);
          this.errorMessage = this.getHttpErrorMessage(error, 'Failed to load attachments.');
        },
      });
  }

  downloadAttachment(attachment: DocumentAttachmentDto): void {
    if (!attachment.documentAttachmentId || this.downloadingId !== null) {
      return;
    }

    this.downloadingId = attachment.documentAttachmentId;
    this.errorMessage = '';

    this.attachmentsService
      .downloadDocument(attachment.documentAttachmentId)
      .pipe(
        finalize(() => {
          this.downloadingId = null;
          this.safeDetectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) {
            this.errorMessage = 'Downloaded file is empty.';
            return;
          }

          const disposition = response.headers.get('content-disposition');
          const serverFileName = this.extractFilenameFromDisposition(disposition);
          const fallbackName =
            attachment.originalFileName || attachment.fileName || `attachment-${attachment.documentAttachmentId}`;
          const fileName = serverFileName || fallbackName;

          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = fileName;
          anchor.click();
          anchor.remove();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Download failed:', error);
          this.errorMessage = this.getHttpErrorMessage(error, 'Failed to download attachment.');
        },
      });
  }

  deleteAttachment(attachment: DocumentAttachmentDto): void {
    if (!attachment.documentAttachmentId || this.deletingId !== null) {
      return;
    }

    const fileLabel = attachment.originalFileName || attachment.fileName || 'this attachment';
    if (!confirm(`Are you sure you want to delete "${fileLabel}"?`)) {
      return;
    }

    this.deletingId = attachment.documentAttachmentId;
    this.errorMessage = '';

    this.attachmentsService
      .deleteDocument(attachment.documentAttachmentId)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.safeDetectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.errorMessage = this.getErrorMessage(response, 'Failed to delete attachment.');
            return;
          }

          this.loadAttachments();
        },
        error: (error) => {
          console.error('Delete failed:', error);
          this.errorMessage = this.getHttpErrorMessage(error, 'Failed to delete attachment.');
        },
      });
  }

  getFileSizeText(attachment: DocumentAttachmentDto): string {
    if (attachment.fileSizeFormatted) {
      return attachment.fileSizeFormatted;
    }
    return this.formatBytes(attachment.fileSizeBytes || 0);
  }

  private hasValidDocument(): boolean {
    return !!this.documentType?.trim() && Number(this.documentId) > 0;
  }

  private extractAttachments(response: ApiResult<DocumentAttachmentDto[]> | undefined): DocumentAttachmentDto[] {
    if (!response) {
      return [];
    }

    const directData = response.data;
    if (Array.isArray(directData)) {
      return directData;
    }

    const nestedData = (directData as { data?: unknown } | undefined)?.data;
    if (Array.isArray(nestedData)) {
      return nestedData as DocumentAttachmentDto[];
    }

    return [];
  }

  private getErrorMessage(response: ApiResult | undefined, fallback: string): string {
    const responseMessage = typeof response?.message === 'string' ? response.message : '';
    return responseMessage || fallback;
  }

  private getHttpErrorMessage(error: any, fallback: string): string {
    if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message;
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }

  private extractFilenameFromDisposition(disposition: string | null): string | null {
    if (!disposition) {
      return null;
    }

    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      try {
        return decodeURIComponent(utfMatch[1].replace(/["']/g, ''));
      } catch {
        return utfMatch[1].replace(/["']/g, '');
      }
    }

    const asciiMatch = disposition.match(/filename="?([^"]+)"?/i);
    if (asciiMatch?.[1]) {
      return asciiMatch[1].trim();
    }

    return null;
  }

  private formatBytes(bytes: number): string {
    if (bytes <= 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const valueIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, valueIndex);
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[valueIndex]}`;
  }

  private safeDetectChanges(): void {
    try {
      this.cdr.detectChanges();
    } catch {
      // no-op
    }
  }
}
