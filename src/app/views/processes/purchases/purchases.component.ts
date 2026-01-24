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
import { Purchase } from './Models/purchase.model';
import { ToastrService } from 'ngx-toastr';

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
    DatePipe
  ],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.scss',
})
export class PurchasesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  warehouseId: number = 0;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

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
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;

    // Read pagination from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;

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

    this.purchaseService.getPurchasesByWarehouse(
      this.warehouseId,
      this.currentPage,
      this.itemsPerPage
    ).subscribe({
      next: (res: any) => {
        console.log(res);

        // Extract data from response
        if (res.data) {
          this.purchases = res.data.data || [];
          this.filteredPurchases = this.purchases;
          console.log(this.purchases)
          console.log(this.purchases[0].status);
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
      // Update URL with new page - this will trigger queryParams subscription and loadPurchases
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          page: page,
          pageSize: this.itemsPerPage
        },
        queryParamsHandling: 'merge'
      });
    }
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
    this.router.navigate(['/processes/purchase-form', this.warehouseId]);
  }

  onEditPurchase(purchase: Purchase): void {
    console.log(purchase.purchaseOrderId);
    if (purchase.purchaseOrderId) {
      this.router.navigate(['/processes/purchase-form', this.warehouseId, purchase.purchaseOrderId]);
    }
  }

  onDeletePurchase(purchase: Purchase): void {
    if (confirm(`Are you sure you want to delete purchase #${purchase.purchaseOrderId}?`)) {
      if (purchase.purchaseOrderId) {
        this.purchaseService.deletePurchase(purchase.purchaseOrderId).subscribe({
          next: () => {
            console.log('Purchase deleted');
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
      this.router.navigate(['/processes/purchase-items', purchase.purchaseOrderId]);
    }
  }

//type PurchaseStatus = 'Draft' | 'Processing' | 'Final';

getStatusBadgeClass(purchase: Purchase): string {
  switch (purchase.status) {
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

getStatusText(purchase: Purchase): string {
  return purchase.status;
}

}
