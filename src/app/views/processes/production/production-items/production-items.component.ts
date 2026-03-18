import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { FinishedGoodItem, ProductionOrder, ProductionOrderItem } from '../Models/production.model';
import { ProductionService } from '../Services/production.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-production-items',
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
    IconDirective,
    DatePipe,
    TranslatePipe
  ],
  templateUrl: './production-items.component.html',
  styleUrl: './production-items.component.scss'
})
export class ProductionItemsComponent implements OnInit {
  productionOrderId = 0;
  warehouseId = 0;
  loading = true;

  order: ProductionOrder | null = null;
  items: ProductionOrderItem[] = [];
  finishedGoods: FinishedGoodItem[] = [];

  showItemModal = false;
  savingItem = false;
  editingItemId = 0;
  itemForm!: FormGroup;
  showOrderEditModal = false;
  savingOrder = false;
  orderEditForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productionService: ProductionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.itemForm = this.fb.group({
      itemId: [null, [Validators.required, Validators.min(1)]],
      plannedQuantity: [1, [Validators.required, Validators.min(0.000001)]]
    });
    this.orderEditForm = this.fb.group({
      postingDate: [null, Validators.required],
      dueDate: [null, Validators.required],
      remarks: ['']
    });

    this.route.params.subscribe((params) => {
      const newWarehouseId = Number(params['warehouseId'] || 0);
      const newProductionOrderId = Number(params['productionOrderId'] || 0);
      if (!newProductionOrderId) {
        return;
      }

      this.warehouseId = newWarehouseId;
      this.productionOrderId = newProductionOrderId;
      this.loadPage();
    });
  }

  onBackToOrders(): void {
    this.router.navigate(['/processes/production/orders', this.warehouseId]);
  }

  onViewBatches(item: ProductionOrderItem): void {
    if (!this.productionOrderId) {
      return;
    }

    this.router.navigate([
      '/processes/production/header-batches',
      this.warehouseId,
      this.productionOrderId,
      Number(item.plannedQuantity || 0)
    ]);
  }

  onEditOrder(): void {
    if (!this.order) {
      this.toastr.error('Production order data is not loaded yet.', 'Error');
      return;
    }

    this.orderEditForm.reset({
      postingDate: this.toDateInputValue(this.order.postingDate),
      dueDate: this.toDateInputValue(this.order.dueDate),
      remarks: this.order.remarks || ''
    });
    this.setOrderEditModalVisible(true);
  }

  onAddItem(): void {
    if (!this.isDraft()) {
      this.toastr.warning('Only Draft orders can be edited.', 'Warning');
      return;
    }

    this.editingItemId = 0;
    this.itemForm.reset({
      itemId: null,
      plannedQuantity: 1
    });
    this.itemForm.get('itemId')?.enable({ emitEvent: false });
    this.setItemModalVisible(true);
  }

  onEditItem(item: ProductionOrderItem): void {
    if (!this.isDraft()) {
      this.toastr.warning('Only Draft orders can be edited.', 'Warning');
      return;
    }

    this.editingItemId = item.productionOrderItemId;
    this.itemForm.reset({
      itemId: item.itemId,
      plannedQuantity: item.plannedQuantity
    });
    this.itemForm.get('itemId')?.disable({ emitEvent: false });
    this.setItemModalVisible(true);
  }

  onRemoveItem(item: ProductionOrderItem): void {
    if (!this.isDraft()) {
      this.toastr.warning('Only Draft orders can be edited.', 'Warning');
      return;
    }

    if (!confirm(`Delete production item #${item.productionOrderItemId}?`)) {
      return;
    }

    this.productionService.deleteProductionOrderItem(item.productionOrderItemId).subscribe({
      next: () => {
        this.toastr.success('Production item deleted successfully.', 'Success');
        this.loadItems();
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Failed to delete production item.'), 'Error');
      }
    });
  }

  onSaveItem(): void {
    if (this.savingItem) {
      return;
    }

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.toastr.error('Please provide valid item and quantity.', 'Validation');
      return;
    }

    const itemId = Number(this.itemForm.value.itemId || 0);
    const plannedQuantity = Number(this.itemForm.value.plannedQuantity || 0);
    if (!itemId || plannedQuantity <= 0) {
      this.toastr.error('Please provide valid item and quantity.', 'Validation');
      return;
    }

    this.savingItem = true;

    if (this.editingItemId) {
      const current = this.items.find((x) => x.productionOrderItemId === this.editingItemId);
      this.productionService.updateProductionOrderItem(this.editingItemId, {
        plannedQuantity,
        producedQuantity: current?.producedQuantity
      }).subscribe({
        next: () => {
          this.savingItem = false;
        this.setItemModalVisible(false);
        this.toastr.success('Production item updated successfully.', 'Success');
        this.loadItems();
      },
        error: (err) => {
          this.savingItem = false;
          this.toastr.error(this.extractError(err, 'Failed to update production item.'), 'Error');
        }
      });
      return;
    }

    this.productionService.createProductionOrderItem({
      productionOrderId: this.productionOrderId,
      itemId,
      plannedQuantity
    }).subscribe({
      next: () => {
        this.savingItem = false;
        this.setItemModalVisible(false);
        this.toastr.success('Production item added successfully.', 'Success');
        this.loadItems();
      },
      error: (err) => {
        this.savingItem = false;
        this.toastr.error(this.extractError(err, 'Failed to add production item.'), 'Error');
      }
    });
  }

  onItemModalVisibleChange(visible: boolean): void {
    this.setItemModalVisible(visible);
    if (!visible) {
      this.savingItem = false;
      this.editingItemId = 0;
      this.itemForm.get('itemId')?.enable({ emitEvent: false });
    }
  }

  onOrderEditModalVisibleChange(visible: boolean): void {
    this.setOrderEditModalVisible(visible);
    if (!visible) {
      this.savingOrder = false;
    }
  }

  onSaveOrderUpdate(): void {
    if (this.savingOrder) {
      return;
    }

    if (this.orderEditForm.invalid) {
      this.orderEditForm.markAllAsTouched();
      this.toastr.error('Posting date and due date are required.', 'Validation');
      return;
    }

    this.savingOrder = true;
    const payload = {
      postingDate: this.formatDateToISOString(this.orderEditForm.value.postingDate),
      dueDate: this.formatDateToISOString(this.orderEditForm.value.dueDate),
      remarks: String(this.orderEditForm.value.remarks || ''),
      warehouseId: Number(this.order?.warehouseId || this.warehouseId || 0)
    };

    this.productionService.updateProductionOrder(this.productionOrderId, payload).subscribe({
      next: () => {
        this.savingOrder = false;
        this.setOrderEditModalVisible(false);
        this.toastr.success('Production order updated successfully.', 'Success');
        this.loadOrder();
      },
      error: (err) => {
        this.savingOrder = false;
        this.toastr.error(this.extractError(err, 'Failed to update production order.'), 'Error');
      }
    });
  }

  isDraft(): boolean {
    return this.normalizeOrderStatus(this.order?.status) === 'Draft';
  }

  getItemCode(itemId: number): string {
    const item = this.finishedGoods.find((x) => Number(x.itemId) === Number(itemId));
    return item?.itemCode || `Item #${itemId}`;
  }

  getItemName(itemId: number): string {
    const item = this.finishedGoods.find((x) => Number(x.itemId) === Number(itemId));
    return item?.itemName || '-';
  }

  getStatusBadgeClass(status: string): string {
    const value = this.normalizeAnyStatus(status).toLowerCase();
    if (value === 'draft') {
      return 'badge bg-warning';
    }
    if (value === 'planned' || value === 'released' || value === 'processing') {
      return 'badge bg-info';
    }
    if (value === 'received' || value === 'closed' || value === 'completed' || value === 'final') {
      return 'badge bg-success';
    }
    if (value === 'failed' || value === 'partiallyfailed') {
      return 'badge bg-danger';
    }

    return 'badge bg-secondary';
  }

  getOrderStatusText(): string {
    return this.normalizeOrderStatus(this.order?.status);
  }

  getItemStatusText(status: any): string {
    return this.normalizeItemStatus(status);
  }

  private loadPage(): void {
    this.loading = true;
    this.loadOrder();
  }

  private loadOrder(): void {
    this.productionService.getProductionOrderById(this.productionOrderId).subscribe({
      next: (res: any) => {
        const order = this.pickData<ProductionOrder>(res);
        this.order = order;
        this.warehouseId = Number(order?.warehouseId || this.warehouseId);

        this.loadFinishedGoods();
        this.loadItems();
      },
      error: (err) => {
        this.loading = false;
        this.order = null;
        this.items = [];
        this.finishedGoods = [];
        this.toastr.error(this.extractError(err, 'Failed to load production order.'), 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private loadFinishedGoods(): void {
    if (!this.warehouseId) {
      this.finishedGoods = [];
      return;
    }

    this.productionService.getFinishedGoodsByWarehouse(this.warehouseId, 1, 500).subscribe({
      next: (res: any) => {
        this.finishedGoods = this.toArray<FinishedGoodItem>(res);
      },
      error: () => {
        this.finishedGoods = [];
      }
    });
  }

  private loadItems(): void {
    this.productionService.getProductionOrderItems(this.productionOrderId, 1, 200).subscribe({
      next: (res: any) => {
        this.items = this.toArray<ProductionOrderItem>(res);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.items = [];
        this.loading = false;
        this.toastr.error(this.extractError(err, 'Failed to load production items.'), 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private toArray<T>(res: any): T[] {
    if (Array.isArray(res?.data?.data?.$values)) {
      return res.data.data.$values as T[];
    }
    if (Array.isArray(res?.data?.$values)) {
      return res.data.$values as T[];
    }
    if (Array.isArray(res?.$values)) {
      return res.$values as T[];
    }
    if (Array.isArray(res?.data?.data)) {
      return res.data.data as T[];
    }
    if (Array.isArray(res?.data)) {
      return res.data as T[];
    }
    if (Array.isArray(res)) {
      return res as T[];
    }
    return [];
  }

  private pickData<T>(res: any): T {
    if (res?.data?.data) {
      return res.data.data as T;
    }
    if (res?.data) {
      return res.data as T;
    }
    return res as T;
  }

  private extractError(err: any, fallback: string): string {
    const body = err?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body?.message) {
      return body.message;
    }
    if (body?.detail) {
      return body.detail;
    }
    if (Array.isArray(body?.errors) && body.errors.length > 0) {
      return String(body.errors[0]);
    }
    if (body?.errors && typeof body.errors === 'object') {
      const firstKey = Object.keys(body.errors)[0];
      if (firstKey && Array.isArray(body.errors[firstKey]) && body.errors[firstKey].length > 0) {
        return String(body.errors[firstKey][0]);
      }
    }

    return fallback;
  }

  private toDateInputValue(value: any): string {
    const date = new Date(value || new Date());
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatDateToISOString(date: string | Date | null | undefined): string {
    if (!date) {
      return '';
    }

    if (typeof date === 'string') {
      return `${date}T00:00:00`;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  private normalizeAnyStatus(status: any): string {
    const raw = String(status ?? '').trim();
    const asNumber = Number(raw);

    if (!Number.isNaN(asNumber)) {
      switch (asNumber) {
        case 1:
          return 'Draft';
        case 2:
          return 'Processing';
        case 3:
          return 'Released';
        case 4:
          return 'Received';
        case 5:
          return 'Completed';
        case 6:
          return 'PartiallyFailed';
        default:
          return raw || 'Unknown';
      }
    }

    return raw || 'Unknown';
  }

  private normalizeOrderStatus(status: any): string {
    const normalized = this.normalizeAnyStatus(status);
    const value = normalized.toLowerCase();
    if (value === 'received' || value === 'released') {
      return 'Processing';
    }
    if (value === 'failed') {
      return 'PartiallyFailed';
    }
    return normalized;
  }

  private normalizeItemStatus(status: any): string {
    const normalized = this.normalizeAnyStatus(status);
    if (normalized === 'Processing') {
      return 'Planned';
    }
    if (normalized === 'Completed') {
      return 'Closed';
    }
    return normalized;
  }

  private setItemModalVisible(visible: boolean): void {
    setTimeout(() => {
      this.showItemModal = visible;
      this.cdr.detectChanges();
    });
  }

  private setOrderEditModalVisible(visible: boolean): void {
    setTimeout(() => {
      this.showOrderEditModal = visible;
      this.cdr.detectChanges();
    });
  }
}
