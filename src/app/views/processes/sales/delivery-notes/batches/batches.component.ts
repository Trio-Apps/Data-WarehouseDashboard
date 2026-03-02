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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AddDeliveryNoteBatchRequest, DeliveryNoteBatch, UpdateDeliveryNoteBatchRequest } from '../../Models/delivery-note-model';
import { DeliveryNoteService } from '../../Services/delivery-note.service';

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
  salesOrderId: number = 0;
  deliveryNoteId:number =0;
  returnOrderItemId: number = 0;
  quantity: number = 0;
  batches: DeliveryNoteBatch[] = [];
  loading: boolean = true;
  saving: boolean = false;

  showAddModal: boolean = false;
  showEditModal: boolean = false;
  selectedBatch: DeliveryNoteBatch | null = null;

  addForm!: FormGroup;
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private returnService: DeliveryNoteService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.deliveryNoteId = +this.route.snapshot.paramMap.get('deliveryNoteId')!;
    console.log("retrun id",this.deliveryNoteId)
    this.returnOrderItemId = +this.route.snapshot.paramMap.get('returnOrderItemId')!;
    this.quantity = +this.route.snapshot.paramMap.get('itemQuantity')!;
    this.initializeForms();
    this.loadBatches();
  }

  initializeForms(): void {
    this.addForm = this.fb.group({
      batchNumber: [''],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: [''],
      expiryDate: ['', Validators.required]
    });

    this.editForm = this.fb.group({
      deliveryNoteBatchId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: [''],
      expiryDate: ['', Validators.required]
    });
  }

  loadBatches(): void {
    this.loading = true;
    this.returnService.getDeliveryNoteBatchesByItemId(this.returnOrderItemId).subscribe({
      next: (res: any) => {
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
      batchNumber: '',
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
  }

  onEditBatch(batch: DeliveryNoteBatch): void {
    this.selectedBatch = { ...batch };
    this.showEditModal = true;

    const expiryDateStr = batch.expiryDate
      ? new Date(batch.expiryDate).toISOString().split('T')[0]
      : '';

    this.editForm.patchValue({
      deliveryNoteBatchId: batch.deliveryNoteBatchId || 0,
      quantity: batch.quantity,
      comment: batch.comment || '',
      expiryDate: expiryDateStr
    });
  }

  onDeleteBatch(batch: DeliveryNoteBatch): void {
    if (!batch.deliveryNoteBatchId) {
      return;
    }
    if (confirm('Are you sure you want to delete this batch?')) {
      this.returnService.deleteDeliveryNoteBatch(batch.deliveryNoteBatchId).subscribe({
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

    const batchData: AddDeliveryNoteBatchRequest = {
      deliveryNoteItemId: this.returnOrderItemId,
      batchNumber: formValue.batchNumber || '',
      quantity: formValue.quantity,
      comment: formValue.comment || '',
      expiryDate: expiryDateISO
    };

    this.returnService.addDeliveryNoteBatch(this.returnOrderItemId, batchData).subscribe({
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

    const batchData: UpdateDeliveryNoteBatchRequest = {
      deliveryNoteBatchId: formValue.deliveryNoteBatchId,
      quantity: formValue.quantity,
      comment: formValue.comment || '',
    };

    this.returnService.updateDeliveryNoteBatch(batchData.deliveryNoteBatchId, batchData).subscribe({
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
      deliveryNoteBatchId: 0,
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
  }

  onBack(): void {
    this.router.navigate(['/processes/sales/delivery-note-order',this.salesOrderId, this.deliveryNoteId]);
  }


  getTotalQuantity(): number {
    return this.batches.reduce((total, batch) => total + batch.quantity, 0);
  }
}

