import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective, CardBodyComponent, CardComponent, CardHeaderComponent, TableModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, of, retry, timeout } from 'rxjs';
import { CountStockOrder } from '../Models/stock-counting.model';
import { StockCountingService } from '../Services/stock-counting.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';

type CountStockOrderView = CountStockOrder & {
  statusText: string;
  statusBadgeClass: string;
  canSubmit: boolean;
  modeText: string;
};

@Component({
  selector: 'app-stock-counting-orders',
  imports: [
    CommonModule,
    DatePipe,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    TableModule,
    IconDirective,
    TranslatePipe
  ],
  templateUrl: './stock-counting-orders.component.html',
  styleUrl: './stock-counting-orders.component.scss'
})
export class StockCountingOrdersComponent implements OnInit {
  warehouseId = 0;
  loading = true;
  orders: CountStockOrderView[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  hasNext = false;
  hasPrevious = false;
  Math = Math;
  private loadToken = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private stockService: StockCountingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const nextWarehouseId = Number(params['warehouseId'] || 0);
      this.warehouseId = nextWarehouseId;
      this.currentPage = 1;
      this.runUiUpdate(() => this.loadOrders());
    });
  }

  onBack(): void {
    this.router.navigate(['/processes/stock-counting/menu', this.warehouseId]);
  }

  onAddOrder(): void {
    this.router.navigate(['/processes/stock-counting/order-form', this.warehouseId]);
  }

  onEditOrder(order: CountStockOrder): void {
    this.router.navigate(['/processes/stock-counting/order-form', this.warehouseId, order.countStockId]);
  }

  onOpenItems(order: CountStockOrder): void {
    this.router.navigate(['/processes/stock-counting/order-items', this.warehouseId, order.countStockId]);
  }

  onDeleteOrder(order: CountStockOrder): void {
    if (!confirm(`Delete stock counting order #${order.countStockId}?`)) {
      return;
    }

    this.stockService.deleteOrder(order.countStockId).subscribe({
      next: () => {
        this.toastr.success('Order deleted successfully.', 'Success');
        this.loadOrders();
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Failed to delete order.'), 'Error');
      }
    });
  }

  onSubmit(order: CountStockOrder): void {
    this.stockService.submitOrder(order.countStockId, 'submitted from stock counting orders').subscribe({
      next: () => {
        this.toastr.success('Order submitted successfully.', 'Success');
        this.loadOrders();
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Submit failed.'), 'Error');
      }
    });
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (page < 1) {
      page = 1;
    }
    if (page > this.totalPages) {
      page = this.totalPages;
    }
    if (page === this.currentPage || this.loading) {
      return;
    }

    this.currentPage = page;
    this.loadOrders();
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

  private loadOrders(): void {
    if (!this.warehouseId) {
      this.orders = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.hasNext = false;
      this.hasPrevious = false;
      this.loading = false;
      return;
    }

    const currentLoadToken = ++this.loadToken;
    this.loading = true;
    const failSafe = setTimeout(() => {
      if (currentLoadToken !== this.loadToken || !this.loading) {
        return;
      }
      this.runUiUpdate(() => {
        if (currentLoadToken !== this.loadToken || !this.loading) {
          return;
        }
        this.loading = false;
        this.toastr.error('Loading orders is taking too long. Please check API health.', 'Error');
      });
    }, 20000);

    this.stockService.getOrdersByWarehousePaged(this.warehouseId, this.currentPage, this.itemsPerPage)
      .pipe(
        timeout(8000),
        retry({ count: 1, delay: 800 }),
        catchError(() => this.stockService.getOrdersByWarehouse(this.warehouseId).pipe(timeout(8000))),
        catchError((err) => of({ __loadError: err })),
        finalize(() => {
          clearTimeout(failSafe);
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }
            this.loading = false;
          });
        })
      )
      .subscribe({
        next: (res) => {
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }
            if (res?.__loadError) {
              this.orders = [];
              this.totalItems = 0;
              this.totalPages = 0;
              this.hasNext = false;
              this.hasPrevious = false;
              const fallback = this.isTimeoutError(res.__loadError)
                ? 'Loading orders timed out. Please verify backend/API and try again.'
                : 'Failed to load stock counting orders.';
              this.toastr.error(this.extractError(res.__loadError, fallback), 'Error');
              return;
            }

            const paged = this.pickPagedData(res);
            if (paged) {
              const responsePageNumber = Number(this.readProp(paged, 'pageNumber', 'PageNumber') || this.currentPage || 1);
              const responsePageSize = Number(this.readProp(paged, 'pageSize', 'PageSize') || this.itemsPerPage || 10);
              const responseTotalRecords = Number(this.readProp(paged, 'totalRecords', 'TotalRecords') || 0);
              const responseTotalPages = Number(this.readProp(paged, 'totalPages', 'TotalPages') || 0);
              const hasPrevious = this.toNullableBoolean(this.readProp(paged, 'hasPrevious', 'HasPrevious'));
              const hasNext = this.toNullableBoolean(this.readProp(paged, 'hasNext', 'HasNext'));

              this.currentPage = responsePageNumber > 0 ? responsePageNumber : this.currentPage;
              this.itemsPerPage = responsePageSize > 0 ? responsePageSize : this.itemsPerPage;
              this.totalItems = responseTotalRecords >= 0 ? responseTotalRecords : 0;

              const pagedOrders = this.toArray<any>(this.readProp(paged, 'data', 'Data'))
                .map((order) => this.mapOrder(order))
                .sort((a, b) => b.countStockId - a.countStockId);

              const calculatedTotalPages = this.totalItems > 0
                ? Math.ceil(this.totalItems / Math.max(this.itemsPerPage, 1))
                : 0;
              this.totalPages = responseTotalPages > 0 ? responseTotalPages : calculatedTotalPages;
              this.hasPrevious = hasPrevious ?? this.currentPage > 1;
              this.hasNext = hasNext ?? this.currentPage < this.totalPages;
              this.orders = pagedOrders;

              if (this.totalPages > 0 && this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages;
                this.loadOrders();
              }
              return;
            }

            const allOrders = this.toArray<any>(res)
              .map((order) => this.mapOrder(order))
              .sort((a, b) => b.countStockId - a.countStockId);

            this.totalItems = allOrders.length;
            this.totalPages = this.totalItems > 0
              ? Math.ceil(this.totalItems / Math.max(this.itemsPerPage, 1))
              : 0;
            if (this.currentPage > this.totalPages) {
              this.currentPage = Math.max(1, this.totalPages);
            }

            const start = (this.currentPage - 1) * this.itemsPerPage;
            this.orders = allOrders.slice(start, start + this.itemsPerPage);
            this.hasPrevious = this.currentPage > 1;
            this.hasNext = this.currentPage < this.totalPages;
          });
        },
        error: (err) => {
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }
            this.orders = [];
            this.totalItems = 0;
            this.totalPages = 0;
            this.hasNext = false;
            this.hasPrevious = false;
            const fallback = this.isTimeoutError(err)
              ? 'Loading orders timed out. Please verify backend/API and try again.'
              : 'Failed to load stock counting orders.';
            this.toastr.error(this.extractError(err, fallback), 'Error');
          });
        }
      });
  }

  private toArray<T>(res: any): T[] {
    if (Array.isArray(res?.data?.$values)) {
      return res.data.$values as T[];
    }
    if (Array.isArray(res?.data)) {
      return res.data as T[];
    }
    if (Array.isArray(res?.Data?.$values)) {
      return res.Data.$values as T[];
    }
    if (Array.isArray(res?.Data)) {
      return res.Data as T[];
    }
    if (Array.isArray(res?.data?.data?.data?.$values)) {
      return res.data.data.data.$values as T[];
    }
    if (Array.isArray(res?.data?.data?.data)) {
      return res.data.data.data as T[];
    }
    if (Array.isArray(res?.data?.data?.$values)) {
      return res.data.data.$values as T[];
    }
    if (Array.isArray(res?.data?.data)) {
      return res.data.data as T[];
    }
    if (Array.isArray(res?.data?.$values)) {
      return res.data.$values as T[];
    }
    if (Array.isArray(res?.data)) {
      return res.data as T[];
    }
    if (Array.isArray(res?.Data?.Data?.Data)) {
      return res.Data.Data.Data as T[];
    }
    if (Array.isArray(res?.Data?.Data)) {
      return res.Data.Data as T[];
    }
    if (Array.isArray(res?.Data)) {
      return res.Data as T[];
    }
    if (Array.isArray(res)) {
      return res as T[];
    }
    return [];
  }

  private pickPagedData(res: any): any | null {
    const candidates = [
      res?.data?.data,
      res?.data,
      res?.Data?.Data,
      res?.Data,
      res
    ];

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const hasPagingFields =
        this.readProp(candidate, 'pageNumber', 'PageNumber') !== undefined ||
        this.readProp(candidate, 'pageSize', 'PageSize') !== undefined ||
        this.readProp(candidate, 'totalRecords', 'TotalRecords') !== undefined ||
        this.readProp(candidate, 'totalPages', 'TotalPages') !== undefined;

      const containsData =
        this.readProp(candidate, 'data', 'Data') !== undefined;

      if (hasPagingFields && containsData) {
        return candidate;
      }
    }

    return null;
  }

  private normalizeStatus(status: any): string {
    const raw = String(status ?? '').trim();
    const asNumber = Number(raw);
    if (!Number.isNaN(asNumber)) {
      switch (asNumber) {
        case 1: return 'Draft';
        case 2: return 'Processing';
        case 3: return 'Completed';
        case 4: return 'Approval';
        default: return raw || 'Unknown';
      }
    }
    return raw || 'Unknown';
  }

  private extractError(err: any, fallback: string): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    if (err?.message) return err.message;
    return fallback;
  }

  private mapOrder(raw: any): CountStockOrderView {
    const statusText = this.normalizeStatus(this.readProp(raw, 'status', 'Status'));
    const statusBadgeClass = this.getStatusBadgeClassFromNormalized(statusText);
    const modeValue = this.toNullableString(this.readProp(raw, 'mode', 'Mode', 'docType', 'DocType'));
    return {
      countStockId: Number(this.readProp(raw, 'countStockId', 'CountStockId') || 0),
      status: statusText,
      liveStatus: this.toNullableString(this.readProp(raw, 'liveStatus', 'LiveStatus')),
      userId: String(this.readProp(raw, 'userId', 'UserId') ?? ''),
      comment: this.toNullableString(this.readProp(raw, 'comment', 'Comment')),
      createdAt: this.toNullableString(this.readProp(raw, 'createdAt', 'CreatedAt')) || undefined,
      postingDate: String(this.readProp(raw, 'postingDate', 'PostingDate') ?? ''),
      dueDate: this.toNullableString(this.readProp(raw, 'dueDate', 'DueDate')),
      mode: modeValue,
      warehouseId: Number(this.readProp(raw, 'warehouseId', 'WarehouseId') || this.warehouseId || 0),
      statusText,
      statusBadgeClass,
      canSubmit: statusText === 'Draft',
      modeText: this.normalizeModeText(modeValue)
    };
  }

  private normalizeModeText(mode: string | null): string {
    return String(mode || '').trim().toLowerCase() === 'posting' ? 'Posting' : 'Counting';
  }

  private readProp(obj: any, ...keys: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }

    return undefined;
  }

  private toNullableString(value: any): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const text = String(value).trim();
    return text ? text : null;
  }

  private toNullableBoolean(value: any): boolean | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }

    return null;
  }

  private isTimeoutError(err: any): boolean {
    return String(err?.name || '').toLowerCase() === 'timeouterror';
  }

  private getStatusBadgeClassFromNormalized(status: string): string {
    const value = String(status || '').toLowerCase();
    if (value === 'draft') return 'badge bg-warning';
    if (value === 'processing') return 'badge bg-info';
    if (value === 'completed' || value === 'approved') return 'badge bg-success';
    if (value === 'rejected' || value === 'failed') return 'badge bg-danger';
    return 'badge bg-secondary';
  }

  private runUiUpdate(action: () => void): void {
    setTimeout(() => {
      action();
      this.cdr.detectChanges();
    });
  }
}
