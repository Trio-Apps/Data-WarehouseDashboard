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
import { TransferredStockService } from '../../Services/transferred-stock.service';
import { DestinationWarehouse } from '../../Models/transferred-request.model';
import { TransferredStock } from '../../Models/transferred-stock.model';
import { SearchDestinationWarehouseModalComponent } from '../../search-destination-warehouse-modal/search-destination-warehouse-modal.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-transferred-stock-orders-by-transferred-request',
  standalone: true,
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
  templateUrl: './transferred-stock-orders-by-transferred-request.component.html',
  styleUrl: './transferred-stock-orders-by-transferred-request.component.scss',
})
export class TransferredStockOrdersByTransferredRequestComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  transferredStocks: TransferredStock[] = [];
  filteredTransferredStocks: TransferredStock[] = [];
  destinationWarehouses: DestinationWarehouse[] = [];
  transferredRequestId = 0;
  warehouseId = 0;
  selectedDestinationWarehouseDisplay = '';
  showDestinationWarehouseModal = false;
  showErrorModal = false;
  selectedErrorMessage = '';
  retryingStockIds: Set<number> = new Set<number>();

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
  private queryParamsSubscription?: Subscription;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private transferredStockService: TransferredStockService,
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
    const requestParam =
      this.route.snapshot.paramMap.get('transferredRequestId') ||
      this.route.snapshot.paramMap.get('requestId') ||
      '';
    this.transferredRequestId = requestParam ? +requestParam : 0;

    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

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

      if (this.transferredRequestId) {
        this.loadTransferredStocks();
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  loadTransferredStocks(): void {
    if (!this.transferredRequestId) {
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const formValue = this.form.value;
    const destinationWarehouseId = formValue.destinationWarehouseId
      ? +formValue.destinationWarehouseId
      : undefined;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;

    this.transferredStockService
      .getTransferredStocksWithFilterationByTransferredRequest(
        this.currentPage,
        this.itemsPerPage,
        this.transferredRequestId,
        destinationWarehouseId,
        this.filterLiveStatus || undefined,
        this.filterStatus || undefined,
        postingDateStr,
        dueDateStr
      )
      .subscribe({
        next: (res: any) => {
          if (res.data) {
            this.transferredStocks = res.data.data || [];
            this.filteredTransferredStocks = this.transferredStocks;
            this.currentPage = res.data.pageNumber || this.currentPage;
            this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
            this.totalPages = res.data.totalPages || 0;
            this.totalItems = res.data.totalRecords || 0;
            this.hasNext = res.data.hasNext || false;
            this.hasPrevious = res.data.hasPrevious || false;
          }

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading transferred stocks:', err);
          this.loading = false;
          this.transferredStocks = [];
          this.filteredTransferredStocks = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.hasNext = false;
          this.hasPrevious = false;
          this.toastr.error('Failed to load transferred stocks. Please try again.', 'Error');
          this.cdr.markForCheck();
        }
      });
  }

  get paginatedTransferredStocks(): TransferredStock[] {
    return this.filteredTransferredStocks;
  }

  onPageChange(page: number, event?: Event): void {
    event?.preventDefault();
    this.loading = true;
    this.cdr.markForCheck();

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
    this.loadTransferredStocks();

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
      warehouse.warehouseName || warehouse.warehouseCode || `#${warehouse.warehouseId}`;
    this.showDestinationWarehouseModal = false;

    if (!this.destinationWarehouses.some((w) => w.warehouseId === warehouse.warehouseId)) {
      this.destinationWarehouses = [...this.destinationWarehouses, warehouse];
    }

    this.cdr.markForCheck();
  }

  onDestinationWarehouseCleared(): void {
    this.form.patchValue({ destinationWarehouseId: '' });
    this.filterDestinationWarehouseId = null;
    this.selectedDestinationWarehouseDisplay = '';
    this.showDestinationWarehouseModal = false;
    this.cdr.markForCheck();
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
      ? selectedWarehouse.warehouseName || selectedWarehouse.warehouseCode || `#${destinationWarehouseId}`
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

  onViewTransferredStock(stock: TransferredStock): void {
    if (!stock.transferredStockId) {
      return;
    }

    this.router.navigate([
      '/processes/transferred-request/transferred-stock',
      this.transferredRequestId,
      stock.transferredStockId
    ]);
  }

  onEditTransferredStock(stock: TransferredStock): void {
    if (!stock.transferredStockId) {
      return;
    }

    this.router.navigate([
      '/processes/transferred-request/transferred-stock-form',
      this.warehouseId,
      this.transferredRequestId,
      stock.transferredStockId
    ]);
  }

  onDeleteTransferredStock(stock: TransferredStock): void {
    if (!stock.transferredStockId) {
      return;
    }

    if (!confirm(`Are you sure you want to delete transferred stock #${stock.transferredStockId}?`)) {
      return;
    }

    this.transferredStockService.deleteTransferredStock(stock.transferredStockId).subscribe({
      next: () => {
        this.toastr.success('Transferred stock deleted successfully', 'Success');
        this.loadTransferredStocks();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error deleting transferred stock:', err);
        const errorMessage =
          err?.error?.message || 'Error deleting transferred stock. Please try again.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  onDuplicateTransferredStock(stock: TransferredStock): void {
    if (!stock.transferredStockId) {
      return;
    }

    if (!confirm(`Are you sure you want to duplicate transferred stock #${stock.transferredStockId}?`)) {
      return;
    }

    this.transferredStockService.duplicateTransferredStock(stock.transferredStockId).subscribe({
      next: () => {
        this.toastr.success('Transferred stock duplicated successfully', 'Success');
        this.loadTransferredStocks();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error duplicating transferred stock:', err);
        const errorMessage =
          err?.error?.message || 'Error duplicating transferred stock. Please try again.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  onAddTransferredStock(): void {
    this.router.navigate([
      '/processes/transferred-request/transferred-stock-form',
      this.warehouseId,
      this.transferredRequestId
    ]);
  }

  onBackToTransferredRequest(): void {
    if (this.transferredRequestId) {
      this.router.navigate([
        '/processes/transferred-request/transferred-request-items',
        this.transferredRequestId
      ]);
      return;
    }

    this.router.navigate(['/processes/transferred-request', this.warehouseId || 0]);
  }

  getStatusBadgeClass(stock: TransferredStock): string {
    const status = (stock.status || '').toLowerCase();
    if (status === 'draft' || status.includes('draft')) {
      return 'badge bg-warning';
    }
    if (status === 'processing' || status.includes('processing')) {
      return 'badge bg-info';
    }
    if (status === 'completed' || status.includes('completed')) {
      return 'badge bg-success';
    }
    if (status === 'partiallyfailed' || status.includes('partiallyfailed')) {
      return 'badge bg-danger';
    }
    return 'badge bg-secondary';
  }

  getStatusText(stock: TransferredStock): string {
    return stock.status || 'Unknown';
  }

  getReceivingStatusText(stock: TransferredStock): string {
    const rawStatus = stock.receivingStatus ?? stock.ReceivingStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'Unknown';
    }

    const normalized = String(rawStatus).trim().toLowerCase();
    switch (normalized) {
      case '1':
      case 'noprocessing':
        return 'NoProcessing';
      case '2':
      case 'intransit':
        return 'InTransit';
      case '3':
      case 'draft':
        return 'Draft';
      case '4':
      case 'completed':
        return 'Completed';
      case '5':
      case 'partiallyreceived':
        return 'PartiallyReceived';
      default:
        return String(rawStatus);
    }
  }

  getReceivingStatusBadgeClass(stock: TransferredStock): string {
    const status = this.getReceivingStatusText(stock).toLowerCase();
    if (status === 'draft') {
      return 'badge bg-warning';
    }
    if (status === 'intransit') {
      return 'badge bg-info';
    }
    if (status === 'completed') {
      return 'badge bg-success';
    }
    if (status === 'partiallyreceived') {
      return 'badge bg-warning';
    }
    if (status === 'noprocessing') {
      return 'badge bg-secondary';
    }
    return 'badge bg-secondary';
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

  isApproved(stock: TransferredStock): boolean {
    const rawStatus = stock.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(stock: TransferredStock): string {
    const rawStatus = stock.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(stock: TransferredStock): string {
    const rawStatus = stock.approvalStatus;
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

  hasErrorMessage(stock: TransferredStock): boolean {
    return !!this.getStockErrorMessage(stock);
  }

  onOpenErrorModal(stock: TransferredStock): void {
    this.selectedErrorMessage = this.getStockErrorMessage(stock) || 'No error message available.';
    this.showErrorModal = true;
    this.cdr.markForCheck();
  }

  onErrorModalVisibleChange(visible: boolean): void {
    this.showErrorModal = visible;
    if (!visible) {
      this.selectedErrorMessage = '';
    }
  }

  isRetryingSap(stock: TransferredStock): boolean {
    return !!stock.transferredStockId && this.retryingStockIds.has(stock.transferredStockId);
  }

  onRetrySap(stock: TransferredStock): void {
    const transferredStockId = stock.transferredStockId;
    if (!transferredStockId || this.retryingStockIds.has(transferredStockId)) {
      return;
    }

    this.retryingStockIds.add(transferredStockId);
    this.transferredStockService.retryTransferredStockSap(transferredStockId).subscribe({
      next: () => {
        this.toastr.success(`Sync SAP requested for transferred stock #${transferredStockId}`, 'Success');

        setTimeout(() => {
          this.retryingStockIds.delete(transferredStockId);
          this.loadTransferredStocks();
          this.cdr.markForCheck();
        }, 5000);
      },
      error: (err) => {
        console.error('Error syncing SAP:', err);
        const errorMessage = err?.error?.message || 'Failed to sync SAP. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.retryingStockIds.delete(transferredStockId);
        this.cdr.markForCheck();
      }
    });
  }

  private getStockErrorMessage(stock: TransferredStock): string {
    const errorMessage = stock.errorMessage?.trim();
    if (errorMessage) {
      return errorMessage;
    }

    return stock.reason?.trim() || '';
  }
}
