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
import { ItemBarcodeService } from '../barcodes/Services/item-barcode.service';
import { ItemBarcode } from '../barcodes/Models/item-barcode.model';
import { ItemBarcodeFormModalComponent } from './item-barcode-form-modal/item-barcode-form-modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-item-barcodes',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    ItemBarcodeFormModalComponent,
    DatePipe
  ],
  templateUrl: './item-barcodes.component.html',
  styleUrl: './item-barcodes.component.scss',
})
export class ItemBarcodesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  barcodes: ItemBarcode[] = [];
  filteredBarcodes: ItemBarcode[] = [];
  itemId: number  = 0;

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
  searchType: string = '';

  // Modal state
  showBarcodeModal: boolean = false;
  selectedBarcode: ItemBarcode | null = null;
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
    private barcodeService: ItemBarcodeService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      searchBarcode: [''],
      searchType: ['']
    });
  }

  ngOnInit(): void {
    this.itemId = +this.route.snapshot.paramMap.get('itemId')!;

    // Read pagination from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;
      const barcode = params['barcode'] || '';
      const type = params['type'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.searchBarcode = barcode;
      this.searchType = type;
      this.form.patchValue({ 
        searchBarcode: barcode,
        searchType: type
      });

      if (this.itemId) {
        this.loadBarcodes();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadBarcodes(): void {
    if (!this.itemId) return;

    this.loading = true;
    this.cdr.detectChanges();

    this.barcodeService.getItemBarcodes(
      this.itemId, 
      this.currentPage, 
      this.itemsPerPage,
      this.searchBarcode,
      this.searchType
    ).subscribe({
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
          
          if (this.barcodes.length > 0) {
            this.toastr.success(`Loaded ${this.barcodes.length} barcode(s) successfully`, 'Success');
          }
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
        this.toastr.error('Failed to load barcodes. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedBarcodes(): ItemBarcode[] {
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
          barcode: this.searchBarcode || null,
          type: this.searchType || null
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

    const barcode = this.form.value.searchBarcode || '';
    const type = this.form.value.searchType || '';
    this.searchBarcode = barcode;
    this.searchType = type;

    if (barcode || type) {
      this.toastr.info('Searching barcodes...', 'Info');
    }

  // Reset to first page when searching
    this.currentPage = 1;
    this.loadBarcodes();

  }

  onAddBarcode(): void {
    this.selectedBarcode = null;
    this.isEditMode = false;
    this.showBarcodeModal = true;
  }

  onEditBarcode(barcode: ItemBarcode): void {
    this.selectedBarcode = { ...barcode };
    this.isEditMode = true;
    this.showBarcodeModal = true;
  }

  onSaveBarcode(barcodeData: ItemBarcode): void {
    this.modalLoading = true;
    this.cdr.detectChanges();



    if (this.isEditMode && barcodeData.itemBarCodeId) {
      // Update existing barcode
      this.barcodeService.updateItemBarcode(barcodeData).subscribe({
        next: (res: any) => {
          console.log('Barcode updated:', res);
          this.modalLoading = false;
          this.showBarcodeModal = false;
          this.selectedBarcode = null;
          this.isEditMode = false;
          this.toastr.success('Barcode updated successfully', 'Success');
          this.loadBarcodes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating barcode:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error updating barcode. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new barcode
      this.barcodeService.createItemBarcode(this.itemId, barcodeData).subscribe({
        next: (res: any) => {
          console.log('Barcode created:', res);
          this.modalLoading = false;
          this.showBarcodeModal = false;
          this.selectedBarcode = null;
          this.isEditMode = false;
          this.toastr.success('Barcode created successfully', 'Success');
          this.loadBarcodes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating barcode:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error creating barcode. Please try again.';
          this.toastr.error(errorMessage, 'Error');
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

  onDeleteBarcode(barcode: ItemBarcode): void {
    if (confirm(`Are you sure you want to delete barcode: ${barcode.barCode}?`)) {
      if (barcode.itemBarCodeId) {
        this.barcodeService.deleteItemBarcode(barcode.itemBarCodeId).subscribe({
          next: () => {
            console.log('Barcode deleted');
            this.toastr.success(`Barcode "${barcode.barCode}" deleted successfully`, 'Success');
            this.loadBarcodes();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting barcode:', err);
            const errorMessage = err.error?.message || 'Error deleting barcode. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onViewDynamicBarcodes(barcode: ItemBarcode): void {
    if (barcode.itemBarCodeId) {
      this.router.navigate(['/processes/dynamic-barcodes', barcode.itemBarCodeId]);
    }
  }
}
