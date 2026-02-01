import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesService } from './Services/sales.service';
import { ToastrService } from 'ngx-toastr';
import { Sales } from './Models/sales-model';
import { CommonModule, DatePipe } from '@angular/common';
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
@Component({
  selector: 'app-sales',
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
    DatePipe
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  Sales: Sales[] = [];
  filteredSales: Sales[] = [];
  warehouseId: number = 0;

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
    private saleService: SalesService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      status: [''],
      postingDate: [null],
      dueDate: [null],
       liveStatus: ['']
    });
  }

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;

    // Read pagination and filters from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      // Skip loading if we're in the middle of a search operation
      if (this.isSearching) {
        return;
      }

      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;
      const status = params['status'] || '';
      const postingDate = params['postingDate'] || '';
      const dueDate = params['dueDate'] || '';
      const liveStatus = params['liveStatus'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.filterStatus = status;
      this.filterPostingDate = postingDate ? new Date(postingDate) : null;
      this.filterDueDate = dueDate ? new Date(dueDate) : null;
      this.filterLiveStatus = liveStatus;
        

      // Update form values (for date inputs, use YYYY-MM-DD format)
      this.form.patchValue({
        status: status,
        postingDate: postingDate || null,
        dueDate: dueDate || null,
        liveStatus: liveStatus
      });

      if (this.warehouseId) {
        this.loadSales();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadSales(): void {
    if (!this.warehouseId) return;

    this.loading = true;
    this.cdr.detectChanges();

    // Get form values for dates (input type="date" returns YYYY-MM-DD string)
    const formValue = this.form.value;
    const postingDateStr = formValue.postingDate || undefined;
    const dueDateStr = formValue.dueDate || undefined;
   console.log('Loading Sales with filters:', {

      liveStatus: this.filterLiveStatus
    });
    this.saleService.getSalesWithFilterationByWarehouse(
      this.currentPage,
      this.itemsPerPage,
      this.warehouseId,
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
          this.Sales = res.data.data || [];
          this.filteredSales = this.Sales;
          //console.log(this.Sales)
          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;

          if (this.Sales.length > 0) {
            this.toastr.success(`Loaded ${this.Sales.length} Sale(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading Sales:', err);
        this.loading = false;
        this.Sales = [];
        this.filteredSales = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load Sales. Please try again.', 'Error');
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

  get paginatedSales(): Sales[] {
    return this.filteredSales;
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
      // Update URL with new page and filters - this will trigger queryParams subscription and loadSales
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
    this.filterPostingDate = formValue.postingDate ? new Date(formValue.postingDate) : null;
    this.filterDueDate = formValue.dueDate ? new Date(formValue.dueDate) : null;
    this.filterLiveStatus = formValue.liveStatus || '';
     

    // Reset to first page when searching
    this.currentPage = 1;

    
    // Update URL with filters
    this.updateUrlWithFilters(1, this.itemsPerPage);
    
    // Load Sales directly (like users component)
    this.loadSales();
    
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

  onAddSale(): void {
    this.router.navigate(['/processes/Sale-form', this.warehouseId]);
  }

  onEditSale(Sale: Sales): void {
    //console.log(Sale.salesOrderId);
    if (Sale.salesOrderId) {
      this.router.navigate(['/processes/Sale-form', this.warehouseId, Sale.salesOrderId]);
    }
  }

  onDeleteSale(Sale: Sales): void {
    if (confirm(`Are you sure you want to delete Sale #${Sale.salesOrderId}?`)) {
      if (Sale.salesOrderId) {
        this.saleService.deleteSales(Sale.salesOrderId).subscribe({
          next: () => {
            //console.log('Sale deleted');
            this.toastr.success(`Sale deleted successfully`, 'Success');
            this.loadSales();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting Sale:', err);
            const errorMessage = err.error?.message || 'Error deleting Sale. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onViewSaleItems(Sale: Sales): void {
    if (Sale.salesOrderId) {
      this.router.navigate(['/processes/sales/sales-items', Sale.salesOrderId]);
    }
  }

  onViewReceiptOrder(Sale: Sales): void {
    if (Sale.salesOrderId) {
      this.router.navigate(['/processes/receipt-order', Sale.salesOrderId]);
    }
  }



//type SaleStatus = 'Draft' | 'Processing' | 'Final';

getStatusBadgeClass(Sale: Sales): string {
  switch (Sale.status) {
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

getStatusText(Sale: Sales): string {
  return Sale.status;
}

}

