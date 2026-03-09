import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ProductionHeaderBatch } from '../Models/production.model';
import { ProductionService } from '../Services/production.service';

@Component({
  selector: 'app-production-header-batches',
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
  templateUrl: './production-header-batches.component.html',
  styleUrl: './production-header-batches.component.scss'
})
export class ProductionHeaderBatchesComponent implements OnInit {
  private readonly minBatchQuantity = 0.01;

  warehouseId = 0;
  productionOrderId = 0;
  itemQuantity = 0;
  orderStatus = 'Unknown';

  batches: ProductionHeaderBatch[] = [];
  loading = true;
  saving = false;

  showAddModal = false;
  showEditModal = false;
  selectedBatch: ProductionHeaderBatch | null = null;

  addForm!: FormGroup;
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productionService: ProductionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.productionOrderId = Number(this.route.snapshot.paramMap.get('productionOrderId') || 0);
    this.itemQuantity = Number(this.route.snapshot.paramMap.get('itemQuantity') || 0);

    this.initializeForms();
    this.loadInitialDataAsync();
  }

  onBack(): void {
    this.router.navigate(['/processes/production/order-items', this.warehouseId, this.productionOrderId]);
  }

  onAddBatch(): void {
    this.setAddModalVisible(true);
    this.addForm.reset({
      batchNumber: '',
      quantity: null,
      expiryDate: null
    });
  }

  onEditBatch(batch: ProductionHeaderBatch): void {
    this.selectedBatch = { ...batch };
    this.setEditModalVisible(true);
    this.editForm.patchValue({
      productionHeaderBatchId: batch.productionHeaderBatchId,
      batchNumber: batch.batchNumber || '',
      quantity: Number(batch.quantity || 0),
      expiryDate: batch.expiryDate ? this.toDateInputValue(batch.expiryDate) : null
    });
  }

  onDeleteBatch(batch: ProductionHeaderBatch): void {
    if (!confirm(`Delete batch ${batch.batchNumber}?`)) {
      return;
    }

    this.productionService.deleteProductionHeaderBatch(batch.productionHeaderBatchId).subscribe({
      next: () => {
        this.toastr.success('Batch deleted successfully.', 'Success');
        this.loadBatches();
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Failed to delete batch.'), 'Error');
      }
    });
  }

  onSubmitAdd(): void {
    if (this.saving) {
      return;
    }

    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.toastr.error('Please fill all required fields.', 'Validation');
      return;
    }

    this.setSaving(true, false);
    const formValue = this.addForm.value;

    this.productionService.createProductionHeaderBatch({
      productionOrderId: this.productionOrderId,
      batchNumber: String(formValue.batchNumber || '').trim(),
      quantity: Number(formValue.quantity || 0),
      expiryDate: this.formatDateToISOString(formValue.expiryDate)
    }).subscribe({
      next: () => {
        this.setSaving(false);
        this.setAddModalVisible(false);
        this.toastr.success('Batch added successfully.', 'Success');
        this.loadBatches();
      },
      error: (err) => {
        this.setSaving(false);
        this.toastr.error(this.extractError(err, 'Failed to add batch.'), 'Error');
      }
    });
  }

  onSubmitEdit(): void {
    if (this.saving) {
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toastr.error('Please fill all required fields.', 'Validation');
      return;
    }

    this.setSaving(true, false);
    const formValue = this.editForm.value;
    const batchId = Number(formValue.productionHeaderBatchId || 0);

    this.productionService.updateProductionHeaderBatch(batchId, {
      batchNumber: String(formValue.batchNumber || '').trim(),
      quantity: Number(formValue.quantity || 0),
      expiryDate: this.formatDateToISOString(formValue.expiryDate)
    }).subscribe({
      next: () => {
        this.setSaving(false);
        this.setEditModalVisible(false);
        this.selectedBatch = null;
        this.toastr.success('Batch updated successfully.', 'Success');
        this.loadBatches();
      },
      error: (err) => {
        this.setSaving(false);
        this.toastr.error(this.extractError(err, 'Failed to update batch.'), 'Error');
      }
    });
  }

  onCloseAddModal(): void {
    this.setAddModalVisible(false);
    this.setSaving(false);
  }

  onCloseEditModal(): void {
    this.setEditModalVisible(false);
    this.selectedBatch = null;
    this.setSaving(false);
  }

  onAddModalVisibleChange(visible: boolean): void {
    this.setAddModalVisible(visible);
    if (!visible) {
      this.setSaving(false);
    }
  }

  onEditModalVisibleChange(visible: boolean): void {
    this.setEditModalVisible(visible);
    if (!visible) {
      this.selectedBatch = null;
      this.setSaving(false);
    }
  }

  getTotalQuantity(): number {
    return this.batches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
  }

  private initializeForms(): void {
    this.addForm = this.fb.group({
      batchNumber: ['', [Validators.required, Validators.maxLength(100)]],
      quantity: [null, [Validators.required, Validators.min(this.minBatchQuantity)]],
      expiryDate: [null]
    });

    this.editForm = this.fb.group({
      productionHeaderBatchId: [0, Validators.required],
      batchNumber: ['', [Validators.required, Validators.maxLength(100)]],
      quantity: [null, [Validators.required, Validators.min(this.minBatchQuantity)]],
      expiryDate: [null]
    });
  }

  private loadInitialDataAsync(): void {
    // Defer first data mutation to the next macrotask to avoid NG0100 in dev mode
    // when service observables emit synchronously (e.g., cached/intercepted responses).
    setTimeout(() => {
      this.loadOrderStatus();
      this.loadBatches();
    }, 0);
  }

  private loadOrderStatus(): void {
    if (!this.productionOrderId) {
      return;
    }

    this.productionService.getProductionOrderById(this.productionOrderId).subscribe({
      next: (res: any) => {
        const order = this.pickData<any>(res);
        this.orderStatus = this.normalizeStatus(order?.status);
      },
      error: () => {
        this.orderStatus = 'Unknown';
      }
    });
  }

  private loadBatches(): void {
    if (!this.productionOrderId) {
      this.batches = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.productionService.getProductionHeaderBatches(this.productionOrderId, 1, 200).subscribe({
      next: (res: any) => {
        this.batches = this.toArray<ProductionHeaderBatch>(res);
        this.loading = false;
      },
      error: (err) => {
        this.batches = [];
        this.loading = false;
        this.toastr.error(this.extractError(err, 'Failed to load batches.'), 'Error');
      }
    });
  }

  private normalizeStatus(status: any): string {
    const raw = String(status ?? '').trim();
    const numberValue = Number(raw);
    if (!Number.isNaN(numberValue)) {
      switch (numberValue) {
        case 1:
          return 'Draft';
        case 2:
          return 'Processing';
        case 3:
          return 'Released';
        case 4:
          return 'Received';
        case 5:
          return 'Completed';
        case 6:
          return 'PartiallyFailed';
        default:
          return raw || 'Unknown';
      }
    }

    return raw || 'Unknown';
  }

  private toDateInputValue(value: any): string {
    const date = new Date(value || new Date());
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatDateToISOString(value: string | Date | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      return `${value}T00:00:00`;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  private toArray<T>(res: any): T[] {
    if (Array.isArray(res?.data?.data?.$values)) {
      return res.data.data.$values as T[];
    }
    if (Array.isArray(res?.data?.$values)) {
      return res.data.$values as T[];
    }
    if (Array.isArray(res?.$values)) {
      return res.$values as T[];
    }
    if (Array.isArray(res?.data?.data)) {
      return res.data.data as T[];
    }
    if (Array.isArray(res?.data)) {
      return res.data as T[];
    }
    if (Array.isArray(res)) {
      return res as T[];
    }

    return [];
  }

  private pickData<T>(res: any): T {
    if (res?.data?.data) {
      return res.data.data as T;
    }
    if (res?.data) {
      return res.data as T;
    }
    return res as T;
  }

  private extractError(err: any, fallback: string): string {
    const body = err?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body?.message) {
      return body.message;
    }
    if (body?.detail) {
      return body.detail;
    }
    if (Array.isArray(body?.errors) && body.errors.length > 0) {
      return String(body.errors[0]);
    }
    if (body?.errors && typeof body.errors === 'object') {
      const firstKey = Object.keys(body.errors)[0];
      if (firstKey && Array.isArray(body.errors[firstKey]) && body.errors[firstKey].length > 0) {
        return String(body.errors[firstKey][0]);
      }
    }

    return fallback;
  }

  private setSaving(value: boolean, defer = true): void {
    if (!defer) {
      this.saving = value;
      return;
    }

    setTimeout(() => {
      this.saving = value;
      this.cdr.detectChanges();
    });
  }

  private setAddModalVisible(visible: boolean): void {
    setTimeout(() => {
      this.showAddModal = visible;
      this.cdr.detectChanges();
    });
  }

  private setEditModalVisible(visible: boolean): void {
    setTimeout(() => {
      this.showEditModal = visible;
      this.cdr.detectChanges();
    });
  }
}
