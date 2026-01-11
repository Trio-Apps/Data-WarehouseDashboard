import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
import { BarCodeSettingService } from '../Services/barcode-setting.service';
import { BarCodeSetting } from '../Models/barcode-setting.model';
import { BarCodeFormModalComponent } from './barcode-form-modal/barcode-form-modal.component';

@Component({
  selector: 'app-barcodes',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    BarCodeFormModalComponent
  ],
  templateUrl: './barcodes.component.html',
  styleUrl: './barcodes.component.scss',
})
export class BarcodesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  barcodes: BarCodeSetting[] = [];
  filteredBarcodes: BarCodeSetting[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  searchTerm: string = '';

  // Modal state
  showBarcodeModal: boolean = false;
  selectedBarcode: BarCodeSetting | null = null;
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
    private barcodeService: BarCodeSettingService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    // Read pagination from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;
      const search = params['search'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.searchTerm = search;
      this.form.patchValue({ search: search });

      this.loadBarcodes();
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadBarcodes(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.barcodeService.getBarCodeSettings(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        console.log(res);

        // Extract data from response
        if (res.data) {
          this.barcodes = res.data.data || [];
          this.filteredBarcodes = this.barcodes;
          console.log(this.barcodes)
          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading barcodes:', err);
        this.loading = false;
        this.barcodes = [];
        this.filteredBarcodes = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedBarcodes(): BarCodeSetting[] {
    return this.filteredBarcodes;
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
      // Update URL with new page - this will trigger queryParams subscription and loadBarcodes
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { 
          page: page, 
          pageSize: this.itemsPerPage,
          search: this.searchTerm || null
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
    this.loading = true;
    this.cdr.detectChanges();

    const searchValue = this.form.value.search || '';
    this.searchTerm = searchValue;

    // Reset to first page when searching
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        pageSize: this.itemsPerPage,
        search: searchValue || null
      },
      queryParamsHandling: 'merge'
    });
  }

  onAddBarcode(): void {
    this.selectedBarcode = null;
    this.isEditMode = false;
    this.showBarcodeModal = true;
  }

  onEditBarcode(barcode: BarCodeSetting): void {
    this.selectedBarcode = { ...barcode };
    this.isEditMode = true;
    this.showBarcodeModal = true;
  }

  onSaveBarcode(barcodeData: BarCodeSetting): void {
    this.modalLoading = true;
    this.cdr.detectChanges();

    if (this.isEditMode && barcodeData.barCodeSettingId) {
      // Update existing barcode
      this.barcodeService.updateBarCodeSetting(barcodeData).subscribe({
        next: (res: any) => {
          console.log('Barcode updated:', res);
          this.modalLoading = false;
          this.showBarcodeModal = false;
          this.selectedBarcode = null;
          this.isEditMode = false;
          this.loadBarcodes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating barcode:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error updating barcode. Please try again.';
          alert(errorMessage);
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new barcode
      this.barcodeService.createBarCodeSetting(barcodeData).subscribe({
        next: (res: any) => {
          console.log('Barcode created:', res);
          this.modalLoading = false;
          this.showBarcodeModal = false;
          this.selectedBarcode = null;
          this.isEditMode = false;
          this.loadBarcodes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating barcode:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error creating barcode. Please try again.';
          alert(errorMessage);
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancelBarcodeModal(): void {
    this.showBarcodeModal = false;
    this.selectedBarcode = null;
    this.isEditMode = false;
  }

  onDeleteBarcode(barcode: BarCodeSetting): void {
    if (confirm(`Are you sure you want to delete barcode setting: ${barcode.barCodeSettingId}?`)) {
      if (barcode.barCodeSettingId) {
        this.barcodeService.deleteBarCodeSetting(barcode.barCodeSettingId).subscribe({
          next: () => {
            this.loadBarcodes();
          },
          error: (err) => {
            console.error('Error deleting barcode:', err);
            alert('Error deleting barcode. Please try again.');
          }
        });
      }
    }
  }
}

