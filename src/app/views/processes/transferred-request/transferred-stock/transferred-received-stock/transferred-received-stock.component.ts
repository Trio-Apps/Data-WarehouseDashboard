import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
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
  UtilitiesModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { TransferredStockService } from '../../Services/transferred-stock.service';
import { DestinationWarehouse } from '../../Models/transferred-request.model';
import { TransferredStock } from '../../Models/transferred-stock.model';
import { SearchDestinationWarehouseModalComponent } from '../../search-destination-warehouse-modal/search-destination-warehouse-modal.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { ReceivedModalComponent } from './received-modal/received-modal.component';

@Component({
  selector: 'app-transferred-received-stock',
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
    IconDirective,
    DatePipe,
    SearchDestinationWarehouseModalComponent,
    TranslatePipe,
    ReceivedModalComponent
  ],
  templateUrl: './transferred-received-stock.component.html',
  styleUrl: './transferred-received-stock.component.scss'
})
export class TransferredReceivedStockComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  transferredStocks: TransferredStock[] = [];
  filteredTransferredStocks: TransferredStock[] = [];
  sourceWarehouses: DestinationWarehouse[] = [];
  warehouseId = 0;
  selectedSourceWarehouseDisplay = '';
  showSourceWarehouseModal = false;

  showReceivedModal = false;
  selectedStockForReceive: TransferredStock | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  loading = true;
  hasNext = false;
  hasPrevious = false;

  filterStatus = '';
  filterSourceWarehouseId: number | null = null;
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
      sourceWarehouseId: [''],
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
      const sourceWarehouseId = params['sourceWarehouseId'] ? +params['sourceWarehouseId'] : null;
      const postingDate = params['postingDate'] || '';
      const dueDate = params['dueDate'] || '';
      const liveStatus = params['liveStatus'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.filterStatus = status;
      this.filterSourceWarehouseId = sourceWarehouseId;
      this.filterPostingDate = postingDate ? new Date(postingDate) : null;
      this.filterDueDate = dueDate ? new Date(dueDate) : null;
      this.filterLiveStatus = liveStatus;

      this.form.patchValue({
        status,
        sourceWarehouseId: sourceWarehouseId ?? '',
        postingDate: postingDate || null,
        dueDate: dueDate || null,
        liveStatus
      });
      this.syncSelectedSourceWarehouseDisplay();

      if (this.warehouseId) {
        this.loadTransferredStocks();
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  loadTransferredStocks(): void {
    if (!this.warehouseId) {
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const formValue = this.form.value;
    const sourceWarehouseId = formValue.sourceWarehouseId ? +formValue.sourceWarehouseId : undefined;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;

    this.transferredStockService
      .getReceivedTransferredStocksWithFilterationByWarehouse(
        this.currentPage,
        this.itemsPerPage,
        this.warehouseId,
        sourceWarehouseId,
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
          console.error('Error loading transferred received stocks:', err);
          this.loading = false;
          this.transferredStocks = [];
          this.filteredTransferredStocks = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.hasNext = false;
          this.hasPrevious = false;
          this.toastr.error('Failed to load transferred received stocks. Please try again.', 'Error');
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
    this.filterSourceWarehouseId = formValue.sourceWarehouseId ? +formValue.sourceWarehouseId : null;
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
    if (formValue.sourceWarehouseId) {
      queryParams.sourceWarehouseId = formValue.sourceWarehouseId;
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

  onOpenSourceWarehouseModal(): void {
    this.showSourceWarehouseModal = true;
  }

  onSourceWarehouseModalVisibleChange(visible: boolean): void {
    this.showSourceWarehouseModal = visible;
  }

  onSourceWarehouseSelected(warehouse: DestinationWarehouse): void {
    this.form.patchValue({ sourceWarehouseId: warehouse.warehouseId });
    this.filterSourceWarehouseId = warehouse.warehouseId;
    this.selectedSourceWarehouseDisplay =
      warehouse.warehouseName || warehouse.warehouseCode || `#${warehouse.warehouseId}`;
    this.showSourceWarehouseModal = false;

    if (!this.sourceWarehouses.some((w) => w.warehouseId === warehouse.warehouseId)) {
      this.sourceWarehouses = [...this.sourceWarehouses, warehouse];
    }

    this.cdr.markForCheck();
  }

  onSourceWarehouseCleared(): void {
    this.form.patchValue({ sourceWarehouseId: '' });
    this.filterSourceWarehouseId = null;
    this.selectedSourceWarehouseDisplay = '';
    this.showSourceWarehouseModal = false;
    this.cdr.markForCheck();
  }

  private syncSelectedSourceWarehouseDisplay(): void {
    const sourceWarehouseIdValue = this.form.get('sourceWarehouseId')?.value;
    const sourceWarehouseId = sourceWarehouseIdValue ? +sourceWarehouseIdValue : null;

    if (!sourceWarehouseId) {
      this.selectedSourceWarehouseDisplay = '';
      return;
    }

    const selectedWarehouse = this.sourceWarehouses.find((w) => w.warehouseId === sourceWarehouseId);
    this.selectedSourceWarehouseDisplay = selectedWarehouse
      ? selectedWarehouse.warehouseName || selectedWarehouse.warehouseCode || `#${sourceWarehouseId}`
      : `#${sourceWarehouseId}`;
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

  onOpenReceiveModal(stock: TransferredStock): void {
    if (!stock.transferredStockId) {
      this.toastr.warning('Transferred stock ID is missing.', 'Warning');
      return;
    }

    this.selectedStockForReceive = stock;
    this.showReceivedModal = true;
    this.cdr.markForCheck();
  }

  onReceiveModalVisibleChange(visible: boolean): void {
    this.showReceivedModal = visible;
    if (!visible) {
      this.selectedStockForReceive = null;
    }
    this.cdr.markForCheck();
  }

  onReceivedSaved(): void {
    this.showReceivedModal = false;
    this.selectedStockForReceive = null;
    this.loadTransferredStocks();
  }

  onBackToShowProcesses(): void {
    this.router.navigate(['inquiries/show-inventory-processes', this.warehouseId]);
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
}





