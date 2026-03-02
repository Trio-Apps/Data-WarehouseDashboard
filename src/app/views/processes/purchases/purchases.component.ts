import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { PurchaseService } from './Services/purchase.service';
import { Purchase, Supplier } from './Models/purchase.model';
import { ToastrService } from 'ngx-toastr';
import { SearchSupplierModalComponent } from './search-supplier-modal/search-supplier-modal.component';

@Component({
  selector: 'app-purchases',
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
    SearchSupplierModalComponent
  ],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.scss',
})
export class PurchasesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  suppliers: Supplier[] = [];
  warehouseId: number = 0;
  selectedSupplierDisplay: string = '';
  showSupplierModal: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

  // Filter fields
  filterStatus: string = '';
  filterSupplierId: number | null = null;
  filterPostingDate: Date | null = null;
  filterDueDate: Date | null = null;
  filterLiveStatus: string = '';
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
  //  this.loadSuppliers();

    // Read pagination and filters from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      // Skip loading if we're in the middle of a search operation
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
        

      // Update form values (for date inputs, use YYYY-MM-DD format)
      this.form.patchValue({
        status: status,
        supplierId: supplierId ?? '',
        postingDate: postingDate || null,
        dueDate: dueDate || null,
        liveStatus: liveStatus
      });
      this.syncSelectedSupplierDisplay();

      if (this.warehouseId) {
        this.loadPurchases();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadPurchases(): void {
    if (!this.warehouseId) return;

    this.loading = true;
    this.cdr.detectChanges();

    // Get form values for dates (input type="date" returns YYYY-MM-DD string)
    const formValue = this.form.value;
    const supplierId = formValue.supplierId ? +formValue.supplierId : undefined;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;
   console.log('Loading purchases with filters:', {

      liveStatus: this.filterLiveStatus
    });
    this.purchaseService.getPurchasesWithFilterationByWarehouse(
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
        //console.log(res);

        // Extract data from response
        if (res.data) {
          console.log(res.data);
          this.purchases = res.data.data || [];
          this.filteredPurchases = this.purchases;
          //console.log(this.purchases)
          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;

          if (this.purchases.length > 0) {
            this.toastr.success(`Loaded ${this.purchases.length} purchase(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchases:', err);
        this.loading = false;
        this.purchases = [];
        this.filteredPurchases = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load purchases. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Format date to ISO string for API
   */
  private formatDateToISOString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get paginatedPurchases(): Purchase[] {
    return this.filteredPurchases;
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.loading = true;
    this.cdr.detectChanges();

    // Validate page number
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;

    if (page !== this.currentPage) {
      // Update URL with new page and filters - this will trigger queryParams subscription and loadPurchases
      this.updateUrlWithFilters(page, this.itemsPerPage);
    }
  }

  onSearch(): void {
    // Set flag to prevent queryParams subscription from loading
    this.isSearching = true;

    // Get form values
    const formValue = this.form.value;
    
    // Update search filters
    this.filterStatus = formValue.status || '';
    this.filterSupplierId = formValue.supplierId ? +formValue.supplierId : null;
    this.filterPostingDate = formValue.postingDate ? new Date(formValue.postingDate) : null;
    this.filterDueDate = formValue.dueDate ? new Date(formValue.dueDate) : null;
    this.filterLiveStatus = formValue.liveStatus || '';
     

    // Reset to first page when searching
    this.currentPage = 1;

    
    // Update URL with filters
    this.updateUrlWithFilters(1, this.itemsPerPage);
    
    // Load purchases directly (like users component)
    this.loadPurchases();
    
    // Reset flag after a short delay to allow URL update
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

    // Only add filters if they have values (empty filters should be removed from URL)
    if (formValue.status) {
      queryParams.status = formValue.status;
    }
    if (formValue.supplierId) {
      queryParams.supplierId = formValue.supplierId;
    }
    // input type="date" already returns YYYY-MM-DD format
    if (formValue.postingDate) {
      queryParams.postingDate = formValue.postingDate;
    }

    if (formValue.dueDate) {
      queryParams.dueDate = formValue.dueDate;
    }

    if (formValue.liveStatus) {
      queryParams.liveStatus = formValue.liveStatus;
    }
    // Use replace instead of merge to remove empty filters from URL
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

  onAddPurchase(): void {
    this.router.navigate(['/processes/purchases/purchase-form', this.warehouseId]);
  }

  onBackToShowProcesses(): void {
    this.router.navigate(['inquiries/show-processes', this.warehouseId]);
  }

  onEditPurchase(purchase: Purchase): void {
    //console.log(purchase.purchaseOrderId);
    if (purchase.purchaseOrderId) {
      this.router.navigate(['/processes/purchases/purchase-form', this.warehouseId, purchase.purchaseOrderId]);
    }
  }

  onDeletePurchase(purchase: Purchase): void {
    if (confirm(`Are you sure you want to delete purchase #${purchase.purchaseOrderId}?`)) {
      if (purchase.purchaseOrderId) {
        this.purchaseService.deletePurchase(purchase.purchaseOrderId).subscribe({
          next: () => {
            //console.log('Purchase deleted');
            this.toastr.success(`Purchase deleted successfully`, 'Success');
            this.loadPurchases();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting purchase:', err);
            const errorMessage = err.error?.message || 'Error deleting purchase. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onViewPurchaseItems(purchase: Purchase): void {
    if (purchase.purchaseOrderId) {
      this.router.navigate(['/processes/purchases/purchase-items', purchase.purchaseOrderId]);
    }
  }

  onViewReceiptOrder(purchase: Purchase): void {
    if (purchase.purchaseOrderId) {
      this.router.navigate(['/processes/purchases/receipt-order', purchase.purchaseOrderId,purchase.receiptOrderId||0]);
    }
  }



//type PurchaseStatus = 'Draft' | 'Processing' | 'Final';

getStatusBadgeClass(purchase: Purchase): string {
  switch (purchase.status) {
    case 'Draft':
      return 'badge bg-warning';
    case 'Processing':
      return 'badge bg-info';
    case 'Completed':
      return 'badge bg-success';
       case 'PartiallyFailed':
      return 'badge bg-danger';
    default:
      return 'badge bg-secondary';
  }
}

getStatusText(purchase: Purchase): string {
  return purchase.status;
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

isApproved(purchase: Purchase): boolean {
  const rawStatus = purchase.approvalStatus;
  if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
    return false;
  }
  return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
}

getApprovalStatusText(purchase: Purchase): string {
  const rawStatus = purchase.approvalStatus;
  if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
    return 'not found';
  }
  return this.mapApprovalStatusText(String(rawStatus));
}

getApprovalBadgeClass(purchase: Purchase): string {
  const rawStatus = purchase.approvalStatus;
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
