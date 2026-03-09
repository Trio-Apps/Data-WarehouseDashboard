import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule, ButtonModule, FormModule, GridModule, TableModule } from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { DestinationWarehouse } from '../Models/transferred-request.model';
import { TransferredRequestService } from '../Services/transferred-request.service';

@Component({
  selector: 'app-search-destination-warehouse-modal',
  imports: [CommonModule, ModalModule, ButtonModule, FormModule, GridModule, TableModule],
  templateUrl: './search-destination-warehouse-modal.component.html',
  styleUrl: './search-destination-warehouse-modal.component.scss'
})
export class SearchDestinationWarehouseModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() sourceWarehouseId: number | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() destinationWarehouseSelected = new EventEmitter<DestinationWarehouse>();
  @Output() clearSelected = new EventEmitter<void>();

  warehouseModalLoading = false;
  warehouseModalCode = '';
  warehouseModalName = '';

  warehouseModalWarehouses: DestinationWarehouse[] = [];
  warehouseModalFilteredWarehouses: DestinationWarehouse[] = [];
  warehouseModalCurrentPage = 1;
  warehouseModalItemsPerPage = 10;
  warehouseModalTotalPages = 0;
  warehouseModalTotalItems = 0;
  warehouseModalHasNext = false;
  warehouseModalHasPrevious = false;

  Math = Math;

  constructor(
    private transferredRequestService: TransferredRequestService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnChanges(): void {
    if (this.visible) {
      this.loadWarehouses();
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
  }

  onSearch(): void {
    this.applyFilters(1);
  }

  loadWarehouses(): void {
    this.warehouseModalLoading = true;
    this.cdr.detectChanges();

    this.transferredRequestService.getWarehouses().subscribe({
      next: (res: any) => {
        const rawWarehouses = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res)
              ? res
              : [];

        this.warehouseModalWarehouses = rawWarehouses
          .map((w: any) => this.transferredRequestService.mapWarehouse(w))
          .filter((w: DestinationWarehouse) => !!w.warehouseId)
          .filter((w: DestinationWarehouse) => w.warehouseId !== this.sourceWarehouseId);

        this.applyFilters(1);
        this.warehouseModalLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading warehouses:', err);
        this.warehouseModalLoading = false;
        this.warehouseModalWarehouses = [];
        this.warehouseModalFilteredWarehouses = [];
        this.warehouseModalTotalItems = 0;
        this.warehouseModalTotalPages = 0;
        this.warehouseModalHasNext = false;
        this.warehouseModalHasPrevious = false;
        this.toastr.error('Failed to load warehouses. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private applyFilters(page: number): void {
    const code = this.warehouseModalCode.trim().toLowerCase();
    const name = this.warehouseModalName.trim().toLowerCase();

    const filtered = this.warehouseModalWarehouses.filter((warehouse) => {
      const codeMatch = !code || (warehouse.warehouseCode || '').toLowerCase().includes(code);
      const nameMatch = !name || (warehouse.warehouseName || '').toLowerCase().includes(name);
      return codeMatch && nameMatch;
    });

    const safePage = page < 1 ? 1 : page;
    this.warehouseModalTotalItems = filtered.length;
    this.warehouseModalTotalPages =
      this.warehouseModalTotalItems > 0
        ? Math.ceil(this.warehouseModalTotalItems / this.warehouseModalItemsPerPage)
        : 0;

    const normalizedPage =
      this.warehouseModalTotalPages > 0
        ? Math.min(safePage, this.warehouseModalTotalPages)
        : 1;

    const start = (normalizedPage - 1) * this.warehouseModalItemsPerPage;
    const end = start + this.warehouseModalItemsPerPage;

    this.warehouseModalFilteredWarehouses = filtered.slice(start, end);
    this.warehouseModalCurrentPage = normalizedPage;
    this.warehouseModalHasPrevious = normalizedPage > 1;
    this.warehouseModalHasNext =
      this.warehouseModalTotalPages > 0 && normalizedPage < this.warehouseModalTotalPages;
  }

  onPageChange(page: number, event?: Event): void {
    event?.preventDefault();

    let targetPage = page;
    if (targetPage < 1) {
      targetPage = 1;
    }
    if (this.warehouseModalTotalPages > 0 && targetPage > this.warehouseModalTotalPages) {
      targetPage = this.warehouseModalTotalPages;
    }

    if (targetPage !== this.warehouseModalCurrentPage) {
      this.applyFilters(targetPage);
    }
  }

  onNextPage(event?: Event): void {
    event?.preventDefault();
    if (this.warehouseModalHasNext) {
      this.onPageChange(this.warehouseModalCurrentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    event?.preventDefault();
    if (this.warehouseModalHasPrevious) {
      this.onPageChange(this.warehouseModalCurrentPage - 1, event);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    if (this.warehouseModalTotalPages <= 0) {
      return pages;
    }

    const maxVisible = 5;
    let start = Math.max(1, this.warehouseModalCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.warehouseModalTotalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  onSelectWarehouse(warehouse: DestinationWarehouse): void {
    this.destinationWarehouseSelected.emit(warehouse);
    this.onVisibleChange(false);
  }

  onClearSelection(): void {
    this.clearSelected.emit();
    this.onVisibleChange(false);
  }
}
