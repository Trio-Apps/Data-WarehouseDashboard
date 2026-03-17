import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ButtonModule,
  CardModule,
  FormModule,
  GridModule,
  PaginationModule,
  TableModule
} from '@coreui/angular';
import { SearchScanApiResponse, SearchScanDocument, SearchScanPagedResponse } from '../Models/search-scan.model';
import { SearchScanService } from '../Services/search-scan.service';

@Component({
  selector: 'app-search-scan',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    PaginationModule
  ],
  templateUrl: './search-scan.component.html',
  styleUrl: './search-scan.component.scss',
})
export class SearchScanComponent {
  form: FormGroup<{ search: FormControl<string> }>;

  documents: SearchScanPagedResponse['data'] = [];
  loading = false;
  requestError = '';
  hasSearched = false;

  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 0;
  totalItems = 0;
  hasNext = false;
  hasPrevious = false;

  readonly Math = Math;
  private readonly supportedProcessTypes = new Set<string>([
    'purchase',
    'purchases',
    'purchaseorder',
    'goodsreturn',
    'goodsreturnorder',
    'deliverynote',
    'deliverynoteorder',
    'sales',
    'salesorder',
    'salesreturn',
    'salesreturnorder',
    'receipt',
    'receiptorder',
    'receiptpurchaseorder',
    'transferred',
    'transferredrequest',
    'transferredrequestorder',
    'transfer',
    'transferredstock',
    'transferredstockorder',
    'stocktransferred',
    'quantityadjustmentstock',
    'quantityadjustmentstockorder',
    'quantityadjustment',
    'adjustmentstock',
    'countingadjustment',
    'stockcounting',
    'stockcount',
    'countstock',
    'stockcountingorder',
    'production',
    'productionorder'
  ]);

  constructor(
    private fb: FormBuilder,
    private searchScanService: SearchScanService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
  ) {
    this.form = this.fb.nonNullable.group({
      search: ''
    });
  }

  goBack(): void {
    this.location.back();
  }

  canNavigateToOrder(document: SearchScanDocument): boolean {
    const processType = this.resolveProcessType(document);
    const referenceId = this.resolveReferenceId(document);
    return this.isSupportedProcessType(processType) && referenceId > 0;
  }

  onOpenOrder(document: SearchScanDocument): void {
    const processType = this.resolveProcessType(document);
    const referenceId = this.resolveReferenceId(document);

    if (!this.isSupportedProcessType(processType) || referenceId <= 0) {
      return;
    }

    this.navigateToOrder(processType, referenceId);
  }

  get paginatedDocuments(): SearchScanPagedResponse['data'] {
    return this.documents;
  }

  get searchTerm(): string {
    return this.form.controls.search.value.trim();
  }

  onSearch(): void {
    this.currentPage = 1;
    if (!this.searchTerm) {
      this.hasSearched = false;
      this.resetResults();
      return;
    }

    this.hasSearched = true;
    this.loadSearchResults(this.currentPage);
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (!this.searchTerm || this.totalPages <= 0) {
      return;
    }

    let nextPage = page;
    if (nextPage < 1) {
      nextPage = 1;
    }
    if (nextPage > this.totalPages) {
      nextPage = this.totalPages;
    }

    if (nextPage === this.currentPage) {
      return;
    }

    this.loadSearchResults(nextPage);
  }

  onNextPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasNext) {
      this.onPageChange(this.currentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasPrevious) {
      this.onPageChange(this.currentPage - 1, event);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStatusBadgeClass(status: string | null | undefined): string {
    switch ((status || '').trim().toLowerCase()) {
      case 'completed':
        return 'badge bg-success';
      case 'processing':
        return 'badge bg-info';
      case 'partiallyfailed':
      case 'failed':
        return 'badge bg-danger';
      case 'draft':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    const text = String(value).trim();
    return text ? text : 'N/A';
  }

  private resolveProcessType(document: SearchScanDocument): string {
    return this.normalizeProcessType(document.entityName || document.documentType);
  }

  private resolveReferenceId(document: SearchScanDocument): number {
    const primaryId = this.toPositiveId(document.id);
    if (primaryId > 0) {
      return primaryId;
    }

    const docEntry = this.toPositiveId(document.docEntry);
    if (docEntry > 0) {
      return docEntry;
    }

    return this.toPositiveId(document.docNum);
  }

  private navigateToOrder(processType: string, referenceId: number): void {
    switch (processType) {
      case 'purchase':
      case 'purchases':
      case 'purchaseorder':
        this.router.navigate(['/processes/purchases/purchase-items', referenceId]);
        break;

      case 'goodsreturn':
      case 'goodsreturnorder':
        this.router.navigate(['/processes/purchases/goods-return-order', 0, 0, referenceId]);
        break;

      case 'deliverynote':
      case 'deliverynoteorder':
        this.router.navigate(['/processes/sales/delivery-note-order', 0, referenceId]);
        break;

      case 'sales':
      case 'salesorder':
        this.router.navigate(['/processes/sales/sales-items', referenceId]);
        break;

      case 'salesreturn':
      case 'salesreturnorder':
        this.router.navigate(['/processes/sales/sales-return-order', 0, referenceId]);
        break;

      case 'receipt':
      case 'receiptorder':
      case 'receiptpurchaseorder':
        this.router.navigate(['/processes/purchases/receipt-order', 0, referenceId]);
        break;

      case 'transferred':
      case 'transferredrequest':
      case 'transferredrequestorder':
      case 'transfer':
        this.router.navigate(['/processes/transferred-request/transferred-request-items', referenceId]);
        break;

      case 'transferredstock':
      case 'transferredstockorder':
      case 'stocktransferred':
        this.router.navigate(['/processes/transferred-request/transferred-stock', 0, referenceId]);
        break;

      case 'quantityadjustmentstock':
      case 'quantityadjustmentstockorder':
      case 'quantityadjustment':
      case 'adjustmentstock':
      case 'countingadjustment':
        this.router.navigate(['/processes/quantity-adjustment-stock/quantity-adjustment-stock', referenceId]);
        break;

      case 'stockcounting':
      case 'stockcount':
      case 'countstock':
      case 'stockcountingorder':
        this.router.navigate(['/processes/stock-counting/menu']);
        break;

      case 'production':
      case 'productionorder':
        this.router.navigate(['/processes/production/menu']);
        break;

      default:
        break;
    }
  }

  private isSupportedProcessType(processType: string): boolean {
    return this.supportedProcessTypes.has(processType);
  }

  private normalizeProcessType(value: unknown): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private toPositiveId(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private loadSearchResults(pageNumber: number): void {
    const query = this.searchTerm;
    if (!query) {
      this.hasSearched = false;
      this.resetResults();
      return;
    }

    this.loading = true;
    this.requestError = '';
    this.cdr.detectChanges();

    this.searchScanService.searchDocuments(query, pageNumber, this.itemsPerPage).subscribe({
      next: (response) => {
        const pagedResponse = this.normalizePagedResponse(response, pageNumber);
        this.documents = pagedResponse.data;
        this.currentPage = pagedResponse.pageNumber;
        this.itemsPerPage = pagedResponse.pageSize;
        this.totalPages = pagedResponse.totalPages;
        this.totalItems = pagedResponse.totalRecords;
        this.hasNext = pagedResponse.hasNext;
        this.hasPrevious = pagedResponse.hasPrevious;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        const serverError = err as { error?: { message?: string } };
        this.requestError = serverError?.error?.message || 'Failed to load search results.';
        this.loading = false;
        this.resetResults();
      }
    });
  }

  private resetResults(): void {
    this.documents = [];
    this.totalPages = 0;
    this.totalItems = 0;
    this.hasNext = false;
    this.hasPrevious = false;
    this.loading = false;
    this.cdr.detectChanges();
  }

  private normalizePagedResponse(
    response: SearchScanApiResponse | null | undefined,
    fallbackPage: number
  ): SearchScanPagedResponse {
    const empty = this.createEmptyResponse(fallbackPage, this.itemsPerPage);
    if (!response) {
      return empty;
    }

    if (this.isPagedResponse(response)) {
      return this.sanitizePagedResponse(response, fallbackPage, this.itemsPerPage);
    }

    if (this.isPagedResponse(response.data)) {
      return this.sanitizePagedResponse(response.data, fallbackPage, this.itemsPerPage);
    }

    return empty;
  }

  private isPagedResponse(value: unknown): value is SearchScanPagedResponse {
    return !!value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data);
  }

  private sanitizePagedResponse(
    response: SearchScanPagedResponse,
    fallbackPage: number,
    fallbackPageSize: number
  ): SearchScanPagedResponse {
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pageNumber: this.toPositiveNumber(response.pageNumber, fallbackPage),
      pageSize: this.toPositiveNumber(response.pageSize, fallbackPageSize),
      totalRecords: this.toNonNegativeNumber(response.totalRecords, 0),
      totalPages: this.toNonNegativeNumber(response.totalPages, 0),
      hasPrevious: Boolean(response.hasPrevious),
      hasNext: Boolean(response.hasNext)
    };
  }

  private createEmptyResponse(pageNumber: number, pageSize: number): SearchScanPagedResponse {
    return {
      data: [],
      pageNumber,
      pageSize,
      totalRecords: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false
    };
  }

  private toPositiveNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toNonNegativeNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }
}

