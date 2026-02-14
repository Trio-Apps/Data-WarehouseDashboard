import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { GoodsReturnService } from '../Services/goods-return.service';
import { Return, ReturnItem } from '../Models/retrun-model';
import { EditReturnItemModalComponent } from './edit-return-item-modal/edit-return-item-modal.component';
import { ApprovalService } from '../../approval-process/Services/approval.service';

@Component({
  selector: 'app-goods-return',
  standalone: true,
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
    EditReturnItemModalComponent
  ],
  templateUrl: './goods-return.component.html',
  styleUrl: './goods-return.component.scss',
})
export class GoodsReturnComponent implements OnInit {
  receiptOrderId: number = 0;
  purchaseOrderId: number = 0;
  goodsReturnId: number = 0;
  return: Return | null = null;
  returnItems: ReturnItem[] = [];
  loading: boolean = true;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  selectedItem: ReturnItem | null = null;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private returnService: GoodsReturnService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptId')!;
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.goodsReturnId = +this.route.snapshot.paramMap.get('goodsReturnId')!;

    if (this.goodsReturnId) {
      this.loadreturn();
    } else {
      this.loading = false;
    }

    this.route.params.subscribe(params => {
      const newgoodsReturnId = +params['goodsReturnId'];
      if (newgoodsReturnId && newgoodsReturnId !== this.goodsReturnId) {
        this.goodsReturnId = newgoodsReturnId;
        this.loadreturn();
      }
    });
  }

  loadreturn(): void {
    this.loading = true;
    this.returnService.getReturnById(this.goodsReturnId).subscribe({
      next: (res: any) => {
        if (res.data) {
          console.log("return",res);
          this.return = res.data;
          this.warehouseId = res.data.warehouseId || this.warehouseId;
          if (this.return?.goodsReturnOrderId) {
            this.loadreturnItems(this.return.goodsReturnOrderId);
          } else {
            this.returnItems = [];
            this.loading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.return = null;
          this.returnItems = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading return:', err);
        if (err.status === 404) {
          this.return = null;
          this.returnItems = [];
        } else {
          this.toastr.error('Failed to load return. Please try again.', 'Error');
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

 

  loadreturnItems(returnId: number): void {
    this.returnService.getReturnItemsByReturnId(returnId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.returnItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } else {
          this.returnItems = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading return items:', err);
        this.returnItems = [];
        this.loading = false;
        this.toastr.error('Failed to load return items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddReturn(): void {
    this.router.navigate(['/processes/purchases/goods-return-form', this.purchaseOrderId, this.receiptOrderId]);
  }

  onAddItem(): void {
    if (this.return?.goodsReturnOrderId) {
      this.router.navigate([
        '/processes/purchases/add-goods-return-item',
        this.return.goodsReturnOrderId,
        this.purchaseOrderId,
        this.receiptOrderId,
        this.warehouseId || this.return.warehouseId || 0
      ]);
    } else {
      this.toastr.warning('Please create return first', 'Warning');
    }
  }

  onEditItem(item: ReturnItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  hasReference(): boolean {
    return this.return?.receiptPurchaseOrderId !== null && this.return?.receiptPurchaseOrderId !== undefined;
  }

  onEditReturn(): void {
    if (!this.return?.goodsReturnOrderId) {
      return;
    }
    this.router.navigate([
      '/processes/purchases/goods-return-form',
      this.purchaseOrderId,
      this.receiptOrderId,
      this.return.goodsReturnOrderId
    ]);
  }

  onDeleteReturn(): void {
    if (!this.return?.goodsReturnOrderId) {
      return;
    }
    if (confirm(`Are you sure you want to delete return order #${this.return.goodsReturnOrderId}?`)) {
      this.returnService.deleteReturnOrder(this.return.goodsReturnOrderId).subscribe({
        next: () => {
          this.toastr.success('Return order deleted successfully', 'Success');
          this.return = null;
          this.returnItems = [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting return order:', err);
          const errorMessage = err.error?.message || 'Error deleting return order. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  onItemUpdated(): void {
    if (this.return?.goodsReturnOrderId) {
      this.loadreturnItems(this.return.goodsReturnOrderId);
    }
  }

  onViewBatches(item: ReturnItem): void {
    if (item.goodsReturnOrderItemId) {
      this.router.navigate(['/processes/purchases/return-batches', item.goodsReturnOrderItemId, this.receiptOrderId, this.purchaseOrderId, item.quantity]);
    }
  }

  onRemoveItem(item: ReturnItem): void {
    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the return?`)) {
      if (item.goodsReturnOrderItemId) {
        this.returnService.deleteReturnItem(item.goodsReturnOrderItemId || 0).subscribe({
          next: (res) => {
            this.toastr.success('Item removed successfully', res);
            if (item.goodsReturnOrderId) {
              this.loadreturnItems(item.goodsReturnOrderId);
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Error removing item. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onBackToReceipts(): void {
    if (this.receiptOrderId) {
      this.router.navigate(['/processes/purchases/receipt-order', this.purchaseOrderId, this.receiptOrderId]);
    } else {
      this.router.navigate(['/processes/purchases/goods-return-orders', this.warehouseId]);
    }
  }

  getTotalQuantity(): number {
    return this.returnItems.reduce((total, item) => total + item.quantity, 0);
  }

  getStatusBadgeClass(returnDto: Return | null): string {
    switch (returnDto?.status) {
      case 'Draft':
        return 'badge bg-warning';
      case 'Processing':
        return 'badge bg-info';
      case 'Final':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(returnDto: Return | null): string {
    return returnDto?.status || '';
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

  isApproved(returnDto: Return | null): boolean {
    const rawStatus = returnDto?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(returnDto: Return | null): string {
    const rawStatus = returnDto?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(returnDto: Return | null): string {
    const rawStatus = returnDto?.approvalStatus;
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
    if (!this.return?.processApprovalId) {
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
    if (!this.return?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }
    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();
    this.approvalService
      .changeApprovalStatus(approved, this.return.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadreturn();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }
}
