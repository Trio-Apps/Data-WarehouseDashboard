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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TransferredRequestService } from '../Services/transferred-request.service';
import {
  AddTransferredRequestBatchRequest,
  TransferredRequestBatch,
  UpdateTransferredRequestBatchRequest
} from '../Models/transferred-request.model';

@Component({
  selector: 'app-transferred-request-batches',
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
  templateUrl: './transferred-request-batches.component.html',
  styleUrl: './transferred-request-batches.component.scss'
})
export class TransferredRequestBatchesComponent implements OnInit {
  transferredRequestId = 0;
  transferredRequestItemId = 0;
  quantity = 0;

  batches: TransferredRequestBatch[] = [];
  loading = true;
  saving = false;

  showAddModal = false;
  showEditModal = false;
  selectedBatch: TransferredRequestBatch | null = null;

  addForm!: FormGroup;
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transferredRequestService: TransferredRequestService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.transferredRequestId = +(this.route.snapshot.paramMap.get('transferredRequestId') || 0);
    this.transferredRequestItemId = +(this.route.snapshot.paramMap.get('transferredRequestItemId') || 0);
    this.quantity = +(this.route.snapshot.paramMap.get('itemQuantity') || 0);

    this.initializeForms();
    this.loadBatches();
  }

  private initializeForms(): void {
    this.addForm = this.fb.group({
      batchNumber: [''],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: [''],
      expiryDate: ['']
    });

    this.editForm = this.fb.group({
      transferredRequestBatchId: [0, Validators.required],
      batchNumber: [''],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: [''],
      expiryDate: ['']
    });
  }

  private loadBatches(): void {
    if (!this.transferredRequestItemId) {
      this.loading = false;
      this.batches = [];
      this.toastr.warning('Transferred request item ID is missing.', 'Warning');
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.transferredRequestService
      .getTransferredRequestBatchesByItemId(this.transferredRequestItemId)
      .subscribe({
        next: (res: any) => {
          const data = res?.data;
          this.batches = Array.isArray(data) ? data : [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading transferred request batches:', err);
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
      batchNumber: '',
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
  }

  onEditBatch(batch: TransferredRequestBatch): void {
    this.selectedBatch = { ...batch };
    this.showEditModal = true;

    const expiryDateStr = batch.expiryDate
      ? new Date(batch.expiryDate).toISOString().split('T')[0]
      : '';

    this.editForm.patchValue({
      transferredRequestBatchId: batch.transferredRequestBatchId || 0,
      batchNumber: batch.batchNumber || '',
      quantity: Number(batch.quantity || 0.01),
      comment: batch.comment || '',
      expiryDate: expiryDateStr
    });
  }

  onDeleteBatch(batch: TransferredRequestBatch): void {
    if (!batch.transferredRequestBatchId) {
      return;
    }

    if (!confirm('Are you sure you want to delete this batch?')) {
      return;
    }

    this.transferredRequestService
      .deleteTransferredRequestBatch(batch.transferredRequestBatchId)
      .subscribe({
        next: () => {
          this.toastr.success('Batch deleted successfully', 'Success');
          this.loadBatches();
        },
        error: (err) => {
          console.error('Error deleting batch:', err);
          const errorMessage = err?.error?.message || 'Error deleting batch. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
  }

  onSubmitAdd(): void {
    if (this.addForm.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.addForm.value;

    const batchData: AddTransferredRequestBatchRequest = {
      transferredRequestItemId: this.transferredRequestItemId,
      quantity: Number(formValue.quantity),
      comment: String(formValue.comment || '').trim() || undefined,
      batchNumber: String(formValue.batchNumber || '').trim() || undefined,
      expiryDate: this.toIsoDateOrUndefined(formValue.expiryDate)
    };

    this.transferredRequestService
      .addTransferredRequestBatch(this.transferredRequestItemId, batchData)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Batch added successfully', 'Success');
          this.showAddModal = false;
          this.loadBatches();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error adding batch:', err);
          this.saving = false;
          const errorMessage = err?.error?.message || 'Error adding batch. Please try again.';
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

    const batchData: UpdateTransferredRequestBatchRequest = {
      transferredRequestBatchId: Number(formValue.transferredRequestBatchId),
      quantity: Number(formValue.quantity),
      comment: String(formValue.comment || '').trim() || undefined,
      batchNumber: String(formValue.batchNumber || '').trim() || undefined,
      expiryDate: this.toIsoDateOrUndefined(formValue.expiryDate)
    };

    this.transferredRequestService
      .updateTransferredRequestBatch(batchData.transferredRequestBatchId, batchData)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Batch updated successfully', 'Success');
          this.showEditModal = false;
          this.selectedBatch = null;
          this.loadBatches();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating batch:', err);
          this.saving = false;
          const errorMessage = err?.error?.message || 'Error updating batch. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
  }

  onCloseAddModal(): void {
    this.showAddModal = false;
    this.addForm.reset({
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
      transferredRequestBatchId: 0,
      batchNumber: '',
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
  }

  onBack(): void {
    this.router.navigate([
      '/processes/transferred-request/transferred-request-items',
      this.transferredRequestId || 0
    ]);
  }

  getTotalQuantity(): number {
    return this.batches.reduce((total, batch) => total + Number(batch.quantity || 0), 0);
  }

  private toIsoDateOrUndefined(value: unknown): string | undefined {
    const dateText = String(value || '').trim();
    if (!dateText) {
      return undefined;
    }
    return `${dateText}T00:00:00.000Z`;
  }
}

