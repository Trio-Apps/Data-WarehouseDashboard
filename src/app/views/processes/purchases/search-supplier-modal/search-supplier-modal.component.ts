import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalModule,
  ButtonModule,
  FormModule,
  GridModule,
  TableModule
} from '@coreui/angular';
import { PurchaseService } from '../Services/purchase.service';
import { Supplier } from '../Models/purchase.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-search-supplier-modal',
  imports: [
    CommonModule,
    ModalModule,
    ButtonModule,
    FormModule,
    GridModule,
    TableModule
  ],
  templateUrl: './search-supplier-modal.component.html',
  styleUrl: './search-supplier-modal.component.scss',
})
export class SearchSupplierModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() supplierSelected = new EventEmitter<Supplier>();
  @Output() clearSelected = new EventEmitter<void>();

  supplierModalLoading: boolean = false;
  supplierModalCode: string = '';
  supplierModalName: string = '';
  supplierModalSuppliers: Supplier[] = [];
  supplierModalCurrentPage: number = 1;
  supplierModalItemsPerPage: number = 10;
  supplierModalTotalPages: number = 0;
  supplierModalTotalItems: number = 0;
  supplierModalHasNext: boolean = false;
  supplierModalHasPrevious: boolean = false;
  Math = Math;

  constructor(
    private purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnChanges(): void {
    if (this.visible) {
      this.loadSuppliers(1);
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
  }

  onSearch(): void {
    this.loadSuppliers(1);
  }

  loadSuppliers(page: number = this.supplierModalCurrentPage): void {
    const safePage = page < 1 ? 1 : page;
    const skip = (safePage - 1) * this.supplierModalItemsPerPage;

    this.supplierModalLoading = true;
    this.cdr.detectChanges();

    this.purchaseService.getSuppliersPaged(
      skip,
      this.supplierModalItemsPerPage,
      this.supplierModalCode || undefined,
      this.supplierModalName || undefined
    ).subscribe({
      next: (res: any) => {
        const data = res?.data ?? {};
        const rawSuppliers = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        this.supplierModalSuppliers = rawSuppliers
          .map((s: any) => this.mapSupplier(s))
          .filter((s: Supplier) => !!s.supplierId);

        const totalRecords = +(data?.totalRecords ?? data?.totalCount ?? data?.totalItems ?? 0);
        const pageSize = +(data?.pageSize ?? this.supplierModalItemsPerPage);
        const totalPagesFromApi = +(data?.totalPages ?? 0);

        this.supplierModalCurrentPage = safePage;
        this.supplierModalItemsPerPage = pageSize > 0 ? pageSize : this.supplierModalItemsPerPage;
        this.supplierModalTotalItems = totalRecords > 0 ? totalRecords : 0;
        this.supplierModalTotalPages = totalPagesFromApi > 0
          ? totalPagesFromApi
          : (this.supplierModalTotalItems > 0
            ? Math.ceil(this.supplierModalTotalItems / this.supplierModalItemsPerPage)
            : (this.supplierModalSuppliers.length > 0 ? 1 : 0));

        this.supplierModalHasNext = typeof data?.hasNext === 'boolean'
          ? data.hasNext
          : this.supplierModalCurrentPage < this.supplierModalTotalPages;
        this.supplierModalHasPrevious = typeof data?.hasPrevious === 'boolean'
          ? data.hasPrevious
          : this.supplierModalCurrentPage > 1;

        this.supplierModalLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading paged suppliers:', err);
        this.supplierModalLoading = false;
        this.supplierModalSuppliers = [];
        this.supplierModalTotalItems = 0;
        this.supplierModalTotalPages = 0;
        this.supplierModalHasNext = false;
        this.supplierModalHasPrevious = false;
        this.toastr.error('Failed to load suppliers. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    let targetPage = page;
    if (targetPage < 1) {
      targetPage = 1;
    }
    if (this.supplierModalTotalPages > 0 && targetPage > this.supplierModalTotalPages) {
      targetPage = this.supplierModalTotalPages;
    }

    if (targetPage !== this.supplierModalCurrentPage) {
      this.loadSuppliers(targetPage);
    }
  }

  onNextPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.supplierModalHasNext) {
      this.onPageChange(this.supplierModalCurrentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.supplierModalHasPrevious) {
      this.onPageChange(this.supplierModalCurrentPage - 1, event);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    if (this.supplierModalTotalPages <= 0) {
      return pages;
    }

    const maxVisible = 5;
    let start = Math.max(1, this.supplierModalCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.supplierModalTotalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSelectSupplier(supplier: Supplier): void {
    this.supplierSelected.emit(supplier);
    this.onVisibleChange(false);
  }

  onClearSelection(): void {
    this.clearSelected.emit();
    this.onVisibleChange(false);
  }

  private mapSupplier(s: any): Supplier {
    return {
      supplierId: s.supplierId ?? s.id ?? s.SupplierId,
      supplierName: s.supplierName ?? s.name ?? s.SupplierName ?? '',
      supplierCode: s.supplierCode ?? s.code ?? s.SupplierCode ?? ''
    };
  }

}
