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
import { Purchase, PurchaseItem } from '../Models/purchase.model';
import { EditItemModalComponent } from '../edit-item-modal/edit-item-modal.component';
import { ToastrService } from 'ngx-toastr';
import { ApprovalService } from '../../approval-process/Services/approval.service';

@Component({
  selector: 'app-purchase-items',
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
    EditItemModalComponent
  ],
  templateUrl: './purchase-items.component.html',
  styleUrl: './purchase-items.component.scss',
})
export class PurchaseItemsComponent implements OnInit {
  purchaseOrderId: number = 0;
  purchase: Purchase | null = null;
  items: PurchaseItem[] = [];
  loading: boolean = true;
  isDraft:boolean=false;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  selectedItem: PurchaseItem | null = null;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Load once per route param change (prevents duplicate initial requests)
    this.route.params.subscribe(params => {
      const newPurchaseOrderId = +params['purchaseOrderId'];
      if (newPurchaseOrderId && newPurchaseOrderId !== this.purchaseOrderId) {
        this.purchaseOrderId = newPurchaseOrderId;
        this.loadItemsPurchase();
        this.loadPurchase();
      }
    });
  }

  loadItemsPurchase(): void {
    this.loading = true;
    this.purchaseService.getAllItemsbyPurchaseId(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          console.log(res.data);
          this.items = Array.isArray(res.data)
            ? res.data
            : (Array.isArray(res.data.data) ? res.data.data : []);
          //console.log(this.items );

          // حفظ warehouseId إذا كان موجوداً في البيانات
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }

          if (res.meta == 'Draft') {
            this.isDraft = true;
          }
          this.toastr.success(`Loaded purchase with ${this.items.length} items`, 'Success');         
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase:', err);
        this.loading = false;
        this.toastr.error('Failed to load purchase. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

 
 loadPurchase(): void {
    this.purchaseService.getPurchaseById(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.purchase = res.data;
          console.log("Purchase",res);
     
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }
           this.cdr.detectChanges();
         // console.log("by id",this.purchase?.warehouseId);
          this.toastr.success(`Loaded purchase with ${this.items.length} items`, 'Success');         
       // this.loadItemsPurchase();
        }
      },
      error: (err) => { 
      }
    });
  }


  onAddItem(): void {
    if (!this.isApproved(this.purchase)) {
      if (!this.warehouseId && this.purchase?.warehouseId) {
        this.warehouseId = this.purchase.warehouseId;
      }
      if (this.warehouseId) {
        // الانتقال لصفحة إضافة العنصر
        this.router.navigate(['/processes/purchases/add-item', this.purchaseOrderId, this.warehouseId]);
      } else {
        this.toastr.error('Warehouse ID is not available. Please refresh the page.', 'Error');
      }
    } else {
      this.toastr.warning('Cannot add items to approved purchases', 'Warning');
   }
  }

  onEditItem(item: PurchaseItem): void {
   

    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  onEditPurchase(): void {
    if (this.purchase?.purchaseOrderId) {
      this.router.navigate([
        '/processes/purchases/purchase-form',
        this.warehouseId,
        this.purchase.purchaseOrderId
      ]);
    }
  }

  onItemUpdated(): void {
    this.loadItemsPurchase(); // Reload to show updated items
    this.loadPurchase(); // Keep purchase header data in sync
  }

  onRemoveItem(item: PurchaseItem): void {
    if (!this.isDraft || this.isApproved(this.purchase)) {
      this.toastr.warning('Cannot remove items from finalized purchases', 'Warning');
      return;
    }

    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the purchase?`)) {
      if (item.purchaseItemId) {
        this.purchaseService.removeItemFromPurchase(this.purchaseOrderId, item.purchaseItemId).subscribe({
          next: () => {
            this.toastr.success('Item removed successfully', 'Success');
            this.loadItemsPurchase();
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

  // onFinalizePurchase(): void {
  //   if (confirm('Are you sure you want to finalize this purchase? This action cannot be undone.')) {
  //     this.purchaseService.finalizePurchase(this.purchaseOrderId).subscribe({
  //       next: () => {
  //         this.toastr.success('Purchase finalized successfully', 'Success');
  //         this.loadItemsPurchase(); // Reload to update status
  //         this.cdr.detectChanges();
  //       },
  //       error: (err) => {
  //         console.error('Error finalizing purchase:', err);
  //         const errorMessage = err.error?.message || 'Error finalizing purchase. Please try again.';
  //         this.toastr.error(errorMessage, 'Error');
  //       }
  //     });
  //   }
  // }

  onBackToPurchases(): void {
    if (this.warehouseId) {
      this.router.navigate(['/processes/purchases', this.warehouseId]);
    } else if (this.purchase?.warehouseId) {
      this.warehouseId = this.purchase.warehouseId;
      this.router.navigate(['/processes/purchases', this.warehouseId]);
    }
  }
            
  getTotalQuantity(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalValue(): number {
    // This would need pricing information from the API
    // For now, return 0
    return 0;
  }

  getStatusBadgeClass(purchase: Purchase | null): string {
    if (!purchase || !purchase.status) return 'badge bg-secondary';
    
    const status = purchase.status.toLowerCase();
    if (status === 'draft' || status.includes('draft')) {
      return 'badge bg-warning';
    } else if (status === 'completed' || status.includes('completed')) {
      return 'badge bg-success';
    } else if (status === 'processing' || status.includes('processing')) {
      return 'badge bg-info';
    }
    else if (status === 'partiallyfailed' || status.includes('partiallyfailed')) {
      return 'badge bg-danger';
    }
    else {
      return 'badge bg-secondary';
    }
    
  }

  getStatusText(purchase: Purchase | null): string {
    return purchase?.status || 'Unknown';
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

  isApproved(purchase: Purchase | null): boolean {
    const rawStatus = purchase?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(purchase: Purchase | null): string {
    const rawStatus = purchase?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(purchase: Purchase | null): string {
    const rawStatus = purchase?.approvalStatus;
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
    if (!this.purchase?.processApprovalId) {
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
    if (!this.purchase?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }
    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();
    this.approvalService
      .changeApprovalStatus(approved, this.purchase.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadPurchase();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }
}
