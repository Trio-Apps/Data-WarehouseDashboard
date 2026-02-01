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
import { AddSalesBatchRequest, SalesBatch, SalesItem, UpdateSalesBatchRequest } from '../Models/sales-model';
import { SalesService } from '../Services/sales.service';

@Component({
  selector: 'app-sales-batches',
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
  templateUrl: './sales-batches.component.html',
  styleUrl: './sales-batches.component.scss',
})
export class SalesBatchesComponent implements OnInit {
  salesOrderId: number = 0;
  salesOrderItemId: number = 0;
  purchaseOrderId: number = 0;
  quantity: number = 0;
  receiptItem: SalesItem | null = null;
  batches: SalesBatch[] = [];
  loading: boolean = true;
  saving: boolean = false;

  // Modal states
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  selectedBatch: SalesBatch | null = null;

  // Forms
  addForm!: FormGroup;
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salesService: SalesService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.salesOrderItemId = +this.route.snapshot.paramMap.get('salesOrderItemId')!;
    this.quantity = +this.route.snapshot.paramMap.get('itemQuantity')!;

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
      receiptPurchaseOrderBatchId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: [''],
      expiryDate: ['', Validators.required]
    });
  }

  loadBatches(): void {
    this.loading = true;
    this.salesService.getSalesBatchesByItemId(this.salesOrderItemId).subscribe({
      next: (res: any) => {
        if (res.data) {
          console.log("Batches",res.data);
          this.batches = Array.isArray(res.data) ? res.data : [];
          // Get receipt item info from first batch if available
          if (this.batches.length > 0 && this.batches[0].salesOrderItemId) {
            // You can load item details here if needed
          }
        } else {
          this.batches = [];
        }
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

  onEditBatch(batch: SalesBatch): void {
    this.selectedBatch = { ...batch };
    this.showEditModal = true;
    // Format date for input type="date" (YYYY-MM-DD format)
    const expiryDateStr = batch.expiryDate
      ? new Date(batch.expiryDate).toISOString().split('T')[0]
      : '';
    this.editForm.patchValue({
      salesOrderBatchId: batch.salesOrderBatchId || 0,
      quantity: batch.quantity,
      comment: batch.comment || '',
      expiryDate: expiryDateStr
    });
  }

  onDeleteBatch(batch: SalesBatch): void {
    if (confirm(`Are you sure you want to delete this batch?`)) {
      if (batch.salesOrderBatchId) {
        this.salesService.deleteSalesBatch(batch.salesOrderBatchId).subscribe({
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
  }

  onSubmitAdd(): void {
    if (this.addForm.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }
    console.log("Adding batch",this.salesOrderItemId);
    this.saving = true;
    const formValue = this.addForm.value;

    // Format date to ISO string
    const expiryDateISO = formValue.expiryDate
      ? `${formValue.expiryDate}T00:00:00.000Z`
      : '';

    const batchData: AddSalesBatchRequest = {
      salesOrderItemId: this.salesOrderItemId,
      quantity: formValue.quantity,
      comment: formValue.comment || '',
      expiryDate: expiryDateISO
    };

    this.salesService.addSalesBatch(this.salesOrderItemId, batchData).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.toastr.success('Batch added successfully', 'Success');
        this.showAddModal = false;
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

    // Format date to ISO string
    const expiryDateISO = formValue.expiryDate
      ? `${formValue.expiryDate}T00:00:00.000Z`
      : '';

    const batchData: UpdateSalesBatchRequest = {
      salesOrderBatchId: formValue.salesOrderBatchId,
      quantity: formValue.quantity,
      comment: formValue.comment || '',
      expiryDate: expiryDateISO
    };

    this.salesService.updateSalesBatch(batchData.salesOrderBatchId, batchData).subscribe({
      next: (res: any) => {
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
      receiptPurchaseOrderBatchId: 0,
      quantity: 0.01,
      comment: '',
      expiryDate: ''
    });
  }

  onBack(): void {
    this.router.navigate(['/processes/sales/sales-items', this.salesOrderId]);
  }

  getTotalQuantity(): number {
    return this.batches.reduce((total, batch) => total + batch.quantity, 0);
  }
}
