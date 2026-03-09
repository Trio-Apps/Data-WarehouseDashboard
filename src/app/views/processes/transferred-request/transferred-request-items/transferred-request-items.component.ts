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
import { EditItemModalComponent } from '../edit-item-modal/edit-item-modal.component';
import { TransferredRequestService } from '../Services/transferred-request.service';
import { TransferredRequest, TransferredRequestItem } from '../Models/transferred-request.model';

@Component({
  selector: 'app-transferred-request-items',
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
  templateUrl: './transferred-request-items.component.html',
  styleUrl: './transferred-request-items.component.scss'
})
export class TransferredRequestItemsComponent implements OnInit {
  transferredRequestId = 0;
  transferredRequest: TransferredRequest | null = null;
  items: TransferredRequestItem[] = [];
  loading = true;
  warehouseId = 0;
  showEditItemModal = false;
  selectedItem: TransferredRequestItem | null = null;
  showApprovalModal = false;
  approvalComment = '';
  approvalSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transferredRequestService: TransferredRequestService,
    private approvalService: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const newId = +params['transferredRequestId'];
      if (newId && newId !== this.transferredRequestId) {
        this.transferredRequestId = newId;
        this.loadItems();
        this.loadTransferredRequest();
      }
    });
  }

  loadItems(): void {
    this.loading = true;
    this.transferredRequestService.getItemsByTransferredRequestId(this.transferredRequestId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.items = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.data)
              ? res.data.data
              : [];

          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }

          this.toastr.success(`Loaded transferred request with ${this.items.length} items`, 'Success');
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading transferred request items:', err);
        this.loading = false;
        this.toastr.error('Failed to load items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  loadTransferredRequest(): void {
    this.transferredRequestService.getTransferredRequestById(this.transferredRequestId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.transferredRequest = res.data;

          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }

          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  onAddItem(): void {
    if (!this.isApproved(this.transferredRequest)) {
      if (!this.warehouseId && this.transferredRequest?.warehouseId) {
        this.warehouseId = this.transferredRequest.warehouseId;
      }

      if (this.warehouseId) {
        this.router.navigate([
          '/processes/transferred-request/add-item',
          this.transferredRequestId,
          this.warehouseId
        ]);
      } else {
        this.toastr.error('Warehouse ID is not available. Please refresh the page.', 'Error');
      }
    } else {
      this.toastr.warning('Cannot add items to approved transferred requests', 'Warning');
    }
  }

  onEditTransferredRequest(): void {
    if (this.transferredRequest?.transferredRequestId) {
      this.router.navigate([
        '/processes/transferred-request/transferred-request-form',
        this.warehouseId,
        this.transferredRequest.transferredRequestId
      ]);
    }
  }

  onEditItem(item: TransferredRequestItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  onItemUpdated(): void {
    this.loadItems();
    this.loadTransferredRequest();
  }

  onRemoveItem(item: TransferredRequestItem): void {
    if (this.isApproved(this.transferredRequest)) {
      this.toastr.warning('Cannot remove items from approved transferred requests', 'Warning');
      return;
    }

    if (
      confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the transferred request?`)
    ) {
      if (item.transferredRequestItemId) {
        this.transferredRequestService.deleteTransferredRequestItem(item.transferredRequestItemId).subscribe({
          next: () => {
            this.toastr.success('Item removed successfully', 'Success');
            this.loadItems();
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

  onBackToTransferredRequests(): void {
    if (this.warehouseId) {
      this.router.navigate(['/processes/transferred-request', this.warehouseId]);
    } else if (this.transferredRequest?.warehouseId) {
      this.warehouseId = this.transferredRequest.warehouseId;
      this.router.navigate(['/processes/transferred-request', this.warehouseId]);
    }
  }

  getTotalQuantity(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getStatusBadgeClass(request: TransferredRequest | null): string {
    if (!request || !request.status) return 'badge bg-secondary';

    const status = request.status.toLowerCase();
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

  getStatusText(request: TransferredRequest | null): string {
    return request?.status || 'Unknown';
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

  isApproved(request: TransferredRequest | null): boolean {
    const rawStatus = request?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return false;
    }
    return this.mapApprovalStatusText(String(rawStatus)) === 'Approved';
  }

  getApprovalStatusText(request: TransferredRequest | null): string {
    const rawStatus = request?.approvalStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
      return 'not found';
    }
    return this.mapApprovalStatusText(String(rawStatus));
  }

  getApprovalBadgeClass(request: TransferredRequest | null): string {
    const rawStatus = request?.approvalStatus;
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
    if (!this.transferredRequest?.processApprovalId) {
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
    if (!this.transferredRequest?.processApprovalId) {
      this.toastr.warning('Approval data not found', 'Warning');
      return;
    }

    this.setApprovalSubmitting(true);
    const comment = this.approvalComment?.trim();

    this.approvalService
      .changeApprovalStatus(approved, this.transferredRequest.processApprovalId, comment || undefined)
      .subscribe({
        next: () => {
          this.toastr.success(
            approved ? 'Approval sent successfully' : 'Rejection sent successfully',
            'Success'
          );
          this.setApprovalModalVisible(false);
          this.setApprovalSubmitting(false);
          this.loadTransferredRequest();
        },
        error: (err) => {
          console.error('Error updating approval status:', err);
          this.setApprovalSubmitting(false);
          this.toastr.error('Failed to update approval status. Please try again.', 'Error');
        }
      });
  }
}
