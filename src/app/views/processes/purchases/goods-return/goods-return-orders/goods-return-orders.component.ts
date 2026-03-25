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
import { PurchaseService } from '../../Services/purchase.service';
import { Supplier } from '../../Models/purchase.model';
import { ApprovalService } from '../../../approval-process/Services/approval.service';
import { SearchSupplierModalComponent } from '../../search-supplier-modal/search-supplier-modal.component';

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
    DatePipe,
    SearchSupplierModalComponent
  ],
  templateUrl: './goods-return-orders.component.html',
  styleUrl: './goods-return-orders.component.scss',
})
export class GoodsReturnOrdersComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  returns: GoodsReturnOrderListItem[] = [];
  filteredReturns: GoodsReturnOrderListItem[] = [];
  suppliers: Supplier[] = [];
  warehouseId: number = 0;
  selectedSupplierDisplay: string = '';
  showSupplierModal: boolean = false;
  showErrorModal: boolean = false;
  selectedErrorMessage: string = '';
  retryingReturnIds: Set<number> = new Set<number>();

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
  filterSupplierId: number | null = null;
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
    private purchaseService: PurchaseService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      status: [''],
      supplierId: [''],
      postingDate: [null],
      dueDate: [null]
    });
  }

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;
    //this.loadSuppliers();

    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (this.isSearching) {
        return;
      }

      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;
      const status = params['status'] || '';
      const supplierId = params['supplierId'] ? +params['supplierId'] : null;
      const postingDate = params['postingDate'] || '';
      const dueDate = params['dueDate'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.filterStatus = status;
      this.filterSupplierId = supplierId;
      this.filterPostingDate = postingDate ? new Date(postingDate) : null;
      this.filterDueDate = dueDate ? new Date(dueDate) : null;

      this.form.patchValue({
        status: status,
        supplierId: supplierId ?? '',
        postingDate: postingDate || null,
        dueDate: dueDate || null
      });
      this.syncSelectedSupplierDisplay();

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
    const supplierId = formValue.supplierId ? +formValue.supplierId : undefined;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;

    this.returnService.getGoodsReturnOrdersWithFilterationByWarehouse(
      this.currentPage,
      this.itemsPerPage,
      this.warehouseId,
      supplierId,
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
    this.filterSupplierId = formValue.supplierId ? +formValue.supplierId : null;
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
    if (formValue.supplierId) {
      queryParams.supplierId = formValue.supplierId;
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

  loadSuppliers(): void {
    this.purchaseService.getSuppliers().subscribe({
      next: (res: any) => {
        const rawSuppliers = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res)
              ? res
              : [];

        this.suppliers = rawSuppliers
          .map((s: any) => this.mapSupplier(s))
          .filter((s: Supplier) => !!s.supplierId);
        this.syncSelectedSupplierDisplay();

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.toastr.error('Failed to load suppliers. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onOpenSupplierModal(): void {
    this.showSupplierModal = true;
  }

  onSupplierModalVisibleChange(visible: boolean): void {
    this.showSupplierModal = visible;
  }

  onSupplierSelected(supplier: Supplier): void {
    this.form.patchValue({ supplierId: supplier.supplierId });
    this.filterSupplierId = supplier.supplierId;
    this.selectedSupplierDisplay = supplier.supplierCode || supplier.supplierName || `#${supplier.supplierId}`;
    this.showSupplierModal = false;

    if (!this.suppliers.some(s => s.supplierId === supplier.supplierId)) {
      this.suppliers = [...this.suppliers, supplier];
    }

    this.cdr.detectChanges();
  }

  onSupplierCleared(): void {
    this.form.patchValue({ supplierId: '' });
    this.filterSupplierId = null;
    this.selectedSupplierDisplay = '';
    this.showSupplierModal = false;
    this.cdr.detectChanges();
  }

  private mapSupplier(s: any): Supplier {
    return {
      supplierId: s.supplierId ?? s.id ?? s.SupplierId,
      supplierName: s.supplierName ?? s.name ?? s.SupplierName ?? '',
      supplierCode: s.supplierCode ?? s.code ?? s.SupplierCode ?? ''
    };
  }

  private syncSelectedSupplierDisplay(): void {
    const supplierIdValue = this.form.get('supplierId')?.value;
    const supplierId = supplierIdValue ? +supplierIdValue : null;

    if (!supplierId) {
      this.selectedSupplierDisplay = '';
      return;
    }

    const selectedSupplier = this.suppliers.find(s => s.supplierId === supplierId);
    this.selectedSupplierDisplay = selectedSupplier
      ? (selectedSupplier.supplierCode || selectedSupplier.supplierName || `#${supplierId}`)
      : `#${supplierId}`;
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

  onBackToShowProcesses(): void {
    this.router.navigate(['inquiries/show-purchasing-processes', this.warehouseId]);
  }

  getStatusBadgeClass(returnOrder: GoodsReturnOrderListItem): string {
    switch (returnOrder.status) {
      case 'Draft':
        return 'badge bg-warning';
      case 'Processing':
        return 'badge bg-info';
      case 'PartiallyFailed':
        return 'badge bg-danger';
      case 'Completed':
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

  onDuplicateReturnOrder(returnOrder: GoodsReturnOrderListItem): void {
    if (!returnOrder.goodsReturnOrderId) {
      return;
    }

    if (confirm(`Are you sure you want to duplicate return order #${returnOrder.goodsReturnOrderId}?`)) {
      this.returnService.duplicateReturnOrder(returnOrder.goodsReturnOrderId).subscribe({
        next: () => {
          this.toastr.success('Return order duplicated successfully', 'Success');
          this.loadReturns();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error duplicating return order:', err);
          const errorMessage = err.error?.message || 'Error duplicating return order. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  hasErrorMessage(returnOrder: GoodsReturnOrderListItem): boolean {
    return !!returnOrder.errorMessage?.trim();
  }

  onOpenErrorModal(returnOrder: GoodsReturnOrderListItem): void {
    this.selectedErrorMessage = returnOrder.errorMessage?.trim() || 'No error message available.';
    this.showErrorModal = true;
    this.cdr.detectChanges();
  }

  onErrorModalVisibleChange(visible: boolean): void {
    this.showErrorModal = visible;
    if (!visible) {
      this.selectedErrorMessage = '';
    }
    this.cdr.detectChanges();
  }

  isRetryingSap(returnOrder: GoodsReturnOrderListItem): boolean {
    return !!returnOrder.goodsReturnOrderId && this.retryingReturnIds.has(returnOrder.goodsReturnOrderId);
  }

  onRetrySap(returnOrder: GoodsReturnOrderListItem): void {
    const goodsReturnOrderId = returnOrder.goodsReturnOrderId;
    if (!goodsReturnOrderId || this.retryingReturnIds.has(goodsReturnOrderId)) {
      return;
    }

    this.retryingReturnIds.add(goodsReturnOrderId);
    this.returnService.retryReturnSap(goodsReturnOrderId).subscribe({
      next: () => {
        this.toastr.success(`Sync SAP requested for return #${goodsReturnOrderId}`, 'Success');
        setTimeout(() => {
          this.retryingReturnIds.delete(goodsReturnOrderId);
          this.loadReturns();
          this.cdr.detectChanges();
        }, 10000);
      },
      error: (err) => {
        console.error('Error syncing SAP:', err);
        const errorMessage = err.error?.message || 'Failed to sync SAP. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.retryingReturnIds.delete(goodsReturnOrderId);
        this.cdr.detectChanges();
      }
    });
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
