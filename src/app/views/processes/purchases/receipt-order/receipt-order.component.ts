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
import { PurchaseService } from '../Services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../Services/receipt.service';
import { Receipt, ReceiptItem } from '../Models/receipt';
import { AddReturnItemModalComponent } from '../goods-return/add-return-item-modal/add-return-item-modal.component';
import { EditReceiptItemModalComponent } from './edit-receipt-item-modal/edit-receipt-item-modal.component';
import { ApprovalService } from '../../approval-process/Services/approval.service';

@Component({
  selector: 'app-receipt-order',
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
    EditReceiptItemModalComponent,
    AddReturnItemModalComponent
  ],
  templateUrl: './receipt-order.component.html',
  styleUrl: './receipt-order.component.scss',
})
export class ReceiptOrderComponent implements OnInit {
  purchaseOrderId: number = 0;
  receiptOrderId:number = 0;
  receipt: Receipt | null = null;
  receiptItems: ReceiptItem[] = [];
  loading: boolean = true;
  showEditItemModal: boolean = false;
  showAddReturnItemModal: boolean = false;
  selectedItem: ReceiptItem | null = null;
  selectedItemForReturn: {item: ReceiptItem,receiptId: number} | null = null;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private receiptService: ReceiptService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptOrderId')!;
    if (this.receiptOrderId) {
      this.loadReceipt();
    }

    // إعادة تحميل البيانات عند العودة من صفحة أخرى
    this.route.params.subscribe(params => {
      const newReceiptOrderId = +params['receiptOrderId'];
      if (newReceiptOrderId && newReceiptOrderId === this.receiptOrderId) {
        this.loadReceipt();
      }
    });
  }

  loadReceipt(): void {
    this.loading = true;
    this.receiptService.getReceiptById(this.receiptOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          console.log("rececipt",res);
          this.receipt = res.data;
          this.cdr.detectChanges();

          // تحميل عناصر الـ receipt
          if (this.receipt?.receiptPurchaseOrderId) {
            console.log("receipt id",this.receipt.receiptPurchaseOrderId);
            this.loadReceiptItems(this.receipt.receiptPurchaseOrderId);
          } else {
            this.receiptItems = [];
            this.loading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.receipt = null;
          this.receiptItems = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading receipt:', err);
        // إذا لم يكن هناك receipt، هذا طبيعي
        if (err.status === 404) {
          this.receipt = null;
          this.receiptItems = [];
        } else {
          this.toastr.error('Failed to load receipt. Please try again.', 'Error');
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReceiptItems(receiptId: number): void {

    this.receiptService.getReceiptItemsByReceiptId(receiptId).subscribe({
      next: (res: any) => {
          console.log("receipt items",res); 
        if (res.data) {
          this.receiptItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } else {
          this.receiptItems = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading receipt items:', err);
        this.receiptItems = [];
        this.loading = false;
        this.toastr.error('Failed to load receipt items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddReceipt(): void {
    this.router.navigate(['/processes/purchases/receipt-form', this.purchaseOrderId,0]);
  }

  onEditReceipt(): void {
      console.log("outside")
    if (this.receipt?.receiptPurchaseOrderId) {
      console.log("inside")
      this.router.navigate(['/processes/purchases/receipt-form', this.purchaseOrderId, this.receipt.receiptPurchaseOrderId]);
    }
  }

  onDeleteReceipt(): void {
    if (!this.receipt?.receiptPurchaseOrderId) {
      return;
    }
    if (confirm(`Are you sure you want to delete receipt #${this.receipt.receiptPurchaseOrderId}?`)) {
      this.receiptService.deleteReceipt(this.receipt.receiptPurchaseOrderId).subscribe({
        next: () => {
          this.toastr.success('Receipt deleted successfully', 'Success');
          this.receipt = null;
          this.receiptItems = [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting receipt:', err);
          const errorMessage = err.error?.message || 'Error deleting receipt. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

   onGoReturn(): void {
    if (!this.receipt?.receiptPurchaseOrderId) {
      return;
    }

    if (this.receipt.returnOrderId) {
      this.router.navigate(['/processes/purchases/goods-return-order', this.purchaseOrderId, this.receipt.receiptPurchaseOrderId, this.receipt.returnOrderId]);
    } else {
      this.router.navigate(['/processes/purchases/goods-return-form', this.purchaseOrderId, this.receipt.receiptPurchaseOrderId]);
    }
  }

  onAddItem(): void {
    if (this.receipt?.receiptPurchaseOrderId) {
      this.router.navigate(
        ['/processes/purchases/add-receipt-item', this.purchaseOrderId, this.receipt.receiptPurchaseOrderId],
        { queryParams: { warehouseId: this.receipt.warehouseId || 0 } }
      );
    } else {
      this.toastr.warning('Please create receipt first', 'Warning');
    }
  }

  onEditItem(item: ReceiptItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

    onAddReturnItem(item: ReceiptItem): void {
    this.selectedItemForReturn = {item: {...item}, receiptId: this.receipt?.receiptPurchaseOrderId || 0};
    this.showAddReturnItemModal = true;
  }
  onItemUpdated(): void {
    this.loadReceipt();
  }

  onViewBatches(item: ReceiptItem): void {
    if (item.receiptPurchaseOrderItemId) {
      this.router.navigate(['/processes/purchases/receipt-batches', this.purchaseOrderId,this.receiptOrderId, item.receiptPurchaseOrderItemId,item.quantity]);
    }
  }

  onRemoveItem(item: ReceiptItem): void {
    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the receipt?`)) {
      if (item.receiptPurchaseOrderItemId) {
        this.receiptService.deleteReceiptItem(item.receiptPurchaseOrderItemId).subscribe({
          next: (res) => {
            this.toastr.success('Item removed successfully', res);
             
            if (item.receiptPurchaseOrderId) {
              this.loadReceiptItems(item.receiptPurchaseOrderId);
              this.cdr.detectChanges();
            }

            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error removing item:', err);
            const errorMessage = err.error?.message || 'Error removing item. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onBackToPurchases(): void {
    if (this.purchaseOrderId) {
      this.router.navigate(['/processes/purchases', this.receipt?.warehouseId]);
    } else {
      this.router.navigate(['/processes/purchases/receipt-orders', this.receipt?.warehouseId]);
    }
  }

  getTotalQuantity(): number {
    return this.receiptItems.reduce((total, item) => total + item.quantity, 0);
  }
  
  getStatusBadgeClass(receipt: Receipt): string {
    switch (receipt.status) {
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
  getStatusText(receipt: Receipt | null): string {
    return receipt?.status || 'Unknown';
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

  isApproved(receipt: Receipt | null): boolean {
    const rawStatus = receipt?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(receipt: Receipt | null): string {
    const rawStatus = receipt?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(receipt: Receipt | null): string {
    const rawStatus = receipt?.approvalStatus;
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
    if (!this.receipt?.processApprovalId) {
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
    if (!this.receipt?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }
    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();
    this.approvalService
      .changeApprovalStatus(approved, this.receipt.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadReceipt();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }
}
