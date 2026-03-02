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
  isDraft: boolean = false;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  showAddReturnItemModal: boolean = false;
  selectedItem: SalesItem | null = null;
  selectedItemForReturn: { item: ReturnItem; SaleId: number } | null = null;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salesService: SalesService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Load once per route param change (prevents duplicate initial requests)
    this.route.params.subscribe(params => {
      const newSalesOrderId = +params['salesOrderId'];
      if (newSalesOrderId && newSalesOrderId !== this.salesOrderId) {
        this.salesOrderId = newSalesOrderId;
        this.loadSaleItems();
        this.loadSale();
      }
    });
  }

  loadSaleItems(): void {
    this.loading = true;
    this.isDraft = false;
    this.salesService.getAllItemsbySalesId(this.salesOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.SaleItems = Array.isArray(res.data)
            ? res.data
            : (Array.isArray(res.data.data) ? res.data.data : []);

          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }

          if (res.meta === 'Draft') {
            this.isDraft = true;
          }

          this.toastr.success(`Loaded sales with ${this.SaleItems.length} items`, 'Success');
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading sales items:', err);
        this.loading = false;
        this.toastr.error('Failed to load sales items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  loadSale(): void {
    this.salesService.getSalesById(this.salesOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.Sale = res.data;

          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }

          this.cdr.detectChanges();
          this.toastr.success(`Loaded sales with ${this.SaleItems.length} items`, 'Success');
        }
      },
      error: () => {}
    });
  }

  onGoReturn(): void {
    if (!this.Sale?.salesOrderId) {
      return;
    }

    if (this.Sale.returnOrderId) {
      this.router.navigate(
        ['/processes/sales/sales-return-order', this.salesOrderId, this.Sale.returnOrderId],
        { queryParams: { warehouseId: this.warehouseId || this.Sale.warehouseId || 0 } }
      );
      return;
    }

    this.router.navigate(
      ['/processes/sales/sales-return-form', this.salesOrderId],
      { queryParams: { warehouseId: this.warehouseId || this.Sale.warehouseId || 0 } }
    );
  }

  onGoDeliveryNote(): void {
    if (!this.Sale?.salesOrderId) {
      return;
    }

    if (this.Sale.deliveryNoteOrderId) {
      this.router.navigate(
        ['/processes/sales/delivery-note-order', this.salesOrderId, this.Sale.deliveryNoteOrderId],
        { queryParams: { warehouseId: this.warehouseId || this.Sale.warehouseId || 0 } }
      );
      return;
    }

    this.router.navigate(
      ['/processes/sales/delivery-note-form', this.salesOrderId],
      { queryParams: { warehouseId: this.warehouseId || this.Sale.warehouseId || 0 } }
    );
  }

  onAddItem(): void {
    if (!this.isApproved(this.Sale)) {
      if (!this.warehouseId && this.Sale?.warehouseId) {
        this.warehouseId = this.Sale.warehouseId;
      }
      if (this.warehouseId) {
        this.router.navigate(['/processes/sales/add-item', this.salesOrderId, this.warehouseId]);
      } else {
        this.toastr.error('Warehouse ID is not available. Please refresh the page.', 'Error');
      }
    } else {
      this.toastr.warning('Cannot add items to approved sales', 'Warning');
    }
  }

  onEditSale(): void {
    if (this.Sale?.salesOrderId) {
      this.router.navigate(['/processes/sales/sales-form', this.warehouseId, this.Sale.salesOrderId]);
    }
  }

  onEditItem(item: SalesItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  onAddReturnItem(item: SalesItem): void {
    this.selectedItemForReturn = { item: { ...item }, SaleId: this.Sale?.salesOrderId || 0 };
    this.showAddReturnItemModal = true;
  }

  onItemUpdated(): void {
    this.loadSaleItems();
    this.loadSale();
  }

  onViewBatches(item: SalesItem): void {
    if (item.salesOrderId) {
      this.router.navigate(['/processes/sales/sales-batches', this.salesOrderId, item.salesOrderItemId, item.quantity]);
    }
  }

  onRemoveItem(item: SalesItem): void {
    // if (!this.isDraft || this.isApproved(this.Sale)) {
    //   this.toastr.warning('Cannot remove items from finalized sales', 'Warning');
    //   return;
    // }

    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the sales?`)) {
      if (item.salesOrderItemId) {
        this.salesService.removeItemFromSales(item.salesOrderItemId).subscribe({
          next: () => {
            this.toastr.success('Item removed successfully', 'Success');
            this.loadSaleItems();
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
    } else if (this.Sale?.warehouseId) {
      this.warehouseId = this.Sale.warehouseId;
      this.router.navigate(['/processes/sales', this.warehouseId]);
    }
  }


  getTotalQuantity(): number {
    return this.SaleItems.reduce((total, item) => total + item.quantity, 0);
  }

  getStatusBadgeClass(Sale: Sales | null): string {
    if (!Sale || !Sale.status) return 'badge bg-secondary';

    const status = Sale.status.toLowerCase();
    if (status === 'draft' || status.includes('draft')) {
      return 'badge bg-warning';
    } else if (status === 'final' || status.includes('final')) {
      return 'badge bg-success';
    } else if (status === 'completed' || status.includes('completed')) {
      return 'badge bg-success';
    } else if (status === 'processing' || status.includes('processing')) {
      return 'badge bg-info';
    } else if (status === 'partiallyfailed' || status.includes('partiallyfailed')) {
      return 'badge bg-danger';
    } else {
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
