import { Sales, SalesItem } from '../Models/sales-model';
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
import { SalesService } from '../Services/sales.service';
import { SalesReturnService } from '../Services/sales-return.service';
import { ApprovalService } from '../../approval-process/Services/approval.service';
import { EditItemModalComponent } from '../edit-item-modal/edit-item-modal.component';
import { AddReturnItemModalComponent } from '../sales-return/add-return-item-modal/add-return-item-modal.component';
import { ReturnItem } from '../Models/sales-return-model';

@Component({
  selector: 'app-sales-items',
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
      EditItemModalComponent,
      AddReturnItemModalComponent
    ],
  templateUrl: './sales-items.component.html',
  styleUrl: './sales-items.component.scss',
})

export class SalesItemsComponent implements OnInit {
  salesOrderId: number = 0;
  Sale: Sales | null = null;
  SaleItems: SalesItem[] = [];
  loading: boolean = true;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  showAddReturnItemModal: boolean = false;
  selectedItem: SalesItem | null = null;
  selectedItemForReturn: {item: ReturnItem,SaleId: number} | null = null;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salesService: SalesService,
    private salesReturnService: SalesReturnService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    if (this.salesOrderId) {
      this.loadSale();
    }

    // إعادة تحميل البيانات عند العودة من صفحة أخرى
    this.route.params.subscribe(params => {
      const newSalesOrderIdId = +params['salesOrderId'];
      if (newSalesOrderIdId && newSalesOrderIdId === this.salesOrderId) {
        this.loadSale();
      }
    });
  }

  loadSale(): void {
    this.loading = true;
    this.salesService.getSalesById(this.salesOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.Sale = res.data;
          console.log("Sale",this.Sale);
                    this.cdr.detectChanges();
         // console.log("Sale",this.Sale);
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }
          // تحميل عناصر الـ Sale
          if (this.Sale?.salesOrderId) {
            console.log("Sale id",this.Sale.salesOrderId);
            this.loadSaleItems(this.Sale.salesOrderId);
          } else {
            this.SaleItems = [];
            this.loading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.Sale = null;
          this.SaleItems = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading Sale:', err);
        // إذا لم يكن هناك Sale، هذا طبيعي
        if (err.status === 404) {
          this.Sale = null;
          this.SaleItems = [];
        } else {
          this.toastr.error('Failed to load Sale. Please try again.', 'Error');
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSaleItems(SaleId: number): void {

    this.salesService.getAllItemsbySalesId(SaleId).subscribe({
      next: (res: any) => {
          console.log("Sale items",res); 
        if (res.data) {
          this.SaleItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } else {
          this.SaleItems = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading Sale items:', err);
        this.SaleItems = [];
        this.loading = false;
        this.toastr.error('Failed to load Sale items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }



   onGoReturn(): void {
      console.log("outside")
    if (this.Sale?.salesOrderId) {
      console.log("inside")
      this.router.navigate(['/processes/sales/sales-return-order',this.salesOrderId]);
    }
  }

  onAddItem(): void {
    if (this.Sale?.salesOrderId) {
      this.router.navigate(['/processes/sales/add-item', this.Sale.salesOrderId, this.warehouseId]);
    }
     else {
      this.toastr.warning('Please create Sale first', 'Warning');
    }
  }
    onEditSale(): void {
      console.log("outside")
    if (this.Sale?.salesOrderId) {
      console.log("inside")
      this.router.navigate(['/processes/sales/sales-form',this.warehouseId, this.Sale.salesOrderId]);
    }
  }

  onEditItem(item: SalesItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

    onAddReturnItem(item: SalesItem): void {
      
      console.log("Adding return item",item.salesOrderItemId);

    this.selectedItemForReturn = {item: {...item}, SaleId: this.Sale?.salesOrderId || 0};
    this.showAddReturnItemModal = true;
  }
  onItemUpdated(): void {
    if (this.Sale?.salesOrderId) {
      this.loadSaleItems(this.Sale.salesOrderId);
    }
  }

  onViewBatches(item: SalesItem): void {
    if (item.salesOrderId) {
      this.router.navigate(['/processes/sales/sales-batches',this.salesOrderId,item.salesOrderItemId,item.quantity]);
    }
  }

  onRemoveItem(item: SalesItem): void {
    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the Sale?`)) {
      if (item.salesOrderItemId) {
        this.salesService.removeItemFromSales(item.salesOrderItemId).subscribe({
          next: (res) => {
            this.toastr.success('Item removed successfully', res);
             
            if (item.salesOrderItemId) {
              this.loadSaleItems(item.salesOrderItemId);
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

  onBackToSales(): void {
    if (this.warehouseId) {
      this.router.navigate(['/processes/sales', this.warehouseId]);
    } else {
      // محاولة الحصول على warehouseId من الـ purchase
      this.salesService.getSalesById(this.salesOrderId).subscribe({
        next: (res: any) => {
          if (res.data?.warehouseId) {
            this.warehouseId = res.data.warehouseId;
            this.router.navigate(['/processes/sales', this.warehouseId]);
          }
        },
        error: () => {
          this.router.navigate(['/processes/sales']);
        }
      });
    }
  }

  getTotalQuantity(): number {
    return this.SaleItems.reduce((total, item) => total + item.quantity, 0);
  }
  
  getStatusBadgeClass(Sale: Sales | null): string {
    if (!Sale) {
      return 'badge bg-secondary';
    }
    switch (Sale.status) {
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
  getStatusText(Sale: Sales | null): string {
  return Sale?.status || 'Unknown';
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

  isApproved(Sale: Sales | null): boolean {
    const rawStatus = Sale?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(Sale: Sales | null): string {
    const rawStatus = Sale?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(Sale: Sales | null): string {
    const rawStatus = Sale?.approvalStatus;
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
    if (!this.Sale?.processApprovalId) {
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
    if (!this.Sale?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }
    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();
    this.approvalService
      .changeApprovalStatus(approved, this.Sale.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadSale();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }
}
