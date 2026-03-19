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
  UtilitiesModule,
  ModalModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { QuantityAdjustmentStockService } from '../../Services/quantity-adjustment-stock.service';
import { QuantityAdjustmentStock } from '../../Models/quantity-adjustment-stock.model';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-quantity-adjustment-stock-orders',
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
    TranslatePipe
  ],
  templateUrl: './quantity-adjustment-stock-orders.component.html',
  styleUrl: './quantity-adjustment-stock-orders.component.scss'
})
export class QuantityAdjustmentStockOrdersComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  quantityAdjustmentStocks: QuantityAdjustmentStock[] = [];
  filteredQuantityAdjustmentStocks: QuantityAdjustmentStock[] = [];
  warehouseId = 0;
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
  filterPostingDate: Date | null = null;
  filterDueDate: Date | null = null;

  private isSearching = false;
  private queryParamsSubscription?: Subscription;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private quantityAdjustmentStockService: QuantityAdjustmentStockService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      status: [''],
      postingDate: [null],
      dueDate: [null]
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
      const postingDate = params['postingDate'] || '';
      const dueDate = params['dueDate'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.filterStatus = status;
      this.filterPostingDate = postingDate ? new Date(postingDate) : null;
      this.filterDueDate = dueDate ? new Date(dueDate) : null;

      this.form.patchValue({
        status,
        postingDate: postingDate || null,
        dueDate: dueDate || null
      });

      if (this.warehouseId) {
        this.loadQuantityAdjustmentStocks();
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  loadQuantityAdjustmentStocks(): void {
    if (!this.warehouseId) {
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const formValue = this.form.value;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;

    this.quantityAdjustmentStockService
      .getQuantityAdjustmentStocksWithFilterationByWarehouse(
        this.currentPage,
        this.itemsPerPage,
        this.warehouseId,
        this.filterStatus || undefined,
        postingDateStr,
        dueDateStr
      )
      .subscribe({
        next: (res: any) => {
          console.log("quantity",res);
          if (res?.data) {
            this.quantityAdjustmentStocks = res.data.data || [];
            this.filteredQuantityAdjustmentStocks = this.quantityAdjustmentStocks;
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
          console.error('Error loading quantity adjustment stocks:', err);
          this.loading = false;
          this.quantityAdjustmentStocks = [];
          this.filteredQuantityAdjustmentStocks = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.hasNext = false;
          this.hasPrevious = false;
          this.toastr.error('Failed to load quantity adjustment stocks. Please try again.', 'Error');
          this.cdr.markForCheck();
        }
      });
  }

  get paginatedQuantityAdjustmentStocks(): QuantityAdjustmentStock[] {
    return this.filteredQuantityAdjustmentStocks;
  }

  onPageChange(page: number, event?: Event): void {
    event?.preventDefault();
    this.loading = true;
    this.cdr.markForCheck();

    if (page < 1) {
      page = 1;
    }
    if (page > this.totalPages) {
      page = this.totalPages;
    }

    if (page !== this.currentPage) {
      this.updateUrlWithFilters(page, this.itemsPerPage);
    }
  }

  onSearch(): void {
    this.isSearching = true;

    const formValue = this.form.value;
    this.filterStatus = formValue.status || '';
    this.filterPostingDate = formValue.postingDate ? new Date(formValue.postingDate) : null;
    this.filterDueDate = formValue.dueDate ? new Date(formValue.dueDate) : null;
    this.currentPage = 1;

    this.updateUrlWithFilters(1, this.itemsPerPage);
    this.loadQuantityAdjustmentStocks();

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
    if (formValue.postingDate) {
      queryParams.postingDate = formValue.postingDate;
    }
    if (formValue.dueDate) {
      queryParams.dueDate = formValue.dueDate;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
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

  onViewQuantityAdjustmentStock(stock: QuantityAdjustmentStock): void {
    if (!stock.quantityAdjustmentStockId) {
      return;
    }

    this.router.navigate([
      '/processes/quantity-adjustment-stock/quantity-adjustment-stock',
      stock.quantityAdjustmentStockId
    ]);
  }

  onEditQuantityAdjustmentStock(stock: QuantityAdjustmentStock): void {
    if (!stock.quantityAdjustmentStockId) {
      return;
    }

    this.router.navigate([
      '/processes/quantity-adjustment-stock/quantity-adjustment-stock-form',
      this.warehouseId,
      stock.quantityAdjustmentStockId
    ]);
  }

  onDeleteQuantityAdjustmentStock(stock: QuantityAdjustmentStock): void {
    if (!stock.quantityAdjustmentStockId) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete quantity adjustment stock #${stock.quantityAdjustmentStockId}?`
      )
    ) {
      return;
    }

    this.quantityAdjustmentStockService
      .deleteQuantityAdjustmentStock(stock.quantityAdjustmentStockId)
      .subscribe({
        next: () => {
          this.toastr.success('Quantity adjustment stock deleted successfully', 'Success');
          this.loadQuantityAdjustmentStocks();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting quantity adjustment stock:', err);
          const errorMessage =
            err?.error?.message || 'Error deleting quantity adjustment stock. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
  }

  onAddQuantityAdjustmentStock(): void {
    this.router.navigate([
      '/processes/quantity-adjustment-stock/quantity-adjustment-stock-form',
      this.warehouseId
    ]);
  }

  onBackToShowProcesses(): void {
    this.router.navigate(['inquiries/show-inventory-processes', this.warehouseId]);
  }

  hasErrorMessage(stock: QuantityAdjustmentStock): boolean {
    return !!this.getStockErrorMessage(stock);
  }

  onOpenErrorModal(stock: QuantityAdjustmentStock): void {
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

  isRetryingSap(stock: QuantityAdjustmentStock): boolean {
    return !!stock.quantityAdjustmentStockId && this.retryingStockIds.has(stock.quantityAdjustmentStockId);
  }

  onRetrySap(stock: QuantityAdjustmentStock): void {
    const stockId = stock.quantityAdjustmentStockId;
    if (!stockId || this.retryingStockIds.has(stockId)) {
      return;
    }

    this.retryingStockIds.add(stockId);
    this.quantityAdjustmentStockService.retryQuantityAdjustmentStockSap(stockId).subscribe({
      next: () => {
        this.toastr.success(`Sync SAP requested for stock #${stockId}`, 'Success');
        setTimeout(() => {
          this.retryingStockIds.delete(stockId);
          this.loadQuantityAdjustmentStocks();
          this.cdr.markForCheck();
        }, 5000);
      },
      error: (err) => {
        console.error('Error syncing SAP:', err);
        const errorMessage = err?.error?.message || 'Failed to sync SAP. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.retryingStockIds.delete(stockId);
        this.cdr.markForCheck();
      }
    });
  }

  getStatusBadgeClass(stock: QuantityAdjustmentStock): string {
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

  getStatusText(stock: QuantityAdjustmentStock): string {
    return stock.status || 'Unknown';
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

  isApproved(stock: QuantityAdjustmentStock): boolean {
    const rawStatus = stock.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(stock: QuantityAdjustmentStock): string {
    const rawStatus = stock.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(stock: QuantityAdjustmentStock): string {
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

  private getStockErrorMessage(stock: QuantityAdjustmentStock): string {
    const errorMessage = stock.errorMessage?.trim();
    if (errorMessage) {
      return errorMessage;
    }

    return stock.reason?.trim() || '';
  }
}
