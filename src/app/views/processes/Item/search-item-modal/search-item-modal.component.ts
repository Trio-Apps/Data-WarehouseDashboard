import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule, FormModule, GridModule, ModalModule, TableModule } from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import {
  ItemsService,
  WarehouseItemLookup,
  WarehouseItemLookupSource
} from '../../../Items/Services/items.service';

@Component({
  selector: 'app-search-item-modal',
  imports: [CommonModule, ModalModule, ButtonModule, FormModule, GridModule, TableModule, TranslatePipe],
  templateUrl: './search-item-modal.component.html',
  styleUrl: './search-item-modal.component.scss'
})
export class SearchItemModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() warehouseId = 0;
  @Input() lookupSource: WarehouseItemLookupSource | 'auto' = 'auto';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemSelected = new EventEmitter<WarehouseItemLookup>();
  @Output() clearSelected = new EventEmitter<void>();

  itemModalLoading = false;
  itemModalSearchTerm = '';
  itemModalItems: WarehouseItemLookup[] = [];
  itemModalCurrentPage = 1;
  itemModalItemsPerPage = 20;
  itemModalTotalPages = 0;
  itemModalTotalItems = 0;
  itemModalHasNext = false;
  itemModalHasPrevious = false;

  Math = Math;

  constructor(
    private itemsService: ItemsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      return;
    }

    const becameVisible = !!changes['visible']?.currentValue && !changes['visible']?.previousValue;
    const warehouseChanged = !!changes['warehouseId'] && !changes['warehouseId'].firstChange;
    const lookupSourceChanged = !!changes['lookupSource'] && !changes['lookupSource'].firstChange;

    if (becameVisible || warehouseChanged || lookupSourceChanged) {
      this.loadItems(1);
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
  }

  onSearch(): void {
    this.loadItems(1);
  }

  loadItems(page: number = this.itemModalCurrentPage): void {
    if (!this.warehouseId) {
      this.itemModalItems = [];
      this.itemModalCurrentPage = 1;
      this.itemModalTotalPages = 0;
      this.itemModalTotalItems = 0;
      this.itemModalHasNext = false;
      this.itemModalHasPrevious = false;
      this.cdr.detectChanges();
      return;
    }

    const safePage = page < 1 ? 1 : page;

    this.itemModalLoading = true;
    this.cdr.detectChanges();

    this.searchItemsBySource(safePage)
      .subscribe({
        next: (res: any) => {
          const data = this.extractPaginationContainer(res);
          const rawItems = this.extractRawItems(data);

          this.itemModalItems = rawItems
            .map((item: any) => this.mapItem(item))
            .filter((item: WarehouseItemLookup) => !!item.itemId);

          const totalRecords = +(data?.totalRecords ?? data?.totalCount ?? data?.totalItems ?? 0);
          const pageSize = +(data?.pageSize ?? this.itemModalItemsPerPage);
          const totalPagesFromApi = +(data?.totalPages ?? 0);
          const currentPageFromApi = +(data?.pageNumber ?? data?.currentPage ?? safePage);

          this.itemModalCurrentPage = currentPageFromApi > 0 ? currentPageFromApi : safePage;
          this.itemModalItemsPerPage = pageSize > 0 ? pageSize : this.itemModalItemsPerPage;
          this.itemModalTotalItems = totalRecords > 0 ? totalRecords : 0;
          this.itemModalTotalPages =
            totalPagesFromApi > 0
              ? totalPagesFromApi
              : this.itemModalTotalItems > 0
              ? Math.ceil(this.itemModalTotalItems / this.itemModalItemsPerPage)
              : this.itemModalItems.length > 0
              ? 1
              : 0;

          this.itemModalHasNext =
            typeof data?.hasNext === 'boolean'
              ? data.hasNext
              : this.itemModalCurrentPage < this.itemModalTotalPages;

          this.itemModalHasPrevious =
            typeof data?.hasPrevious === 'boolean' ? data.hasPrevious : this.itemModalCurrentPage > 1;

          this.itemModalLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading paged items:', err);
          this.itemModalLoading = false;
          this.itemModalItems = [];
          this.itemModalTotalItems = 0;
          this.itemModalTotalPages = 0;
          this.itemModalHasNext = false;
          this.itemModalHasPrevious = false;
          this.toastr.error('Failed to load items. Please try again.', 'Error');
          this.cdr.detectChanges();
        }
      });
  }

  private searchItemsBySource(page: number): Observable<any> {
    const source = this.resolveLookupSource();
    const term = this.itemModalSearchTerm || undefined;

    switch (source) {
      case 'purchase':
        return this.itemsService.searchItemsByWarehouseForPurchase(
          this.warehouseId,
          term,
          page,
          this.itemModalItemsPerPage
        );
      case 'sales':
        return this.itemsService.searchItemsByWarehouseForSales(
          this.warehouseId,
          term,
          page,
          this.itemModalItemsPerPage
        );
      default:
        return this.itemsService.searchItemsByWarehouseForInventory(
          this.warehouseId,
          term,
          page,
          this.itemModalItemsPerPage
        );
    }
  }

  private resolveLookupSource(): WarehouseItemLookupSource {
    if (this.lookupSource !== 'auto') {
      return this.lookupSource;
    }

    const currentUrl = this.router.url.toLowerCase();
    if (currentUrl.includes('/processes/purchases/')) {
      return 'purchase';
    }
    if (currentUrl.includes('/processes/sales/')) {
      return 'sales';
    }

    return 'transferred';
  }

  onPageChange(page: number, event?: Event): void {
    event?.preventDefault();

    let targetPage = page;
    if (targetPage < 1) {
      targetPage = 1;
    }
    if (this.itemModalTotalPages > 0 && targetPage > this.itemModalTotalPages) {
      targetPage = this.itemModalTotalPages;
    }

    if (targetPage !== this.itemModalCurrentPage) {
      this.loadItems(targetPage);
    }
  }

  onNextPage(event?: Event): void {
    event?.preventDefault();
    if (this.itemModalHasNext) {
      this.onPageChange(this.itemModalCurrentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    event?.preventDefault();
    if (this.itemModalHasPrevious) {
      this.onPageChange(this.itemModalCurrentPage - 1, event);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    if (this.itemModalTotalPages <= 0) {
      return pages;
    }

    const maxVisible = 5;
    let start = Math.max(1, this.itemModalCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.itemModalTotalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  onSelectItem(item: WarehouseItemLookup): void {
    this.itemSelected.emit(item);
    this.onVisibleChange(false);
  }

  onClearSelection(): void {
    this.clearSelected.emit();
    this.onVisibleChange(false);
  }

  private extractPaginationContainer(res: any): any {
    if (res?.data && typeof res.data === 'object') {
      return res.data;
    }
    return res ?? {};
  }

  private extractRawItems(data: any): any[] {
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data?.items)) {
      return data.items;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }

  private mapItem(item: any): WarehouseItemLookup {
    return {
      itemId: item?.itemId ?? item?.id ?? item?.ItemId,
      itemCode: item?.itemCode ?? item?.code ?? item?.ItemCode ?? '',
      itemName: item?.itemName ?? item?.name ?? item?.ItemName ?? ''
    };
  }
}
