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
  GridModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { DynamicBarCodeService } from '../Services/dynamic-barcode.service';
import { DynamicBarCode, AddDynamicBarCode, UpdateDynamicBarCode } from '../Models/dynamic-barcode.model';
import { DynamicBarcodeFormModalComponent } from '../dynamic-barcode-form-modal/dynamic-barcode-form-modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dynamic-barcodes',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    DynamicBarcodeFormModalComponent,
    DatePipe
  ],
  templateUrl: './dynamic-barcodes.component.html',
  styleUrl: './dynamic-barcodes.component.scss',
})
export class DynamicBarcodesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  dynamicBarcodes: DynamicBarCode[] = [];
  filteredDynamicBarcodes: DynamicBarCode[] = [];
  itemBarCodeId: number = 0;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  searchTerm: string = '';

  // Search filters
  searchBarcode: string = '';

  // Modal state
  showDynamicBarcodeModal: boolean = false;
  selectedDynamicBarcode: DynamicBarCode | null = null;
  isEditMode: boolean = false;
  modalLoading: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private dynamicBarcodeService: DynamicBarCodeService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      searchBarcode: ['']
    });
  }

  ngOnInit(): void {
    this.itemBarCodeId = +this.route.snapshot.paramMap.get('itemBarCodeId')!;

    // Read pagination from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;
      const barcode = params['barcode'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.searchBarcode = barcode;
      this.form.patchValue({ 
        searchBarcode: barcode
      });

      if (this.itemBarCodeId) {
        this.loadDynamicBarcodes();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadDynamicBarcodes(): void {
    if (!this.itemBarCodeId) return;

    this.loading = true;
    this.cdr.detectChanges();

    this.dynamicBarcodeService.getDynamicBarcodes(
      this.itemBarCodeId, 
      this.currentPage, 
      this.itemsPerPage,
     // this.searchBarcode
    ).subscribe({
      next: (res: any) => {
        console.log(res);

        // Extract data from response
        if (res.data) {
          this.dynamicBarcodes = res.data.data || [];
          this.filteredDynamicBarcodes = this.dynamicBarcodes;
          console.log(this.dynamicBarcodes)
          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;
          
          if (this.dynamicBarcodes.length > 0) {
            this.toastr.success(`Loaded ${this.dynamicBarcodes.length} dynamic barcode(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dynamic barcodes:', err);
        this.loading = false;
        this.dynamicBarcodes = [];
        this.filteredDynamicBarcodes = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load dynamic barcodes. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedDynamicBarcodes(): DynamicBarCode[] {
    return this.filteredDynamicBarcodes;
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
      // Update URL with new page - this will trigger queryParams subscription and loadDynamicBarcodes
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { 
          page: page, 
          pageSize: this.itemsPerPage,
          barcode: this.searchBarcode || null
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

  onSearch(): void {
    const barcode = this.form.value.searchBarcode || '';
    this.searchBarcode = barcode;

    if (barcode) {
      this.toastr.info('Searching dynamic barcodes...', 'Info');
    }

    // Reset to first page when searching and update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        page: 1, 
        pageSize: this.itemsPerPage,
        barcode: barcode || null
      },
      queryParamsHandling: 'merge'
    });
  }

  onAddDynamicBarcode(): void {
    this.selectedDynamicBarcode = null;
    this.isEditMode = false;
    this.showDynamicBarcodeModal = true;
  }

  onEditDynamicBarcode(dynamicBarcode: DynamicBarCode): void {
    this.selectedDynamicBarcode = { ...dynamicBarcode };
    this.isEditMode = true;
    this.showDynamicBarcodeModal = true;
  }

  onSaveDynamicBarcode(dynamicBarcodeData: AddDynamicBarCode | UpdateDynamicBarCode): void {
    this.modalLoading = true;
    this.cdr.detectChanges();
     console.log('Saving dynamic barcode data:', dynamicBarcodeData);
    if (this.isEditMode && 'dynamicBarCodeId' in dynamicBarcodeData && dynamicBarcodeData.dynamicBarCodeId) {
      // Update existing dynamic barcode
      const updateData = dynamicBarcodeData as UpdateDynamicBarCode;

      this.dynamicBarcodeService.updateDynamicBarcode(updateData).subscribe({
        next: (res: any) => {
          console.log('Dynamic barcode updated:', res);
          this.modalLoading = false;
          this.showDynamicBarcodeModal = false;
          this.selectedDynamicBarcode = null;
          this.isEditMode = false;
          this.toastr.success('Dynamic barcode updated successfully', 'Success');
          this.loadDynamicBarcodes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating dynamic barcode:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error updating dynamic barcode. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new dynamic barcode
      const addData = dynamicBarcodeData as AddDynamicBarCode;
      this.dynamicBarcodeService.createDynamicBarcode(this.itemBarCodeId, addData).subscribe({
        next: (res: any) => {
          console.log('Dynamic barcode created:', res);
          this.modalLoading = false;
          this.showDynamicBarcodeModal = false;
          this.selectedDynamicBarcode = null;
          this.isEditMode = false;
          this.toastr.success('Dynamic barcode created successfully', 'Success');
          this.loadDynamicBarcodes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating dynamic barcode:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error creating dynamic barcode. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancelDynamicBarcodeModal(): void {
    this.showDynamicBarcodeModal = false;
    this.selectedDynamicBarcode = null;
    this.isEditMode = false;
  }

  onDeleteDynamicBarcode(dynamicBarcode: DynamicBarCode): void {
    if (confirm(`Are you sure you want to delete dynamic barcode: ${dynamicBarcode.barCode}?`)) {
      if (dynamicBarcode.dynamicBarCodeId) {
        this.dynamicBarcodeService.deleteDynamicBarcode(dynamicBarcode.dynamicBarCodeId).subscribe({
          next: () => {
            console.log('Dynamic barcode deleted');
            this.toastr.success(`Dynamic barcode "${dynamicBarcode.barCode}" deleted successfully`, 'Success');
            this.loadDynamicBarcodes();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting dynamic barcode:', err);
            const errorMessage = err.error?.message || 'Error deleting dynamic barcode. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }
}
