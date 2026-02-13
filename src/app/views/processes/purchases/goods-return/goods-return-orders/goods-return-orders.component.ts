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
import { GoodsReturnService } from '../../Services/goods-return.service';
import { Return } from '../../Models/retrun-model';
import { ApprovalService } from '../../../approval-process/Services/approval.service';

type GoodsReturnOrderListItem = Return & {
  purchaseOrderId?: number;
  receiptOrderId?: number;
  returnReceiptOrderId?: number;
  receiptPurchaseOrderId?: number | null;
  supplierName?: string | null;
  itemCount?: number | null;
  approvalStatus?: string | null;
  canApprove?: boolean | null;
  processApprovalId?: number | null;
};

@Component({
  selector: 'app-goods-return-orders',
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
    DatePipe
  ],
  templateUrl: './goods-return-orders.component.html',
  styleUrl: './goods-return-orders.component.scss',
})
export class GoodsReturnOrdersComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  returns: GoodsReturnOrderListItem[] = [];
  filteredReturns: GoodsReturnOrderListItem[] = [];
  warehouseId: number = 0;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;
  selectedReturnForApproval: GoodsReturnOrderListItem | null = null;

  // Filter fields
  filterStatus: string = '';
  filterPostingDate: Date | null = null;
  filterDueDate: Date | null = null;

  // Flag to prevent double loading
  private isSearching: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private returnService: GoodsReturnService,
    private approvalService: ApprovalService,
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

    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
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
        status: status,
        postingDate: postingDate || null,
        dueDate: dueDate || null
      });

      if (this.warehouseId) {
        this.loadReturns();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadReturns(): void {
    if (!this.warehouseId) return;

    this.loading = true;
    this.cdr.detectChanges();

    const formValue = this.form.value;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;

    this.returnService.getGoodsReturnOrdersWithFilterationByWarehouse(
      this.currentPage,
      this.itemsPerPage,
      this.warehouseId,
      this.filterStatus || undefined,
      postingDateStr,
      dueDateStr
    ).subscribe({
      next: (res: any) => {
        console.log("return",res);
        if (res.data) {
          this.returns = res.data.data || [];
          this.filteredReturns = this.returns;
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;

          if (this.returns.length > 0) {
            this.toastr.success(`Loaded ${this.returns.length} return order(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading return orders:', err);
        this.loading = false;
        this.returns = [];
        this.filteredReturns = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load return orders. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedReturns(): GoodsReturnOrderListItem[] {
    return this.filteredReturns;
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
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
    this.filterPostingDate = formValue.postingDate ? new Date(formValue.postingDate) : null;
    this.filterDueDate = formValue.dueDate ? new Date(formValue.dueDate) : null;

    this.currentPage = 1;

    this.updateUrlWithFilters(1, this.itemsPerPage);
    this.loadReturns();

    setTimeout(() => {
      this.isSearching = false;
    }, 100);
  }

  private updateUrlWithFilters(page: number, pageSize: number): void {
    const formValue = this.form.value;
    const queryParams: any = {
      page: page,
      pageSize: pageSize
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
      queryParams: queryParams,
      replaceUrl: true
    });
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

  onViewReturnOrder(returnOrder: GoodsReturnOrderListItem): void {
    const receiptId =
      returnOrder.returnReceiptOrderId ??
      returnOrder.receiptOrderId ??
      returnOrder.receiptPurchaseOrderId ??
      undefined;
    const purchaseOrderId = returnOrder.purchaseOrderId ?? 0;
    if (receiptId && returnOrder.goodsReturnOrderId) {
      this.router.navigate(['/processes/purchases/goods-return-order', purchaseOrderId, receiptId, returnOrder.goodsReturnOrderId]);
    } else {
      this.router.navigate(['/processes/purchases/goods-return-order', 0, 0, returnOrder.goodsReturnOrderId]);
    }
  }

  onAddGoodsReturn(): void {
    this.router.navigate(
      ['/processes/purchases/goods-return-form', 0, 0],
      { queryParams: { warehouseId: this.warehouseId } }
    );
  }

  getStatusBadgeClass(returnOrder: GoodsReturnOrderListItem): string {
    switch (returnOrder.status) {
      case 'Draft':
        return 'badge bg-warning';
      case 'Processing':
        return 'badge bg-info';
      case 'Final':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(returnOrder: GoodsReturnOrderListItem): string {
    return returnOrder.status;
  }

  onDeleteReturnOrder(returnOrder: GoodsReturnOrderListItem): void {
    if (!returnOrder.goodsReturnOrderId) {
      return;
    }

    if (confirm(`Are you sure you want to delete return order #${returnOrder.goodsReturnOrderId}?`)) {
      this.returnService.deleteReturnOrder(returnOrder.goodsReturnOrderId).subscribe({
        next: () => {
          this.toastr.success('Return order deleted successfully', 'Success');
          this.loadReturns();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting return order:', err);
          const errorMessage = err.error?.message || 'Error deleting return order. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
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

  isApproved(returnOrder: GoodsReturnOrderListItem): boolean {
    const rawStatus = returnOrder.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(returnOrder: GoodsReturnOrderListItem): string {
    const rawStatus = returnOrder.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(returnOrder: GoodsReturnOrderListItem): string {
    const rawStatus = returnOrder.approvalStatus;
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

  onOpenApprovalModal(returnOrder: GoodsReturnOrderListItem): void {
    if (!returnOrder?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }
    this.selectedReturnForApproval = returnOrder;
    this.approvalComment = '';
    this.setApprovalModalVisible(true);
  }

  onCancelApprovalModal(): void {
    if (this.approvalSubmitting) {
      return;
    }
    this.selectedReturnForApproval = null;
    this.setApprovalModalVisible(false);
  }

  onApprovalVisibleChange(visible: boolean): void {
    if (!visible && !this.approvalSubmitting) {
      this.selectedReturnForApproval = null;
    }
    this.setApprovalModalVisible(visible);
  }

  private setApprovalModalVisible(visible: boolean): void {
    setTimeout(() => {
      this.showApprovalModal = visible;
      this.cdr.detectChanges();
    });
  }

  private setApprovalSubmitting(value: boolean): void {
    Promise.resolve().then(() => {
      this.approvalSubmitting = value;
      this.cdr.detectChanges();
    });
  }

  submitApproval(approved: boolean): void {
    if (!this.selectedReturnForApproval?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }
    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();
    this.approvalService
      .changeApprovalStatus(approved, this.selectedReturnForApproval.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.selectedReturnForApproval = null;
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadReturns();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }
}
