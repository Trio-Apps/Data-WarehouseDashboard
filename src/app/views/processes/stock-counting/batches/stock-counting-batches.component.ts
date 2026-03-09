import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonModule,
  CardModule,
  FormModule,
  GridModule,
  ModalModule,
  TableModule,
  UtilitiesModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { CountStockBatch } from '../Models/stock-counting.model';
import { StockCountingService } from '../Services/stock-counting.service';

@Component({
  selector: 'app-stock-counting-batches',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    UtilitiesModule,
    ModalModule,
    IconDirective,
    DatePipe
  ],
  templateUrl: './stock-counting-batches.component.html',
  styleUrl: './stock-counting-batches.component.scss'
})
export class StockCountingBatchesComponent implements OnInit {
  warehouseId = 0;
  countStockId = 0;
  countStockItemId = 0;
  loading = true;
  saving = false;
  showModal = false;
  editingBatchId = 0;
  batches: CountStockBatch[] = [];

  form = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(0.000001)]],
    batchNumber: [''],
    expiryDate: [''],
    comment: ['']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private stockService: StockCountingService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.warehouseId = Number(params['warehouseId'] || 0);
      this.countStockId = Number(params['countStockId'] || 0);
      this.countStockItemId = Number(params['countStockItemId'] || 0);
      this.loadBatches();
    });
  }

  onBackToItems(): void {
    this.router.navigate(['/processes/stock-counting/order-items', this.warehouseId, this.countStockId]);
  }

  onAddBatch(): void {
    this.editingBatchId = 0;
    this.form.reset({ quantity: 1, batchNumber: '', expiryDate: '', comment: '' });
    this.showModal = true;
  }

  onEditBatch(batch: CountStockBatch): void {
    this.editingBatchId = batch.countStockBatchId;
    this.form.reset({
      quantity: batch.quantity,
      batchNumber: batch.batchNumber || '',
      expiryDate: this.toDateInputValue(batch.expiryDate),
      comment: batch.comment || ''
    });
    this.showModal = true;
  }

  onDeleteBatch(batch: CountStockBatch): void {
    if (!confirm(`Delete batch #${batch.countStockBatchId}?`)) return;

    this.stockService.deleteBatch(batch.countStockBatchId).subscribe({
      next: () => {
        this.toastr.success('Batch deleted successfully.', 'Success');
        this.loadBatches();
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Failed to delete batch.'), 'Error');
      }
    });
  }

  onSaveBatch(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please provide valid batch values.', 'Validation');
      return;
    }

    this.saving = true;
    const payload = {
      countStockItemId: this.countStockItemId,
      quantity: Number(this.form.value.quantity || 0),
      batchNumber: String(this.form.value.batchNumber || ''),
      expiryDate: this.form.value.expiryDate ? `${this.form.value.expiryDate}T00:00:00` : undefined,
      comment: String(this.form.value.comment || '')
    };

    if (payload.quantity <= 0) {
      this.saving = false;
      this.toastr.error('Quantity must be greater than 0.', 'Validation');
      return;
    }

    if (this.editingBatchId) {
      this.stockService.updateBatch(this.editingBatchId, {
        countStockBatchId: this.editingBatchId,
        quantity: payload.quantity,
        batchNumber: payload.batchNumber,
        expiryDate: payload.expiryDate,
        comment: payload.comment
      }).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.toastr.success('Batch updated successfully.', 'Success');
          this.loadBatches();
        },
        error: (err) => {
          this.saving = false;
          this.toastr.error(this.extractError(err, 'Failed to update batch.'), 'Error');
        }
      });
      return;
    }

    this.stockService.addBatch(this.countStockItemId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.toastr.success('Batch added successfully.', 'Success');
        this.loadBatches();
      },
      error: (err) => {
        this.saving = false;
        this.toastr.error(this.extractError(err, 'Failed to add batch.'), 'Error');
      }
    });
  }

  onModalVisibleChange(visible: boolean): void {
    this.showModal = visible;
    if (!visible) {
      this.saving = false;
      this.editingBatchId = 0;
    }
  }

  private loadBatches(): void {
    this.loading = true;
    this.stockService.getBatchesByItem(this.countStockItemId).subscribe({
      next: (res) => {
        this.batches = this.toArray<CountStockBatch>(res);
        this.loading = false;
      },
      error: (err) => {
        this.batches = [];
        this.loading = false;
        this.toastr.error(this.extractError(err, 'Failed to load batches.'), 'Error');
      }
    });
  }

  private toArray<T>(res: any): T[] {
    if (Array.isArray(res?.data?.data)) return res.data.data as T[];
    if (Array.isArray(res?.data)) return res.data as T[];
    if (Array.isArray(res)) return res as T[];
    return [];
  }

  private toDateInputValue(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private extractError(err: any, fallback: string): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    return fallback;
  }
}
