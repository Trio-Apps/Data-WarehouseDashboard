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
import { EditTransferredStockItemModalComponent } from './edit-transferred-stock-item-modal/edit-transferred-stock-item-modal.component';
import { TransferredRequestService } from '../Services/transferred-request.service';
import { TransferredStockService } from '../Services/transferred-stock.service';
import { TransferredItem, TransferredStock } from '../Models/transferred-stock.model';
import { TransferredRequest } from '../Models/transferred-request.model';

@Component({
  selector: 'app-transferred-stock',
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
    EditTransferredStockItemModalComponent
  ],
  templateUrl: './transferred-stock.component.html',
  styleUrl: './transferred-stock.component.scss'
})
export class TransferredStockComponent implements OnInit {
  transferredRequestId = 0;
  transferredStockId = 0;

  transferredRequest: TransferredRequest | null = null;
  transferredStock: TransferredStock | null = null;
  items: TransferredItem[] = [];

  loading = true;
  warehouseId = 0;

  showEditItemModal = false;
  selectedItem: TransferredItem | null = null;

  showApprovalModal = false;
  approvalComment = '';
  approvalSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transferredRequestService: TransferredRequestService,
    private transferredStockService: TransferredStockService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const requestId = +(params['transferredRequestId'] || 0);
      const stockId = +(params['transferredStockId'] || 0);
      const changed = requestId !== this.transferredRequestId || stockId !== this.transferredStockId;

      if (!changed && (requestId > 0 || stockId > 0)) {
        return;
      }

      this.transferredRequestId = requestId;
      this.transferredStockId = stockId;
      this.initializePage();
    });
  }

  private initializePage(): void {
    this.loading = true;
    this.transferredStock = null;
    this.items = [];

    if (this.transferredStockId > 0) {
      this.loadTransferredStock();
      return;
    }

    if (this.transferredRequestId > 0) {
      this.loadTransferredRequest(true);
      return;
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  private loadTransferredRequest(resolveStockFromRequest: boolean): void {
    if (!this.transferredRequestId) {
      if (resolveStockFromRequest) {
        this.loading = false;
        this.cdr.detectChanges();
      }
      return;
    }

    this.transferredRequestService.getTransferredRequestById(this.transferredRequestId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.transferredRequest = res.data as TransferredRequest;
          this.warehouseId = Number(this.transferredRequest.warehouseId || this.warehouseId || 0);
        }

        if (!resolveStockFromRequest) {
          this.cdr.detectChanges();
          return;
        }

        const linkedStockId = Number(this.transferredRequest?.transferredStockId || 0);
        if (linkedStockId > 0) {
          this.transferredStockId = linkedStockId;
          this.loadTransferredStock();
          return;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading transferred request:', err);
        if (resolveStockFromRequest) {
          this.loading = false;
          this.toastr.error('Failed to load transferred request.', 'Error');
        }
        this.cdr.detectChanges();
      }
    });
  }

  private loadTransferredStock(): void {
    if (!this.transferredStockId) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.transferredStockService.getTransferredStockById(this.transferredStockId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.transferredStock = res.data as TransferredStock;
          this.warehouseId = Number(this.transferredStock.warehouseId || this.warehouseId || 0);
        } else {
          this.transferredStock = null;
        }

        if (this.transferredRequestId > 0 && !this.transferredRequest) {
          this.loadTransferredRequest(false);
        }

        this.loadTransferredItems();
      },
      error: (err) => {
        console.error('Error loading transferred stock:', err);
        this.loading = false;
        this.transferredStock = null;
        this.items = [];
        this.toastr.error('Failed to load transferred stock. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private loadTransferredItems(): void {
    if (!this.transferredStockId) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.transferredStockService.getTransferredItemsByStockId(this.transferredStockId).subscribe({
      next: (res: any) => {
        const data = res;
        if (Array.isArray(data)) {
          this.items = data;
        } else if (Array.isArray(data?.data)) {
          this.items = data.data;
        } else {
          this.items = [];
        }
        console.log("items",res);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading transferred stock items:', err);
        this.items = [];
        this.loading = false;
        this.toastr.error('Failed to load transferred stock items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCreateTransferredStock(): void {
    if (!this.transferredRequestId) {
      this.toastr.warning('Transferred request ID is missing.', 'Warning');
      return;
    }

    const targetWarehouseId = Number(this.transferredRequest?.warehouseId || this.warehouseId || 0);
    if (!targetWarehouseId) {
      this.toastr.warning('Warehouse ID is missing.', 'Warning');
      return;
    }

    this.router.navigate([
      '/processes/transferred-request/transferred-stock-form',
      targetWarehouseId,
      this.transferredRequestId
    ]);
  }

  onDeleteTransferredStock(): void {
    if (!this.transferredStockId) {
      return;
    }

    if (!confirm(`Are you sure you want to delete transferred stock #${this.transferredStockId}?`)) {
      return;
    }

    this.transferredStockService.deleteTransferredStock(this.transferredStockId).subscribe({
      next: () => {
        this.toastr.success('Transferred stock deleted successfully.', 'Success');
        this.transferredStockId = 0;
        this.transferredStock = null;
        this.items = [];

        if (this.transferredRequestId > 0) {
          this.loadTransferredRequest(true);
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error deleting transferred stock:', err);
        const errorMessage =
          err?.error?.message || 'Error deleting transferred stock. Please try again.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  onAddItem(): void {
    if (!this.transferredStockId) {
      this.toastr.warning('Please create transferred stock first.', 'Warning');
      return;
    }

    const targetWarehouseId = Number(
      this.transferredStock?.warehouseId || this.warehouseId || 0
    );

    this.router.navigate([
      '/processes/transferred-request/add-transferred-stock-item',
      this.transferredRequestId || 0,
      this.transferredStockId,
      targetWarehouseId
    ]);
  }

  onEditItem(item: TransferredItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  onItemUpdated(): void {
    this.loadTransferredStock();
  }

  onViewBatches(item: TransferredItem): void {
    if (!item.transferredItemId || !this.transferredStockId) {
      return;
    }

    this.router.navigate([
      '/processes/transferred-request/transferred-stock-batches',
      this.transferredRequestId || 0,
      this.transferredStockId,
      item.transferredItemId,
      item.quantity
    ]);
  }

  onRemoveItem(item: TransferredItem): void {
    if (!item.transferredItemId) {
      return;
    }

    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from stock?`)) {
      this.transferredStockService.deleteTransferredItem(item.transferredItemId).subscribe({
        next: () => {
          this.toastr.success('Item removed successfully.', 'Success');
          this.loadTransferredItems();
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
      this.transferredStock?.warehouseId ||
      this.transferredRequest?.warehouseId ||
      this.warehouseId ||
      0
    );

    if (this.transferredRequestId > 0 && targetWarehouseId > 0) {
      this.router.navigate(['/processes/transferred-request', targetWarehouseId]);
      return;
    }

    if (this.transferredRequestId === 0 && targetWarehouseId > 0) {
      this.router.navigate(['/processes/transferred-request/transferred-stock-orders', targetWarehouseId]);
      return;
    }

    this.router.navigate(['/processes/approval-process/my-processes']);
  }

  getTotalQuantity(): number {
    return this.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  getStatusBadgeClass(stock: TransferredStock | null): string {
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

  getStatusText(stock: TransferredStock | null): string {
    return stock?.status || 'Unknown';
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

  isApproved(stock: TransferredStock | null): boolean {
    const rawStatus = stock?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(stock: TransferredStock | null): string {
    const rawStatus = stock?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(stock: TransferredStock | null): string {
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
    if (!this.transferredStock?.processApprovalId) {
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
    if (!this.transferredStock?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }

    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();

    this.approvalService
      .changeApprovalStatus(approved, this.transferredStock.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadTransferredStock();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }

  onEditTransferredStock(): void {
    const stockId = Number(this.transferredStock?.transferredStockId || this.transferredStockId || 0);
    const warehouseId = Number(this.transferredStock?.warehouseId || this.warehouseId || 0);
    if (!stockId || !warehouseId) {
      return;
    }

    this.router.navigate([
      '/processes/transferred-request/transferred-stock-form',
      warehouseId,
      this.transferredRequestId || 0,
      stockId
    ]);
  }
}
