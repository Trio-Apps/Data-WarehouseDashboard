import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule, FormModule, ModalModule } from '@coreui/angular';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import {
  ReceiveTransferredBatchDTO,
  ReceiveTransferredItemDTO,
  ReceiveTransferredStockDTO,
  TransferredItem,
  TransferredStock,
  TransferredStockBatch
} from '../../../Models/transferred-stock.model';
import { TransferredStockService } from '../../../Services/transferred-stock.service';

interface ReceiveItemVM {
  transferredItemId: number;
  itemName: string;
  itemCode: string;
  shippedQuantity: number;
  quantity: number;
  batches: ReceiveBatchVM[];
}

interface ReceiveBatchVM {
  transferredStockBatchId: number;
  batchNumber: string;
  expiryDate: string;
  shippedQuantity: number;
  quantity: number;
}

@Component({
  selector: 'app-received-modal',
  imports: [CommonModule, FormsModule, ModalModule, ButtonModule, FormModule],
  templateUrl: './received-modal.component.html',
  styleUrl: './received-modal.component.scss'
})
export class ReceivedModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() stock: TransferredStock | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  loading = false;
  submitting = false;
  items: ReceiveItemVM[] = [];

  constructor(
    private transferredStockService: TransferredStockService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const openedNow = !!changes['visible'] && this.visible;
    const stockChangedWhileOpen = !!changes['stock'] && this.visible;

    if (openedNow || stockChangedWhileOpen) {
      this.loadItems();
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
    if (!visible) {
      this.items = [];
    }
  }

  private loadItems(): void {
    const transferredStockId = Number(this.stock?.transferredStockId || 0);
    if (!transferredStockId) {
      this.items = [];
      return;
    }

    this.loading = true;
    this.items = [];
    this.cdr.markForCheck();

    this.transferredStockService.getTransferredItemsByStockId(transferredStockId).subscribe({
      next: (res: any) => {
        const items = this.extractItems(res);
        if (items.length === 0) {
          this.items = [];
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        const batchRequests = items.map((item) => {
          const itemId = Number(item.transferredItemId || 0);
          if (!itemId) {
            return of([] as TransferredStockBatch[]);
          }

          return this.transferredStockService.getTransferredStockBatchesByItemId(itemId).pipe(
            map((batchRes: any) => this.extractBatches(batchRes)),
            catchError(() => of([] as TransferredStockBatch[]))
          );
        });

        forkJoin(batchRequests).subscribe({
          next: (batchesByItem) => {
            this.items = items.map((item, index) => {
              const shippedQuantity = Number(item.quantity || 0);
              const receivedQuantity = Number((item.receivedQuantity ?? item.ReceivedQuantity ?? item.quantity) || 0);
              const batches = (batchesByItem[index] || []).map((batch) => ({
                transferredStockBatchId: Number(batch.transferredStockBatchId || 0),
                batchNumber: String(batch.batchNumber || ''),
                expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '',
                shippedQuantity: Number(batch.quantity || 0),
                quantity: Number(batch.quantity || 0)
              }));

              return {
                transferredItemId: Number(item.transferredItemId || 0),
                itemName: String(item.itemName || 'N/A'),
                itemCode: String(item.itemCode || 'N/A'),
                shippedQuantity,
                quantity: receivedQuantity,
                batches
              };
            });

            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.items = [];
            this.toastr.error('Failed to load item batches.', 'Error');
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Error loading transferred items:', err);
        this.loading = false;
        this.items = [];
        this.toastr.error('Failed to load transferred items.', 'Error');
        this.cdr.markForCheck();
      }
    });
  }

  private extractItems(res: any): TransferredItem[] {
    if (Array.isArray(res)) {
      return res;
    }
    if (Array.isArray(res?.data)) {
      return res.data;
    }
    return [];
  }

  private extractBatches(res: any): TransferredStockBatch[] {
    if (Array.isArray(res)) {
      return res;
    }
    if (Array.isArray(res?.data)) {
      return res.data;
    }
    return [];
  }

  submit(isDraft: boolean): void {
    const transferredStockId = Number(this.stock?.transferredStockId || 0);
    if (!transferredStockId) {
      this.toastr.error('Transferred stock ID is missing.', 'Error');
      return;
    }

    const itemPayload: ReceiveTransferredItemDTO[] = this.items.map((item) => {
      const batches: ReceiveTransferredBatchDTO[] = item.batches
        .filter((batch) => Number(batch.transferredStockBatchId) > 0)
        .map((batch) => ({
          transferredStockBatchId: Number(batch.transferredStockBatchId),
          quantity: Number(batch.quantity || 0)
        }));

      return {
        transferredItemId: Number(item.transferredItemId),
        quantity: Number(item.quantity || 0),
        batches: batches.length > 0 ? batches : undefined
      };
    });

    const hasInvalidItemQty = itemPayload.some((item) => item.quantity <= 0);
    const hasInvalidBatchQty = itemPayload.some((item) =>
      (item.batches || []).some((batch) => Number(batch.quantity || 0) <= 0)
    );

    if (hasInvalidItemQty || hasInvalidBatchQty) {
      this.toastr.error('All received quantities must be greater than 0.', 'Validation Error');
      return;
    }

    const payload: ReceiveTransferredStockDTO = {
      transferredStockId,
      isDraft,
      items: itemPayload
    };

    this.submitting = true;
    this.transferredStockService.updateReceivedQuantities(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success(
          isDraft ? 'Draft changes saved successfully.' : 'Receipt confirmed successfully.',
          'Success'
        );
        this.saved.emit();
        this.onVisibleChange(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error updating received quantities:', err);
        this.submitting = false;
        const errorMessage = err?.error?.message || 'Failed to update received quantities.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.markForCheck();
      }
    });
  }
}







