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
import { ReceiptService } from '../../Services/receipt.service';
import { PurchaseService } from '../../Services/purchase.service';
import { Receipt } from '../../Models/receipt';
import { Supplier } from '../../Models/purchase.model';
import { ToastrService } from 'ngx-toastr';
import { SearchSupplierModalComponent } from '../../search-supplier-modal/search-supplier-modal.component';

@Component({
  selector: 'app-receipt-orders',
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
  templateUrl: './receipt-orders.component.html',
  styleUrl: './receipt-orders.component.scss',
})
export class ReceiptOrdersComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  receipts: Receipt[] = [];
  filteredReceipts: Receipt[] = [];
  suppliers: Supplier[] = [];
  warehouseId: number = 0;
  selectedSupplierDisplay: string = '';
  showSupplierModal: boolean = false;
  showErrorModal: boolean = false;
  selectedErrorMessage: string = '';
  retryingReceiptIds: Set<number> = new Set<number>();

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

  filterStatus: string = '';
  filterSupplierId: number | null = null;
  filterPostingDate: Date | null = null;
  filterDueDate: Date | null = null;
  filterLiveStatus: string = '';

  private isSearching: boolean = false;
  private queryParamsSubscription?: Subscription;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private receiptService: ReceiptService,
    private purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      status: [''],
      supplierId: [''],
      postingDate: [null],
      dueDate: [null],
      liveStatus: ['']
    });
  }

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;
   // this.loadSuppliers();

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
      const liveStatus = params['liveStatus'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.filterStatus = status;
      this.filterSupplierId = supplierId;
      this.filterPostingDate = postingDate ? new Date(postingDate) : null;
      this.filterDueDate = dueDate ? new Date(dueDate) : null;
      this.filterLiveStatus = liveStatus;

      this.form.patchValue({
        status: status,
        supplierId: supplierId ?? '',
        postingDate: postingDate || null,
        dueDate: dueDate || null,
        liveStatus: liveStatus
      });
      this.syncSelectedSupplierDisplay();

      if (this.warehouseId) {
        this.loadReceipts();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadReceipts(): void {
    if (!this.warehouseId) return;

    this.loading = true;
    this.cdr.markForCheck();

    const formValue = this.form.value;
    const supplierId = formValue.supplierId ? +formValue.supplierId : undefined;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;

    this.receiptService.getReceiptsWithFilterationByWarehouse(
      this.currentPage,
      this.itemsPerPage,
      this.warehouseId,
      supplierId,
      this.filterLiveStatus || undefined,
      this.filterStatus || undefined,
      postingDateStr,
      dueDateStr
    ).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.receipts = res.data.data || [];
          console.log("Receipts",this.receipts);
          this.filteredReceipts = this.receipts;
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;

          if (this.receipts.length > 0) {
            this.toastr.success(`Loaded ${this.receipts.length} receipt(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading receipts:', err);
        this.loading = false;
        this.receipts = [];
        this.filteredReceipts = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load receipts. Please try again.', 'Error');
        this.cdr.markForCheck();
      }
    });
  }

  get paginatedReceipts(): Receipt[] {
    return this.filteredReceipts;
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
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
    this.filterSupplierId = formValue.supplierId ? +formValue.supplierId : null;
    this.filterPostingDate = formValue.postingDate ? new Date(formValue.postingDate) : null;
    this.filterDueDate = formValue.dueDate ? new Date(formValue.dueDate) : null;
    this.filterLiveStatus = formValue.liveStatus || '';
    this.currentPage = 1;

    this.updateUrlWithFilters(1, this.itemsPerPage);
    this.loadReceipts();

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
    if (formValue.liveStatus) {
      queryParams.liveStatus = formValue.liveStatus;
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

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.toastr.error('Failed to load suppliers. Please try again.', 'Error');
        this.cdr.markForCheck();
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

    this.cdr.markForCheck();
  }

  onSupplierCleared(): void {
    this.form.patchValue({ supplierId: '' });
    this.filterSupplierId = null;
    this.selectedSupplierDisplay = '';
    this.showSupplierModal = false;
    this.cdr.markForCheck();
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

  onViewReceiptOrder(receipt: Receipt): void {
    if (receipt.receiptPurchaseOrderId) {
      this.router.navigate([
        '/processes/purchases/receipt-order',
        0,
        receipt.receiptPurchaseOrderId
      ]);
    }
  }

  onViewReturnOrder(receipt: Receipt): void {
  
 this.router.navigate([
        '/processes/purchases/goods-return-order',0 ,receipt.receiptPurchaseOrderId,receipt.returnOrderId],);
    
  }

  onAddReceipt(): void {
    this.router.navigate(['/processes/purchases/receipt-form', 0, 0], {
      queryParams: { warehouseId: this.warehouseId }
    });
  }

  onBackToShowProcesses(): void {
    this.router.navigate(['inquiries/show-processes', this.warehouseId]);
  }

  onDeleteReceipt(receipt: Receipt): void {
    if (!receipt.receiptPurchaseOrderId) {
      return;
    }
    if (confirm(`Are you sure you want to delete receipt #${receipt.receiptPurchaseOrderId}?`)) {
      this.receiptService.deleteReceipt(receipt.receiptPurchaseOrderId).subscribe({
        next: () => {
          this.toastr.success('Receipt deleted successfully', 'Success');
          this.loadReceipts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting receipt:', err);
          const errorMessage = err.error?.message || 'Error deleting receipt. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  hasErrorMessage(receipt: Receipt): boolean {
    return !!receipt.errorMessage?.trim();
  }

  onOpenErrorModal(receipt: Receipt): void {
    this.selectedErrorMessage = receipt.errorMessage?.trim() || 'No error message available.';
    this.showErrorModal = true;
    this.cdr.markForCheck();
  }

  onErrorModalVisibleChange(visible: boolean): void {
    this.showErrorModal = visible;
    if (!visible) {
      this.selectedErrorMessage = '';
    }
  }

  isRetryingSap(receipt: Receipt): boolean {
    return !!receipt.receiptPurchaseOrderId && this.retryingReceiptIds.has(receipt.receiptPurchaseOrderId);
  }

  onRetrySap(receipt: Receipt): void {
    const receiptPurchaseOrderId = receipt.receiptPurchaseOrderId;
    if (!receiptPurchaseOrderId || this.retryingReceiptIds.has(receiptPurchaseOrderId)) {
      return;
    }

    this.retryingReceiptIds.add(receiptPurchaseOrderId);
    this.receiptService.retryReceiptSap(receiptPurchaseOrderId).subscribe({
      next: () => {
        this.toastr.success(`Sync SAP requested for receipt #${receiptPurchaseOrderId}`, 'Success');
        setTimeout(() => {
          this.retryingReceiptIds.delete(receiptPurchaseOrderId);
          this.loadReceipts();
          this.cdr.markForCheck();
        }, 10000);
      },
      error: (err) => {
        console.error('Error syncing SAP:', err);
        const errorMessage = err.error?.message || 'Failed to sync SAP. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.retryingReceiptIds.delete(receiptPurchaseOrderId);
        this.cdr.markForCheck();
      }
    });
  }

  getStatusBadgeClass(receipt: Receipt): string {
    switch (receipt.status) {
      case 'Draft':
        return 'badge bg-warning';
      case 'Processing':
        return 'badge bg-info';
      case 'Completed':
      case 'Final':
        return 'badge bg-success';
      case 'PartiallyFailed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(receipt: Receipt): string {
    return receipt.status;
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

  isApproved(receipt: Receipt): boolean {
    const rawStatus = receipt.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(receipt: Receipt): string {
    const rawStatus = receipt.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(receipt: Receipt): string {
    const rawStatus = receipt.approvalStatus;
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
