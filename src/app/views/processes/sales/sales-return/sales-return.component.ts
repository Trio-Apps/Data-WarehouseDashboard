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
import { Return, ReturnItem } from '../Models/sales-return-model';
import { SalesReturnService } from '../Services/sales-return.service';
import { ApprovalService } from '../../approval-process/Services/approval.service';
import { EditSalesReturnComponent } from './edit-sales-return/edit-sales-return.component';
import { EditItemModalComponent } from '../edit-item-modal/edit-item-modal.component';
import { EditReturnItemModalComponent } from './edit-return-item-modal/edit-return-item-modal.component';

@Component({
  selector: 'app-sales-return',
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
      EditSalesReturnComponent,
      EditReturnItemModalComponent

      
    ],
  templateUrl: './sales-return.component.html',
  styleUrl: './sales-return.component.scss',
})
export class SalesReturnComponent implements OnInit {
  salesOrderId: number = 0;
  return: Return | null = null;
  returnItems: ReturnItem[] = [];
  loading: boolean = true;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  selectedReturn: Return | null = null;
  showEditReturnModal : boolean = false;
  selectedItem: ReturnItem | null = null;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private returnService: SalesReturnService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    if (this.salesOrderId) {
      this.loadReturn();
    }

    // إعادة تحميل البيانات عند العودة من صفحة أخرى
    this.route.params.subscribe(params => {
      const newsalesOrderId = +params['salesOrderId'];
      if (newsalesOrderId && newsalesOrderId === this.salesOrderId) {
        this.loadReturn();
      }
    });
  }

  loadReturn(): void {
    this.loading = true;
   // console.log("sales id",this.salesOrderId);
    this.returnService.getReturnWithCustomerBySalesId(this.salesOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.return = res.data;
          this.cdr.detectChanges();
          console.log("return",this.return);
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }
          // تحميل عناصر الـ return
          if (this.return?.salesReturnOrderId) {
           // console.log("return id",this.return.salesReturnOrderId);
            this.loadReturnItems(this.return.salesReturnOrderId);
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
      error: (err:any) => {
       // console.error('Error loading return:', err);
        // إذا لم يكن هناك return، هذا طبيعي
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

  loadReturnItems(returnId: number): void {

    this.returnService.getReturnItemsByReturnId(returnId).subscribe({
      next: (res: any) => {
          console.log("return items",res); 
        if (res.data) {
          this.returnItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } else {
          this.returnItems = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err:any) => {
       // console.error('Error loading return items:', err);
        this.returnItems = [];
        this.loading = false;
        this.toastr.error('Failed to load return items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  // onAddReturn(): void {
  //   this.router.navigate(['/processes/purchases/return-form', this.salesOrderId]);
  // }

  // onAddItem(): void {
  //   if (this.return?.salesReturnOrderId) {
  //     // returnsalesOrderId هو الـ return ID، و salesOrderId هو returnsalesOrderId
  //     this.router.navigate(['/processes/purchases/add-return-item', this.return.salesReturnOrderId, this.salesOrderId]);
  //   } else {
  //     this.toastr.warning('Please create return first', 'Warning');
  //   }
  // }

  onEditItem(item: ReturnItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

 onEditReturn(): void {
    if (!this.return) {
    console.warn('return is undefined!');
    return;
    }
console.log("editing return",this.return);
  this.selectedReturn = { ...this.return };
  this.showEditReturnModal = true;
  }
  onItemUpdated(): void {
    //  console.log("reloading items",this.return);

    if (this.return?.salesReturnOrderId) {
      console.log("reloading items");
      this.loadReturnItems(this.return.salesReturnOrderId);
    }

  }


   onReturnUpdated(): void {
    //  console.log("reloading items",this.return);

    if (this.salesOrderId) {
      console.log("reloading return");
      this.loadReturn();
    }

  }

  onViewBatches(item: ReturnItem): void {
    if (item.salesReturnOrderItemId) {
      console.log("inside")
      this.router.navigate(['/processes/sales/return-batches',item.salesReturnOrderItemId, this.salesOrderId, item.quantity]);
    }
  }

  onRemoveItem(item: ReturnItem): void {
    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the return?`)) {
      if (item.salesReturnOrderItemId) {
        this.returnService.deleteReturnItem(item.salesReturnOrderItemId||0).subscribe({
          next: (res:any) => {
            this.toastr.success('Item removed successfully', res);
             
            if (item.salesReturnOrderId) {
              this.loadReturnItems(item.salesReturnOrderId);
              this.cdr.detectChanges();
            }

            this.cdr.detectChanges();
          },
          error: (err:any) => {
           // console.error('Error removing item:', err);
            const errorMessage = err.error?.message || 'Error removing item. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onBackToSales(): void {
    if (this.salesOrderId) {
      this.router.navigate(['/processes/sales/sales-items', this.salesOrderId]);
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
          this.loadReturn();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }

}
