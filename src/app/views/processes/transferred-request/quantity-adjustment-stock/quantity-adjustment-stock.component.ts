import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import {
  TableModule,
  CardModule,
  ButtonModule,
  FormModule,
  GridModule,
  UtilitiesModule,
  ModalModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { ApprovalService } from '../../approval-process/Services/approval.service';
import { QuantityAdjustmentStockService } from '../Services/quantity-adjustment-stock.service';
import {
  QuantityAdjustmentStock,
  QuantityAdjustmentStockItem
} from '../Models/quantity-adjustment-stock.model';
import { EditQuantityAdjustmentStockItemModalComponent } from './edit-quantity-adjustment-stock-item-modal/edit-quantity-adjustment-stock-item-modal.component';

@Component({
  selector: 'app-quantity-adjustment-stock',
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    UtilitiesModule,
    ModalModule,
    IconDirective,
    DatePipe,
    EditQuantityAdjustmentStockItemModalComponent
  ],
  templateUrl: './quantity-adjustment-stock.component.html',
  styleUrl: './quantity-adjustment-stock.component.scss'
})
export class QuantityAdjustmentStockComponent implements OnInit {
  quantityAdjustmentStockId = 0;

  quantityAdjustmentStock: QuantityAdjustmentStock | null = null;
  items: QuantityAdjustmentStockItem[] = [];

  loading = true;
  warehouseId = 0;

  showEditItemModal = false;
  selectedItem: QuantityAdjustmentStockItem | null = null;

  showApprovalModal = false;
  approvalComment = '';
  approvalSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quantityAdjustmentStockService: QuantityAdjustmentStockService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const stockId = +(params['quantityAdjustmentStockId'] || 0);
      if (stockId === this.quantityAdjustmentStockId && stockId > 0) {
        return;
      }

      this.quantityAdjustmentStockId = stockId;
      this.initializePage();
    });
  }

  private initializePage(): void {
    this.loading = true;
    this.quantityAdjustmentStock = null;
    this.items = [];

    if (!this.quantityAdjustmentStockId) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadQuantityAdjustmentStock();
  }

  private loadQuantityAdjustmentStock(): void {
    if (!this.quantityAdjustmentStockId) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.quantityAdjustmentStockService
      .getQuantityAdjustmentStockByIdWithWarehouse(this.quantityAdjustmentStockId)
      .subscribe({
        next: (res: any) => {
          this.applyStockResponse(res?.data);
          this.loadQuantityAdjustmentItems();
        },
        error: (err) => {
          console.error('Error loading quantity adjustment stock with warehouse:', err);
          this.loadQuantityAdjustmentStockBasic();
        }
      });
  }

  private loadQuantityAdjustmentStockBasic(): void {
    this.quantityAdjustmentStockService.getQuantityAdjustmentStockById(this.quantityAdjustmentStockId).subscribe({
      next: (res: any) => {
        this.applyStockResponse(res?.data);
        this.loadQuantityAdjustmentItems();
      },
      error: (err) => {
        console.error('Error loading quantity adjustment stock:', err);
        this.loading = false;
        this.quantityAdjustmentStock = null;
        this.items = [];
        this.toastr.error('Failed to load quantity adjustment stock. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private applyStockResponse(stockData: any): void {
    if (stockData) {
      this.quantityAdjustmentStock = stockData as QuantityAdjustmentStock;
      this.warehouseId = Number(this.quantityAdjustmentStock.warehouseId || this.warehouseId || 0);
      return;
    }

    this.quantityAdjustmentStock = null;
  }

  private loadQuantityAdjustmentItems(): void {
    if (!this.quantityAdjustmentStockId) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.quantityAdjustmentStockService.getQuantityAdjustmentItemsByStockId(this.quantityAdjustmentStockId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.items = res;
        } else if (Array.isArray(res?.data)) {
          this.items = res.data;
        } else if (Array.isArray(res?.data?.data)) {
          this.items = res.data.data;
        } else {
          this.items = [];
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading quantity adjustment stock items:', err);
        this.items = [];
        this.loading = false;
        this.toastr.error('Failed to load quantity adjustment stock items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onDeleteQuantityAdjustmentStock(): void {
    if (!this.quantityAdjustmentStockId) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete quantity adjustment stock #${this.quantityAdjustmentStockId}?`
      )
    ) {
      return;
    }

    this.quantityAdjustmentStockService
      .deleteQuantityAdjustmentStock(this.quantityAdjustmentStockId)
      .subscribe({
        next: () => {
          this.toastr.success('Quantity adjustment stock deleted successfully.', 'Success');
          this.onBack();
        },
        error: (err) => {
          console.error('Error deleting quantity adjustment stock:', err);
          const errorMessage =
            err?.error?.message || 'Error deleting quantity adjustment stock. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
  }

  onAddItem(): void {
    if (this.isCompletedStatus(this.quantityAdjustmentStock)) {
      this.toastr.warning('Cannot add items when quantity adjustment status is Completed', 'Warning');
      return;
    }

    if (!this.quantityAdjustmentStockId) {
      this.toastr.warning('Please create quantity adjustment stock first.', 'Warning');
      return;
    }

    const targetWarehouseId = Number(this.quantityAdjustmentStock?.warehouseId || this.warehouseId || 0);
    this.router.navigate([
      '/processes/quantity-adjustment-stock/add-quantity-adjustment-stock-item',
      this.quantityAdjustmentStockId,
      targetWarehouseId
    ]);
  }

  onEditItem(item: QuantityAdjustmentStockItem): void {
    if (this.isCompletedStatus(this.quantityAdjustmentStock)) {
      this.toastr.warning('Cannot edit items when quantity adjustment status is Completed', 'Warning');
      return;
    }

    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  onItemUpdated(): void {
    this.loadQuantityAdjustmentStock();
  }

  onRemoveItem(item: QuantityAdjustmentStockItem): void {
    if (this.isCompletedStatus(this.quantityAdjustmentStock)) {
      this.toastr.warning('Cannot remove items when quantity adjustment status is Completed', 'Warning');
      return;
    }

    if (!item.quantityAdjustmentStockItemId) {
      return;
    }

    if (
      confirm(
        `Are you sure you want to remove "${item.itemName || 'this item'}" from quantity adjustment stock?`
      )
    ) {
      this.quantityAdjustmentStockService
        .deleteQuantityAdjustmentStockItem(item.quantityAdjustmentStockItemId)
        .subscribe({
          next: () => {
            this.toastr.success('Item removed successfully.', 'Success');
            this.loadQuantityAdjustmentItems();
          },
          error: (err) => {
            console.error('Error removing item:', err);
            const errorMessage = err?.error?.message || 'Error removing item. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
    }
  }

  onBack(): void {
    const targetWarehouseId = Number(
      this.quantityAdjustmentStock?.warehouseId || this.warehouseId || 0
    );

    if (targetWarehouseId > 0) {
      this.router.navigate([
        '/processes/quantity-adjustment-stock/quantity-adjustment-stock-orders',
        targetWarehouseId
      ]);
      return;
    }

    this.router.navigate(['/processes/approval-process/my-processes']);
  }

  getTotalQuantity(): number {
    return this.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  getStatusBadgeClass(stock: QuantityAdjustmentStock | null): string {
    if (!stock?.status) {
      return 'badge bg-secondary';
    }

    const status = stock.status.toLowerCase();
    if (status === 'draft' || status.includes('draft')) {
      return 'badge bg-warning';
    }
    if (status === 'completed' || status.includes('completed')) {
      return 'badge bg-success';
    }
    if (status === 'processing' || status.includes('processing')) {
      return 'badge bg-info';
    }
    if (status === 'partiallyfailed' || status.includes('partiallyfailed')) {
      return 'badge bg-danger';
    }

    return 'badge bg-secondary';
  }

  getStatusText(stock: QuantityAdjustmentStock | null): string {
    return stock?.status || 'Unknown';
  }

  isCompletedStatus(stock: QuantityAdjustmentStock | null): boolean {
    const status = (stock?.status || '').trim().toLowerCase();
    return status === 'completed' || status === 'final';
  }

  private mapApprovalStatusText(value: string): string {
    const normalized = value.trim();
    switch (normalized) {
      case '1':
        return 'InProgress';
      case '2':
        return 'Approved';
      case '3':
        return 'Rejected';
      default:
        return normalized;
    }
  }

  isApproved(stock: QuantityAdjustmentStock | null): boolean {
    const rawStatus = stock?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(stock: QuantityAdjustmentStock | null): string {
    const rawStatus = stock?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(stock: QuantityAdjustmentStock | null): string {
    const rawStatus = stock?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'badge bg-secondary';
    }

    const statusText = this.mapApprovalStatusText(String(rawStatus));
    switch (statusText) {
      case 'Approved':
        return 'badge bg-success';
      case 'Rejected':
        return 'badge bg-danger';
      case 'InProgress':
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  }

  onOpenApprovalModal(): void {
    if (!this.quantityAdjustmentStock?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }

    this.approvalComment = '';
    this.setApprovalModalVisible(true);
  }

  onCancelApprovalModal(): void {
    if (this.approvalSubmitting) {
      return;
    }
    this.setApprovalModalVisible(false);
  }

  onApprovalVisibleChange(visible: boolean): void {
    this.setApprovalModalVisible(visible);
  }

  private setApprovalModalVisible(visible: boolean): void {
    setTimeout(() => {
      this.showApprovalModal = visible;
      this.cdr.detectChanges();
    });
  }

  private setApprovalSubmitting(value: boolean): void {
    Promise.resolve().then(() => {
      this.approvalSubmitting = value;
      this.cdr.detectChanges();
    });
  }

  submitApproval(approved: boolean): void {
    if (!this.quantityAdjustmentStock?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }

    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();

    this.approvalService
      .changeApprovalStatus(
        approved,
        this.quantityAdjustmentStock.processApprovalId,
        comment || undefined
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadQuantityAdjustmentStock();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }

  onEditQuantityAdjustmentStock(): void {
    if (this.isCompletedStatus(this.quantityAdjustmentStock)) {
      this.toastr.warning('Cannot edit quantity adjustment stock when status is Completed', 'Warning');
      return;
    }

    const stockId = Number(
      this.quantityAdjustmentStock?.quantityAdjustmentStockId || this.quantityAdjustmentStockId || 0
    );
    const warehouseId = Number(this.quantityAdjustmentStock?.warehouseId || this.warehouseId || 0);
    if (!stockId || !warehouseId) {
      return;
    }

    this.router.navigate([
      '/processes/quantity-adjustment-stock/quantity-adjustment-stock-form',
      warehouseId,
      stockId
    ]);
  }
}
