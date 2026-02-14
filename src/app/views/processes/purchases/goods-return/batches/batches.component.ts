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
  purchaseOrderId: number = 0;
  returnOrderItemId: number = 0;
  quantity: number = 0;
  batches: ReturnBatch[] = [];
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
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptOrderId')!;
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.returnOrderItemId = +this.route.snapshot.paramMap.get('returnOrderItemId')!;
    this.quantity = +this.route.snapshot.paramMap.get('itemQuentity')!;

    this.initializeForms();
    this.loadBatches();
  }

  initializeForms(): void {
    this.addForm = this.fb.group({
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
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
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
}
