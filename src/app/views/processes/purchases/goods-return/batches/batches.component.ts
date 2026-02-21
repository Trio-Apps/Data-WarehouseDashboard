import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe, Location } from '@angular/common';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GoodsReturnService } from '../../Services/goods-return.service';
import { AddReturnBatchRequest, ReturnBatch, UpdateReturnBatchRequest } from '../../Models/retrun-model';
import { ReceiptService } from '../../Services/receipt.service';

interface ReceiptPurchaseOrderBatchOption {
  receiptPurchaseOrderBatchId: number;
  receiptPurchaseOrderItemId: number;
  quantity: number;
  comment?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
}

@Component({
  selector: 'app-batches',
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    UtilitiesModule,
    ModalModule,
    ReactiveFormsModule,
    IconDirective,
    DatePipe
  ],
  templateUrl: './batches.component.html',
  styleUrl: './batches.component.scss',
})
export class BatchesComponent implements OnInit {
  receiptOrderId: number = 0;
  receiptItemId: number = 0;
  purchaseOrderId: number = 0;
  returnOrderItemId: number = 0;
  quantity: number = 0;
  batches: ReturnBatch[] = [];
  receiptBatchOptions: ReceiptPurchaseOrderBatchOption[] = [];
  loadingReceiptBatchOptions: boolean = false;
  loading: boolean = true;
  saving: boolean = false;

  showAddModal: boolean = false;
  showEditModal: boolean = false;
  selectedBatch: ReturnBatch | null = null;

  addForm!: FormGroup;
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private returnService: GoodsReturnService,
    private receiptService: ReceiptService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptOrderId')!;
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.returnOrderItemId = +this.route.snapshot.paramMap.get('returnOrderItemId')!;
    this.receiptItemId = +(this.route.snapshot.queryParamMap.get('receiptItemId') || 0);
    this.quantity = +this.route.snapshot.paramMap.get('itemQuentity')!;

    this.initializeForms();
    this.loadBatches();
  }

  initializeForms(): void {
    this.addForm = this.fb.group({
      selectedReceiptBatchId: [''],
      batchNumber: [''],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: [''],
      expiryDate: ['', Validators.required]
    });

    this.editForm = this.fb.group({
      goodsReturnOrderBatchId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: [''],
      expiryDate: ['', Validators.required]
    });
  }

  loadBatches(): void {
    this.loading = true;
    this.returnService.getReturnBatchesByItemId(this.returnOrderItemId).subscribe({
      next: (res: any) => {
        console.log("batchs",res);
        this.batches = res?.data && Array.isArray(res.data) ? res.data : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading batches:', err);
        this.batches = [];
        this.loading = false;
        this.toastr.error('Failed to load batches. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddBatch(): void {
    this.showAddModal = true;
    this.addForm.reset({
      selectedReceiptBatchId: '',
      batchNumber: '',
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });

    if (this.shouldShowReceiptBatchSelect()) {
      this.loadReceiptBatchOptions();
    }
  }

  onEditBatch(batch: ReturnBatch): void {
    this.selectedBatch = { ...batch };
    this.showEditModal = true;

    const expiryDateStr = batch.expiryDate
      ? new Date(batch.expiryDate).toISOString().split('T')[0]
      : '';

    this.editForm.patchValue({
      goodsReturnOrderBatchId: batch.goodsReturnOrderBatchId || 0,
      quantity: batch.quantity,
      comment: batch.comment || '',
      expiryDate: expiryDateStr
    });
  }

  onDeleteBatch(batch: ReturnBatch): void {
    if (!batch.goodsReturnOrderBatchId) {
      return;
    }
    if (confirm('Are you sure you want to delete this batch?')) {
      this.returnService.deleteReturnBatch(batch.goodsReturnOrderBatchId).subscribe({
        next: () => {
          this.toastr.success('Batch deleted successfully', 'Success');
          this.loadBatches();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting batch:', err);
          const errorMessage = err.error?.message || 'Error deleting batch. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  onSubmitAdd(): void {
    if (this.addForm.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.addForm.value;
    const expiryDateISO = formValue.expiryDate ? `${formValue.expiryDate}T00:00:00.000Z` : '';

    const batchData: AddReturnBatchRequest = {
      goodsReturnOrderItemId: this.returnOrderItemId,
      batchNumber: formValue.batchNumber || '',
      quantity: formValue.quantity,
      comment: formValue.comment || '',
      expiryDate: expiryDateISO
    };

    this.returnService.addReturnBatch(this.returnOrderItemId, batchData).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Batch added successfully', 'Success');
        this.onCloseAddModal();
        this.loadBatches();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error adding batch:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error adding batch. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onSubmitEdit(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    const batchData: UpdateReturnBatchRequest = {
      goodsReturnOrderBatchId: formValue.goodsReturnOrderBatchId,
      quantity: formValue.quantity,
      comment: formValue.comment || '',
    };

    this.returnService.updateReturnBatch(batchData.goodsReturnOrderBatchId, batchData).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Batch updated successfully', 'Success');
        this.onCloseEditModal();
        this.loadBatches();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating batch:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error updating batch. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCloseAddModal(): void {
    this.showAddModal = false;
    this.addForm.reset({
      selectedReceiptBatchId: null,
      batchNumber: '',
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
  }

  onCloseEditModal(): void {
    this.showEditModal = false;
    this.selectedBatch = null;
    this.editForm.reset({
      goodsReturnOrderBatchId: 0,
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
  }

  onBack(): void {
    this.location.back();
  }

  getTotalQuantity(): number {
    return this.batches.reduce((total, batch) => total + batch.quantity, 0);
  }

  shouldShowReceiptBatchSelect(): boolean {
    return this.receiptOrderId > 0;
  }

  onReceiptBatchSelectionChange(selectedValue: string): void {
    const selectedId = Number(selectedValue);
    if (!selectedId) {
      this.addForm.patchValue({
        batchNumber: '',
        quantity: 0.01,
        comment: '',
        expiryDate: ''
      });
      return;
    }

    const selectedBatch = this.receiptBatchOptions.find(batch => batch.receiptPurchaseOrderBatchId === selectedId);
    if (!selectedBatch) {
      return;
    }

    const expiryDateStr = this.formatDateForInput(selectedBatch.expiryDate);

    this.addForm.patchValue({

      batchNumber: selectedBatch.batchNumber || '',
      quantity: selectedBatch.quantity && selectedBatch.quantity > 0 ? selectedBatch.quantity : 0.01,
      comment: selectedBatch.comment || '',
      expiryDate: expiryDateStr
    });
  }

  private loadReceiptBatchOptions(): void {
    const receiptItemId = this.receiptItemId > 0 ? this.receiptItemId : this.returnOrderItemId;
    if (receiptItemId <= 0) {
      this.receiptBatchOptions = [];
      return;
    }

    this.loadingReceiptBatchOptions = true;
    this.receiptService.getReceiptBatchesByItemId(receiptItemId).subscribe({
      next: (res: any) => {
        this.receiptBatchOptions = res?.data && Array.isArray(res.data) ? res.data : [];
        this.loadingReceiptBatchOptions = false;
                console.log("receipt batches", this.receiptBatchOptions );

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading receipt batches:', err);
        this.receiptBatchOptions = [];
        this.loadingReceiptBatchOptions = false;
        this.toastr.error('Failed to load receipt batches. You can still add manually.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private formatDateForInput(dateValue?: string | null): string {
    if (!dateValue) {
      return '';
    }
    return new Date(dateValue).toISOString().split('T')[0];
  }
}
