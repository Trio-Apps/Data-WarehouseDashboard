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
import { DeliveryNote, DeliveryNoteItem } from '../Models/delivery-note-model';
import { DeliveryNoteService } from '../Services/delivery-note.service';
import { ApprovalService } from '../../approval-process/Services/approval.service';
import { EditDeliveryNoteItemModalComponent } from './edit-delivery-note-item-modal/edit-delivery-note-item-modal.component';
import { AttachmentsComponent } from '../../attachments/attachments.component';

@Component({
  selector: 'app-delivery-notes',
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
    EditDeliveryNoteItemModalComponent,
    AttachmentsComponent
  ],
  templateUrl: './delivery-notes.component.html',
  styleUrl: './delivery-notes.component.scss',
})
export class DeliveryNotesComponent implements OnInit {
  salesOrderId: number = 0;
  deliveryNoteId: number = 0;
  delivery: DeliveryNote | null = null;
  deliveryItems: DeliveryNoteItem[] = [];
  loading: boolean = true;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  selectedItem: DeliveryNoteItem | null = null;
  showApprovalModal: boolean = false;
  approvalComment: string = '';
  approvalSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: DeliveryNoteService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.deliveryNoteId = +this.route.snapshot.paramMap.get('deliveryNoteId')!;
    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

    if (this.deliveryNoteId) {
      this.loadDeliveryNote();

    } 
     else {
      this.loading = false;
    }

    this.route.params.subscribe(params => {
      const newSalesOrderId = +params['salesOrderId'];
      const newSalesDeliveryNoteId = +params['deliveryNoteId'];
      if (newSalesOrderId !== this.salesOrderId || newSalesDeliveryNoteId !== this.deliveryNoteId) {
        this.salesOrderId = newSalesOrderId || 0;
        this.deliveryNoteId = newSalesDeliveryNoteId || 0;
        if (this.deliveryNoteId > 0) {
          this.loadDeliveryNote();
        } else {
          this.delivery = null;
          this.deliveryItems = [];
          this.loading = false;
        }
      }
    });
  }

  loadDeliveryNote(): void {
    if (!this.deliveryNoteId || this.deliveryNoteId <= 0) {
      this.delivery = null;
      this.deliveryItems = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
   
    console.log("inside")
     
     this.deliveryService.getDeliveryNoteById(this.deliveryNoteId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.delivery = res.data;
         console.log("delivery", this.delivery);
          this.warehouseId = res.data.warehouseId || this.warehouseId;

          if (this.delivery?.deliveryNoteOrderId) {
            this.loadDeliveryNoteItems(this.delivery.deliveryNoteOrderId);
          } else {
            this.deliveryItems = [];
            this.loading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.delivery = null;
          this.deliveryItems = [];
          this.loading = false;
          this.cdr.detectChanges();
        }

      },
      error: (err: any) => {
        if (err.status === 404) {
          this.delivery = null;
          this.deliveryItems = [];
        } else {
          this.toastr.error('Failed to load delivery. Please try again.', 'Error');
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDeliveryNoteItems(deliveryId: number): void {
    this.deliveryService.getDeliveryNoteItemsByDeliveryNoteId(deliveryId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.deliveryItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } else {
          this.deliveryItems = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (_err: any) => {
        this.deliveryItems = [];
        this.loading = false;
        this.toastr.error('Failed to load delivery note items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddDeliveryNote(): void {
    this.router.navigate(
      ['/processes/sales/delivery-note-form', this.salesOrderId || 0],
      { queryParams: { warehouseId: this.warehouseId || 0 } }
    );
  }

  onAddItem(): void {
    if (this.isCompletedStatus(this.delivery)) {
      this.toastr.warning('Cannot add items when delivery status is Completed', 'Warning');
      return;
    }

    if (this.delivery?.deliveryNoteOrderId) {
      this.router.navigate([
        '/processes/sales/add-delivery-note-item',
        this.delivery.deliveryNoteOrderId,
        this.salesOrderId || this.delivery.salesOrderId || 0,
        this.warehouseId || this.delivery.warehouseId || 0
      ]);
    } else {
      this.toastr.warning('Please create delivery first', 'Warning');
    }
  }

  onEditItem(item: DeliveryNoteItem): void {
    if (this.isCompletedStatus(this.delivery)) {
      this.toastr.warning('Cannot edit items when delivery status is Completed', 'Warning');
      return;
    }

    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  hasReference(): boolean {
    return this.delivery?.salesOrderId !== null && this.delivery?.salesOrderId !== undefined && this.delivery?.salesOrderId !== 0;
  }

  onEditDeliveryNote(): void {
    if (this.isCompletedStatus(this.delivery)) {
      this.toastr.warning('Cannot edit delivery note when status is Completed', 'Warning');
      return;
    }

    if (!this.delivery?.deliveryNoteOrderId) {
      return;
    }
    this.router.navigate(
      ['/processes/sales/delivery-note-form', this.salesOrderId || 0, this.delivery.deliveryNoteOrderId],
      { queryParams: { warehouseId: this.warehouseId || this.delivery.warehouseId || 0 } }
    );
  }

  onDeleteDeliveryNote(): void {
    if (!this.delivery?.deliveryNoteOrderId) {
      return;
    }
    if (confirm(`Are you sure you want to delete delivery note order #${this.delivery.deliveryNoteOrderId}?`)) {
      this.deliveryService.deleteDeliveryNoteOrder(this.delivery.deliveryNoteOrderId).subscribe({
        next: () => {
          this.toastr.success('DeliveryNote order deleted successfully', 'Success');
          this.delivery = null;
          this.deliveryItems = [];
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          const errorMessage = err.error?.message || 'Error deleting delivery note order. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  onItemUpdated(): void {
    if (this.delivery?.deliveryNoteOrderId) {
      this.loadDeliveryNoteItems(this.delivery.deliveryNoteOrderId);
    }
  }

  onViewBatches(item: DeliveryNoteItem): void {
    if (item.deliveryNoteItemId) {
      this.router.navigate([
        '/processes/sales/delivery-note-batches',
        this.salesOrderId,
        this.deliveryNoteId,
        item.deliveryNoteItemId,
        item.quantity
      ]);
    }
  }

  onRemoveItem(item: DeliveryNoteItem): void {
    if (this.isCompletedStatus(this.delivery)) {
      this.toastr.warning('Cannot remove items when delivery status is Completed', 'Warning');
      return;
    }

    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the delivery?`)) {
      if (item.deliveryNoteItemId) {
        this.deliveryService.deleteDeliveryNoteItem(item.deliveryNoteItemId || 0).subscribe({
          next: (res: any) => {
            this.toastr.success('Item removed successfully', res);
            if (item.deliveryNoteOrderId) {
              this.loadDeliveryNoteItems(item.deliveryNoteOrderId);
            }
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            const errorMessage = err.error?.message || 'Error removing item. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onBackToSales(): void {
    const targetWarehouseId = this.warehouseId || this.delivery?.warehouseId || 0;
    if (targetWarehouseId) {
      this.router.navigate(['/processes/sales', targetWarehouseId]);
    }
  }

  onBackToSalesItems(): void {
    const targetSalesOrderId = this.salesOrderId || this.delivery?.salesOrderId || 0;
    if (targetSalesOrderId) {
      this.router.navigate(['/processes/sales/sales-items', targetSalesOrderId]);
    }
  }

  onBackToDeliveryNotes(): void {
    const targetWarehouseId = this.warehouseId || this.delivery?.warehouseId || 0;
    if (targetWarehouseId) {
      this.router.navigate(['/processes/sales/delivery-note-orders', targetWarehouseId]);
    }
  }

  getTotalQuantity(): number {
    return this.deliveryItems.reduce((total, item) => total + item.quantity, 0);
  }

  getDeliveryNoteDocumentId(): number | null {
    const id = this.delivery?.deliveryNoteOrderId || this.deliveryNoteId;
    return id && id > 0 ? id : null;
  }

  getStatusBadgeClass(deliveryDto: DeliveryNote | null): string {
    if (!deliveryDto || !deliveryDto.status) return 'badge bg-secondary';

    const status = deliveryDto.status.toLowerCase();
    if (status === 'draft' || status.includes('draft')) {
      return 'badge bg-warning';
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

  getStatusText(deliveryDto: DeliveryNote | null): string {
    return deliveryDto?.status || '';
  }

  isCompletedStatus(deliveryDto: DeliveryNote | null): boolean {
    const status = (deliveryDto?.status || '').trim().toLowerCase();
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

  isApproved(deliveryDto: DeliveryNote | null): boolean {
    const rawStatus = deliveryDto?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(deliveryDto: DeliveryNote | null): string {
    const rawStatus = deliveryDto?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(deliveryDto: DeliveryNote | null): string {
    const rawStatus = deliveryDto?.approvalStatus;
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
    if (!this.delivery?.processApprovalId) {
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
    if (!this.delivery?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }
    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();
    this.approvalService
      .changeApprovalStatus(approved, this.delivery.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadDeliveryNote();
        },
        error: (_err) => {
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }
}
