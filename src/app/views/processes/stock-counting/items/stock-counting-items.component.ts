import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonModule,
  CardModule,
  FormModule,
  GridModule,
  ModalModule,
  TableModule,
  UtilitiesModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs';
import { CountStockItem, CountStockOrder } from '../Models/stock-counting.model';
import { StockCountingService } from '../Services/stock-counting.service';

@Component({
  selector: 'app-stock-counting-items',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    UtilitiesModule,
    ModalModule,
    IconDirective
  ],
  templateUrl: './stock-counting-items.component.html',
  styleUrl: './stock-counting-items.component.scss'
})
export class StockCountingItemsComponent implements OnInit {
  warehouseId = 0;
  countStockId = 0;
  loading = true;
  savingItem = false;
  loadingItemOptions = false;
  editingItemId = 0;
  showItemModal = false;
  isDraftOrder = false;
  orderStatusText = '-';
  tableColSpan = 6;
  private pageLoadToken = 0;

  order: CountStockOrder | null = null;
  items: CountStockItem[] = [];
  itemOptions: Array<{ itemId: number; itemCode: string; itemName: string }> = [];

  itemForm = this.fb.group({
    itemId: [null as number | null, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(0.000001)]],
    uoMEntry: [1, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private stockService: StockCountingService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const nextWarehouseId = Number(params['warehouseId'] || 0);
      const nextCountStockId = Number(params['countStockId'] || 0);
      this.runUiUpdate(() => {
        this.warehouseId = nextWarehouseId;
        this.countStockId = nextCountStockId;
        this.loadItemOptions();
        this.loadPage();
      });
    });
  }

  onBackToOrders(): void {
    this.router.navigate(['/processes/stock-counting/orders', this.warehouseId]);
  }

  onViewBatches(item: CountStockItem): void {
    this.router.navigate(['/processes/stock-counting/batches', this.warehouseId, this.countStockId, item.countStockItemId]);
  }

  onAddItem(): void {
    if (!this.isDraftOrder) {
      this.toastr.warning('Only Draft orders can be edited.', 'Warning');
      return;
    }

    this.editingItemId = 0;
    this.itemForm.reset({ itemId: null, quantity: 1, uoMEntry: 1 });
    this.itemForm.get('itemId')?.enable({ emitEvent: false });
    if (!this.itemOptions.length && !this.loadingItemOptions) {
      this.loadItemOptions();
    }
    this.runUiUpdate(() => {
      this.showItemModal = true;
    });
  }

  onEditItem(item: CountStockItem): void {
    if (!this.isDraftOrder) {
      this.toastr.warning('Only Draft orders can be edited.', 'Warning');
      return;
    }

    this.editingItemId = item.countStockItemId;
    this.itemForm.reset({
      itemId: item.itemId,
      quantity: item.quantity,
      uoMEntry: item.uoMEntry
    });
    this.ensureItemOption(item.itemId);
    this.itemForm.get('itemId')?.disable({ emitEvent: false });
    this.runUiUpdate(() => {
      this.showItemModal = true;
    });
  }

  onRemoveItem(item: CountStockItem): void {
    if (!this.isDraftOrder) {
      this.toastr.warning('Only Draft orders can be edited.', 'Warning');
      return;
    }

    if (Number(item.countStockId || 0) !== this.countStockId) {
      this.toastr.warning('Item list was out of date. Reloaded latest items.', 'Warning');
      this.loadItems();
      return;
    }

    if (!confirm(`Delete item #${item.countStockItemId}?`)) {
      return;
    }

    this.stockService.deleteItem(item.countStockItemId).subscribe({
      next: () => {
        this.toastr.success('Item deleted successfully.', 'Success');
        this.runUiUpdate(() => {
          this.loadItems();
        });
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Failed to delete item.'), 'Error');
      }
    });
  }

  onSaveItem(): void {
    if (this.savingItem) return;
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.toastr.error('Please provide valid values.', 'Validation');
      return;
    }

    const itemId = Number(this.itemForm.getRawValue().itemId || 0);
    const quantity = Number(this.itemForm.value.quantity || 0);
    const uoMEntry = Number(this.itemForm.value.uoMEntry || 0);
    if (!itemId || quantity <= 0 || uoMEntry <= 0) {
      this.toastr.error('Invalid item payload.', 'Validation');
      return;
    }

    this.runUiUpdate(() => {
      this.savingItem = true;
    });

    if (this.editingItemId) {
      this.stockService.updateItem(this.editingItemId, {
        countStockItemId: this.editingItemId,
        quantity,
        uoMEntry
      }).subscribe({
        next: () => {
          this.runUiUpdate(() => {
            this.savingItem = false;
            this.showItemModal = false;
            this.toastr.success('Item updated successfully.', 'Success');
            this.loadItems();
          });
        },
        error: (err) => {
          this.runUiUpdate(() => {
            this.savingItem = false;
            this.toastr.error(this.extractError(err, 'Failed to update item.'), 'Error');
          });
        }
      });
      return;
    }

    this.stockService.addItem(this.countStockId, {
      countStockId: this.countStockId,
      itemId,
      quantity,
      uoMEntry
    }).subscribe({
      next: () => {
        this.runUiUpdate(() => {
          this.savingItem = false;
          this.showItemModal = false;
          this.toastr.success('Item added successfully.', 'Success');
          this.loadItems();
        });
      },
      error: (err) => {
        this.runUiUpdate(() => {
          this.savingItem = false;
          this.toastr.error(this.extractError(err, 'Failed to add item.'), 'Error');
        });
      }
    });
  }

  onItemModalVisibleChange(visible: boolean): void {
    if (visible === this.showItemModal) {
      return;
    }
    this.runUiUpdate(() => {
      this.showItemModal = visible;
      if (!visible) {
        this.savingItem = false;
        this.editingItemId = 0;
        this.itemForm.get('itemId')?.enable({ emitEvent: false });
      }
    });
  }

  private loadPage(): void {
    const currentLoadToken = ++this.pageLoadToken;
    const requestedCountStockId = this.countStockId;

    this.runUiUpdate(() => {
      this.loading = true;
      this.order = null;
      this.items = [];
      this.syncOrderViewState();
    });
    this.stockService.getOrderById(requestedCountStockId).pipe(timeout(10000)).subscribe({
      next: (res) => {
        this.runUiUpdate(() => {
          if (currentLoadToken !== this.pageLoadToken || requestedCountStockId !== this.countStockId) {
            return;
          }
          this.order = this.mapOrder(this.pickData<any>(res));
          this.syncOrderViewState();
          this.loadItems(currentLoadToken, requestedCountStockId);
        });
      },
      error: (err) => {
        this.runUiUpdate(() => {
          if (currentLoadToken !== this.pageLoadToken || requestedCountStockId !== this.countStockId) {
            return;
          }
          this.loading = false;
          this.order = null;
          this.items = [];
          this.syncOrderViewState();
          const fallback = this.isTimeoutError(err)
            ? 'Loading order timed out. Please try again.'
            : 'Failed to load order.';
          this.toastr.error(this.extractError(err, fallback), 'Error');
        });
      }
    });
  }

  private loadItems(loadToken = this.pageLoadToken, requestedCountStockId = this.countStockId): void {
    this.stockService.getItemsByOrder(requestedCountStockId).pipe(timeout(10000)).subscribe({
      next: (res) => {
        this.runUiUpdate(() => {
          if (loadToken !== this.pageLoadToken || requestedCountStockId !== this.countStockId) {
            return;
          }
          const mappedItems = this.toArray<any>(res).map((item) => this.mapItem(item, requestedCountStockId));
          this.items = mappedItems.filter((item) => Number(item.countStockId || 0) === requestedCountStockId);
          this.loading = false;
        });
      },
      error: (err) => {
        this.runUiUpdate(() => {
          if (loadToken !== this.pageLoadToken || requestedCountStockId !== this.countStockId) {
            return;
          }
          this.items = [];
          this.loading = false;
          const fallback = this.isTimeoutError(err)
            ? 'Loading items timed out. Please try again.'
            : 'Failed to load items.';
          this.toastr.error(this.extractError(err, fallback), 'Error');
        });
      }
    });
  }

  private loadItemOptions(): void {
    if (!this.warehouseId) {
      this.runUiUpdate(() => {
        this.itemOptions = [];
        this.loadingItemOptions = false;
      });
      return;
    }

    this.runUiUpdate(() => {
      this.loadingItemOptions = true;
    });
    this.stockService.getWarehouseItemsForSelection(this.warehouseId, 1, 1000, '', '')
      .pipe(timeout(10000))
      .subscribe({
      next: (res) => {
        this.runUiUpdate(() => {
          this.itemOptions = this.toArray<any>(res)
            .map((item) => this.mapItemOption(item))
            .filter((item) => item.itemId > 0);
          this.loadingItemOptions = false;
        });
      },
      error: (err) => {
        this.runUiUpdate(() => {
          this.itemOptions = [];
          this.loadingItemOptions = false;
          if (this.isTimeoutError(err)) {
            this.toastr.warning('Loading items list timed out. You can retry.', 'Warning');
          }
        });
      }
    });
  }

  private toArray<T>(res: any): T[] {
    if (Array.isArray(res?.data?.data?.data?.$values)) return res.data.data.data.$values as T[];
    if (Array.isArray(res?.data?.data?.data)) return res.data.data.data as T[];
    if (Array.isArray(res?.data?.data?.$values)) return res.data.data.$values as T[];
    if (Array.isArray(res?.data?.data)) return res.data.data as T[];
    if (Array.isArray(res?.data?.$values)) return res.data.$values as T[];
    if (Array.isArray(res?.data)) return res.data as T[];
    if (Array.isArray(res)) return res as T[];
    return [];
  }

  private pickData<T>(res: any): T {
    if (res?.data?.data) return res.data.data as T;
    if (res?.data) return res.data as T;
    return res as T;
  }

  private extractError(err: any, fallback: string): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    return fallback;
  }

  private normalizeOrderStatus(status: any): string {
    const raw = String(status ?? '').trim();
    if (!raw) {
      return '-';
    }

    const asNumber = Number(raw);
    if (!Number.isNaN(asNumber)) {
      switch (asNumber) {
        case 1:
          return 'Draft';
        case 2:
          return 'Processing';
        case 3:
          return 'Completed';
        case 4:
          return 'Approval';
        default:
          return raw;
      }
    }

    return raw;
  }

  private syncOrderViewState(): void {
    this.orderStatusText = this.normalizeOrderStatus(this.order?.status);
    this.isDraftOrder = this.orderStatusText.toLowerCase() === 'draft';
    this.tableColSpan = this.isDraftOrder ? 7 : 6;
  }

  private mapOrder(raw: any): CountStockOrder {
    return {
      countStockId: Number(this.readProp(raw, 'countStockId', 'CountStockId') || 0),
      status: String(this.readProp(raw, 'status', 'Status') ?? ''),
      liveStatus: this.toNullableString(this.readProp(raw, 'liveStatus', 'LiveStatus')),
      userId: String(this.readProp(raw, 'userId', 'UserId') ?? ''),
      comment: this.toNullableString(this.readProp(raw, 'comment', 'Comment')),
      createdAt: this.toNullableString(this.readProp(raw, 'createdAt', 'CreatedAt')) || undefined,
      postingDate: String(this.readProp(raw, 'postingDate', 'PostingDate') ?? ''),
      dueDate: this.toNullableString(this.readProp(raw, 'dueDate', 'DueDate')),
      mode: this.toNullableString(this.readProp(raw, 'mode', 'Mode', 'docType', 'DocType')),
      warehouseId: Number(this.readProp(raw, 'warehouseId', 'WarehouseId') || this.warehouseId || 0)
    };
  }

  private mapItem(raw: any, fallbackCountStockId: number = this.countStockId): CountStockItem {
    return {
      countStockItemId: Number(this.readProp(raw, 'countStockItemId', 'CountStockItemId') || 0),
      quantity: Number(this.readProp(raw, 'quantity', 'Quantity') || 0),
      status: String(this.readProp(raw, 'status', 'Status') ?? ''),
      errorMessage: this.toNullableString(this.readProp(raw, 'errorMessage', 'ErrorMessage')),
      uoMEntry: Number(this.readProp(raw, 'uoMEntry', 'UoMEntry') || 0),
      barCode: this.toNullableString(this.readProp(raw, 'barCode', 'BarCode')),
      unitPrice: this.toNullableNumber(this.readProp(raw, 'unitPrice', 'UnitPrice')),
      comment: this.toNullableString(this.readProp(raw, 'comment', 'Comment')),
      countStockId: Number(this.readProp(raw, 'countStockId', 'CountStockId') || fallbackCountStockId || 0),
      itemId: Number(this.readProp(raw, 'itemId', 'ItemId') || 0),
      isBatchManaged: this.toNullableBoolean(this.readProp(raw, 'isBatchManaged', 'IsBatchManaged')) ?? true
    };
  }

  private mapItemOption(raw: any): { itemId: number; itemCode: string; itemName: string } {
    const itemId = Number(this.readProp(raw, 'itemId', 'ItemId') || 0);
    const itemCode = String(this.readProp(raw, 'itemCode', 'ItemCode') ?? '');
    const itemName = String(this.readProp(raw, 'itemName', 'ItemName') ?? '');
    return {
      itemId,
      itemCode: itemCode || `#${itemId}`,
      itemName: itemName || `Item #${itemId}`
    };
  }

  private ensureItemOption(itemId: number): void {
    const id = Number(itemId || 0);
    if (!id) {
      return;
    }

    const exists = this.itemOptions.some((x) => Number(x.itemId) === id);
    if (!exists) {
      this.itemOptions = [{ itemId: id, itemCode: `#${id}`, itemName: `Item #${id}` }, ...this.itemOptions];
    }
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

    const asString = String(value);
    return asString.trim() ? asString : null;
  }

  private toNullableNumber(value: any): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const asNumber = Number(value);
    return Number.isNaN(asNumber) ? null : asNumber;
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

  private runUiUpdate(action: () => void): void {
    setTimeout(() => {
      action();
      this.cdr.detectChanges();
    });
  }
}
