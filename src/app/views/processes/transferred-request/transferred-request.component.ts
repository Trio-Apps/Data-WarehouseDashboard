import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  TableModule,
  CardModule,
  ButtonModule,
  FormModule,
  GridModule,
  PaginationModule,
  UtilitiesModule,
  ModalModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { TransferredRequestService } from './Services/transferred-request.service';
import { DestinationWarehouse, TransferredRequest } from './Models/transferred-request.model';
import { SearchDestinationWarehouseModalComponent } from './search-destination-warehouse-modal/search-destination-warehouse-modal.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-transferred-request',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    PaginationModule,
    UtilitiesModule,
    ModalModule,
    IconDirective,
    DatePipe,
    SearchDestinationWarehouseModalComponent,
    TranslatePipe
  ],
  templateUrl: './transferred-request.component.html',
  styleUrl: './transferred-request.component.scss'
})
export class TransferredRequestComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  transferredRequests: TransferredRequest[] = [];
  filteredTransferredRequests: TransferredRequest[] = [];
  destinationWarehouses: DestinationWarehouse[] = [];
  warehouseId = 0;
  selectedDestinationWarehouseDisplay = '';
  showDestinationWarehouseModal = false;
  showErrorModal = false;
  selectedErrorMessage = '';
  retryingRequestIds: Set<number> = new Set<number>();

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  loading = true;
  hasNext = false;
  hasPrevious = false;

  filterStatus = '';
  filterDestinationWarehouseId: number | null = null;
  filterPostingDate: Date | null = null;
  filterDueDate: Date | null = null;
  filterLiveStatus = '';
  private isSearching = false;

  Math = Math;
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private transferredRequestService: TransferredRequestService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      status: [''],
      destinationWarehouseId: [''],
      postingDate: [null],
      dueDate: [null],
      liveStatus: ['']
    });
  }

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;

    this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
      if (this.isSearching) {
        return;
      }

      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;
      const status = params['status'] || '';
      const destinationWarehouseId = params['destinationWarehouseId'] ? +params['destinationWarehouseId'] : null;
      const postingDate = params['postingDate'] || '';
      const dueDate = params['dueDate'] || '';
      const liveStatus = params['liveStatus'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.filterStatus = status;
      this.filterDestinationWarehouseId = destinationWarehouseId;
      this.filterPostingDate = postingDate ? new Date(postingDate) : null;
      this.filterDueDate = dueDate ? new Date(dueDate) : null;
      this.filterLiveStatus = liveStatus;

      this.form.patchValue({
        status,
        destinationWarehouseId: destinationWarehouseId ?? '',
        postingDate: postingDate || null,
        dueDate: dueDate || null,
        liveStatus
      });

      this.syncSelectedDestinationWarehouseDisplay();

      if (this.warehouseId) {
        this.loadTransferredRequests();
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  loadTransferredRequests(): void {
    if (!this.warehouseId) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const formValue = this.form.value;
    const destinationWarehouseId = formValue.destinationWarehouseId
      ? +formValue.destinationWarehouseId
      : undefined;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;

    this.transferredRequestService
      .getTransferredRequestsWithFilterationByWarehouse(
        this.currentPage,
        this.itemsPerPage,
        this.warehouseId,
        destinationWarehouseId,
        this.filterLiveStatus || undefined,
        this.filterStatus || undefined,
        postingDateStr,
        dueDateStr
      )
      .subscribe({
        next: (res: any) => {
          if (res.data) {
            this.transferredRequests = res.data.data || [];
            this.filteredTransferredRequests = this.transferredRequests;
            this.currentPage = res.data.pageNumber || this.currentPage;
            this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
            this.totalPages = res.data.totalPages || 0;
            this.totalItems = res.data.totalRecords || 0;
            this.hasNext = res.data.hasNext || false;
            this.hasPrevious = res.data.hasPrevious || false;

            if (this.transferredRequests.length > 0) {
              this.toastr.success(
                `Loaded ${this.transferredRequests.length} transferred request(s) successfully`,
                'Success'
              );
            }
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading transferred requests:', err);
          this.loading = false;
          this.transferredRequests = [];
          this.filteredTransferredRequests = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.hasNext = false;
          this.hasPrevious = false;
          this.toastr.error('Failed to load transferred requests. Please try again.', 'Error');
          this.cdr.detectChanges();
        }
      });
  }

  get paginatedTransferredRequests(): TransferredRequest[] {
    return this.filteredTransferredRequests;
  }

  onPageChange(page: number, event?: Event): void {
    event?.preventDefault();
    this.loading = true;
    this.cdr.detectChanges();

    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;

    if (page !== this.currentPage) {
      this.updateUrlWithFilters(page, this.itemsPerPage);
    }
  }

  onSearch(): void {
    this.isSearching = true;

    const formValue = this.form.value;
    this.filterStatus = formValue.status || '';
    this.filterDestinationWarehouseId = formValue.destinationWarehouseId
      ? +formValue.destinationWarehouseId
      : null;
    this.filterPostingDate = formValue.postingDate ? new Date(formValue.postingDate) : null;
    this.filterDueDate = formValue.dueDate ? new Date(formValue.dueDate) : null;
    this.filterLiveStatus = formValue.liveStatus || '';

    this.currentPage = 1;
    this.updateUrlWithFilters(1, this.itemsPerPage);
    this.loadTransferredRequests();

    setTimeout(() => {
      this.isSearching = false;
    }, 100);
  }

  private updateUrlWithFilters(page: number, pageSize: number): void {
    const formValue = this.form.value;
    const queryParams: any = {
      page,
      pageSize
    };

    if (formValue.status) {
      queryParams.status = formValue.status;
    }
    if (formValue.destinationWarehouseId) {
      queryParams.destinationWarehouseId = formValue.destinationWarehouseId;
    }
    if (formValue.postingDate) {
      queryParams.postingDate = formValue.postingDate;
    }
    if (formValue.dueDate) {
      queryParams.dueDate = formValue.dueDate;
    }
    if (formValue.liveStatus) {
      queryParams.liveStatus = formValue.liveStatus;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  onOpenDestinationWarehouseModal(): void {
    this.showDestinationWarehouseModal = true;
  }

  onDestinationWarehouseModalVisibleChange(visible: boolean): void {
    this.showDestinationWarehouseModal = visible;
  }

  onDestinationWarehouseSelected(warehouse: DestinationWarehouse): void {
    this.form.patchValue({ destinationWarehouseId: warehouse.warehouseId });
    this.filterDestinationWarehouseId = warehouse.warehouseId;
    this.selectedDestinationWarehouseDisplay =
      warehouse.warehouseCode || warehouse.warehouseName || `#${warehouse.warehouseId}`;
    this.showDestinationWarehouseModal = false;

    if (!this.destinationWarehouses.some((w) => w.warehouseId === warehouse.warehouseId)) {
      this.destinationWarehouses = [...this.destinationWarehouses, warehouse];
    }

    this.cdr.detectChanges();
  }

  onDestinationWarehouseCleared(): void {
    this.form.patchValue({ destinationWarehouseId: '' });
    this.filterDestinationWarehouseId = null;
    this.selectedDestinationWarehouseDisplay = '';
    this.showDestinationWarehouseModal = false;
    this.cdr.detectChanges();
  }

  private syncSelectedDestinationWarehouseDisplay(): void {
    const destinationWarehouseIdValue = this.form.get('destinationWarehouseId')?.value;
    const destinationWarehouseId = destinationWarehouseIdValue ? +destinationWarehouseIdValue : null;

    if (!destinationWarehouseId) {
      this.selectedDestinationWarehouseDisplay = '';
      return;
    }

    const selectedWarehouse = this.destinationWarehouses.find(
      (w) => w.warehouseId === destinationWarehouseId
    );

    this.selectedDestinationWarehouseDisplay = selectedWarehouse
      ? selectedWarehouse.warehouseCode ||
        selectedWarehouse.warehouseName ||
        `#${destinationWarehouseId}`
      : `#${destinationWarehouseId}`;
  }

  onNextPage(event?: Event): void {
    event?.preventDefault();
    if (this.hasNext) {
      this.onPageChange(this.currentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    event?.preventDefault();
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

  onAddTransferredRequest(): void {
    this.router.navigate(['/processes/transferred-request/transferred-request-form', this.warehouseId]);
  }

  onViewTransferredStockOrders(): void {
    this.router.navigate(['/processes/transferred-request/transferred-stock-orders', this.warehouseId]);
  }

  onBackToShowProcesses(): void {
    this.router.navigate(['inquiries/show-inventory-processes', this.warehouseId]);
  }

  onEditTransferredRequest(request: TransferredRequest): void {
    if (request.transferredRequestId) {
      this.router.navigate([
        '/processes/transferred-request/transferred-request-form',
        this.warehouseId,
        request.transferredRequestId
      ]);
    }
  }

  onDeleteTransferredRequest(request: TransferredRequest): void {
    if (this.isCompletedStatus(request)) {
      this.toastr.warning('Cannot delete transferred request when status is Completed', 'Warning');
      return;
    }

    if (confirm(`Are you sure you want to delete transferred request #${request.transferredRequestId}?`)) {
      if (!request.transferredRequestId) {
        return;
      }

      this.transferredRequestService.deleteTransferredRequest(request.transferredRequestId).subscribe({
        next: () => {
          this.toastr.success('Transferred request deleted successfully', 'Success');
          this.loadTransferredRequests();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting transferred request:', err);
          const errorMessage = err.error?.message || 'Error deleting transferred request. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  onDuplicateTransferredRequest(request: TransferredRequest): void {
    if (!request.transferredRequestId) {
      return;
    }

    if (!confirm(`Are you sure you want to duplicate transferred request #${request.transferredRequestId}?`)) {
      return;
    }

    this.transferredRequestService.duplicateTransferredRequest(request.transferredRequestId).subscribe({
      next: () => {
        this.toastr.success('Transferred request duplicated successfully', 'Success');
        this.loadTransferredRequests();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error duplicating transferred request:', err);
        const errorMessage = err.error?.message || 'Error duplicating transferred request. Please try again.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  onViewTransferredRequestItems(request: TransferredRequest): void {
    if (request.transferredRequestId) {
      this.router.navigate([
        '/processes/transferred-request/transferred-request-items',
        request.transferredRequestId
      ]);
    }
  }

  onViewTransferredStock(request: TransferredRequest): void {
    if (!request.transferredRequestId) {
      return;
    }

    this.router.navigate([
      '/processes/transferred-request/transferred-stock',
      request.transferredRequestId,
      request.transferredStockId || 0
    ]);
  }

  hasErrorMessage(request: TransferredRequest): boolean {
    return !!this.getRequestErrorMessage(request);
  }

  onOpenErrorModal(request: TransferredRequest): void {
    this.selectedErrorMessage = this.getRequestErrorMessage(request) || 'No error message available.';
    this.showErrorModal = true;
    this.cdr.detectChanges();
  }

  onErrorModalVisibleChange(visible: boolean): void {
    this.showErrorModal = visible;
    if (!visible) {
      this.selectedErrorMessage = '';
    }
  }

  isRetryingSap(request: TransferredRequest): boolean {
    return !!request.transferredRequestId && this.retryingRequestIds.has(request.transferredRequestId);
  }

  onRetrySap(request: TransferredRequest): void {
    const transferredRequestId = request.transferredRequestId;
    if (!transferredRequestId || this.retryingRequestIds.has(transferredRequestId)) {
      return;
    }

    this.retryingRequestIds.add(transferredRequestId);

    this.transferredRequestService.retryTransferredRequestSap(transferredRequestId).subscribe({
      next: () => {
        this.toastr.success(`Sync SAP requested for transferred request #${transferredRequestId}`, 'Success');

        setTimeout(() => {
          this.retryingRequestIds.delete(transferredRequestId);
          this.loadTransferredRequests();
          this.cdr.detectChanges();
        }, 5000);
      },
      error: (err) => {
        console.error('Error syncing SAP:', err);
        const errorMessage = err.error?.message || 'Failed to sync SAP. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.retryingRequestIds.delete(transferredRequestId);
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(request: TransferredRequest | null): string {
    if (!request || !request.status) return 'badge bg-secondary';

    const status = request.status.toLowerCase();
    if (status === 'draft' || status.includes('draft')) {
      return 'badge bg-warning';
    } else if (status === 'completed' || status.includes('completed')) {
      return 'badge bg-success';
    } else if (status === 'processing' || status.includes('processing')) {
      return 'badge bg-info';
    } else if (status === 'partiallyfailed' || status.includes('partiallyfailed')) {
      return 'badge bg-danger';
    } else {
      return 'badge bg-secondary';
    }
  }

  getStatusText(request: TransferredRequest): string {
    return request.status;
  }

  isCompletedStatus(request: TransferredRequest): boolean {
    const status = (request.status || '').trim().toLowerCase();
    return status === 'completed' || status === 'final';
  }

  private mapApprovalStatusText(value: string): string {
    const normalized = value.trim();
    switch (normalized) {
      case '1':
        return 'InProgress';
      case '2':
        return 'Approved';
      case '3':
        return 'Rejected';
      default:
        return normalized;
    }
  }

  isApproved(request: TransferredRequest): boolean {
    const rawStatus = request.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(request: TransferredRequest): string {
    const rawStatus = request.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(request: TransferredRequest): string {
    const rawStatus = request.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'badge bg-secondary';
    }

    const statusText = this.mapApprovalStatusText(String(rawStatus));
    switch (statusText) {
      case 'Approved':
        return 'badge bg-success';
      case 'Rejected':
        return 'badge bg-danger';
      case 'InProgress':
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  }

  private getRequestErrorMessage(request: TransferredRequest): string {
    const errorMessage = request.errorMessage?.trim();
    if (errorMessage) {
      return errorMessage;
    }

    return request.reason?.trim() || '';
  }
}
