import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormModule,
  GutterDirective,
  RowComponent,
  TableModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import {
  FinishedGoodItem,
  ProductionComponentBatch,
  ProductionComponentLine,
  ProductionHeaderBatch,
  ProductionOrderItem
} from '../Models/production.model';
import { ProductionService } from '../Services/production.service';

@Component({
  selector: 'app-production-order-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    GutterDirective,
    ButtonDirective,
    FormModule,
    TableModule,
    IconDirective
  ],
  templateUrl: './production-order-form.component.html',
  styleUrl: './production-order-form.component.scss'
})
export class ProductionOrderFormComponent implements OnInit {
  form!: FormGroup;
  headerBatchForm!: FormGroup;

  warehouseId = 0;
  productionOrderId = 0;
  productionOrderItemId = 0;
  isEditMode = false;
  isLoading = true;
  isSaving = false;
  isSubmitting = false;
  status = 'Draft';

  finishedGoods: FinishedGoodItem[] = [];
  headerBatches: ProductionHeaderBatch[] = [];
  componentLines: ProductionComponentLine[] = [];

  componentBatchesMap: Record<number, ProductionComponentBatch[]> = {};

  editingHeaderBatchId = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private productionService: ProductionService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const isoToday = this.toDateInputValue(today);

    this.form = this.fb.group({
      postingDate: [isoToday, Validators.required],
      dueDate: [isoToday, Validators.required],
      remarks: [''],
      warehouseId: [null, [Validators.required, Validators.min(1)]],
      finishedGoodItemId: [null, [Validators.required, Validators.min(1)]],
      plannedQuantity: [1, [Validators.required, Validators.min(0.000001)]]
    });

    this.headerBatchForm = this.fb.group({
      batchNumber: ['', [Validators.required, Validators.maxLength(100)]],
      quantity: [null, [Validators.required, Validators.min(0.000001)]],
      expiryDate: [null]
    });

    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.productionOrderId = Number(this.route.snapshot.paramMap.get('productionOrderId') || 0);
    this.isEditMode = this.productionOrderId > 0;

    this.form.patchValue({ warehouseId: this.warehouseId });

    this.route.fragment.subscribe((fragment) => {
      if (!fragment) {
        return;
      }

      setTimeout(() => this.scrollToSection(fragment), 150);
    });

    setTimeout(() => {
      if (this.isEditMode) {
        this.loadOrderDetails();
        return;
      }

      this.loadFinishedGoods(this.warehouseId, () => {
        this.isLoading = false;
      });
    }, 0);
  }

  get headerBatchTotal(): number {
    return this.headerBatches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
  }

  get plannedQuantity(): number {
    return Number(this.form.get('plannedQuantity')?.value || 0);
  }

  get selectedFinishedGoodId(): number {
    return Number(this.form.get('finishedGoodItemId')?.value || 0);
  }

  onBack(): void {
    this.router.navigate(['/processes/production/orders', this.warehouseId || Number(this.form.value.warehouseId)]);
  }

  onGoToHeaderBatches(): void {
    this.scrollToSection('header-batches-section');
  }

  onGoToComponents(): void {
    this.scrollToSection('components-section');
  }

  onGoToComponentBatches(line: ProductionComponentLine): void {
    if (!this.productionOrderId) {
      this.toastr.error('Save draft first to manage component batches.', 'Validation');
      return;
    }

    this.router.navigate([
      '/processes/production/component-batches',
      this.warehouseId,
      this.productionOrderId,
      line.productionComponentLineId
    ]);
  }

  onWarehouseChange(): void {
    const selectedWarehouseId = Number(this.form.get('warehouseId')?.value || 0);
    if (!selectedWarehouseId || selectedWarehouseId === this.warehouseId) {
      return;
    }

    this.warehouseId = selectedWarehouseId;

    if (!this.productionOrderId) {
      this.loadFinishedGoods(this.warehouseId);
      this.componentLines = [];
      return;
    }

    this.saveOrderHeaderOnly(() => {
      this.loadFinishedGoods(this.warehouseId);
      this.loadComponentLines();
    });
  }

  onSaveDraft(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please complete all required fields.', 'Validation');
      return;
    }

    this.isSaving = true;
    const payload = this.buildOrderPayload();

    const finalize = () => {
      this.upsertFinishedGoodItem(
        (syncMessage) => {
          this.isSaving = false;
          this.toastr.success('Production order draft saved successfully.', 'Success');
          if (syncMessage && syncMessage.toLowerCase().includes('no bom components')) {
            this.toastr.warning(syncMessage, 'BOM Sync');
          }
          this.loadHeaderBatches();
          this.loadComponentLines();
        },
        (errorMessage) => {
          this.isSaving = false;
          this.toastr.error(errorMessage, 'Error');
        }
      );
    };

    if (!this.productionOrderId) {
      this.productionService.createProductionOrder(payload).subscribe({
        next: (res: any) => {
          const data = this.pickData<any>(res);
          this.productionOrderId = Number(data?.productionOrderId || 0);

          if (!this.productionOrderId) {
            this.isSaving = false;
            this.toastr.error('Draft created but order ID was not returned.', 'Error');
            return;
          }

          this.isEditMode = true;
          this.status = data?.status || 'Draft';
          this.router.navigate(['/processes/production/order-form', this.warehouseId, this.productionOrderId]);
          finalize();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastr.error(this.extractError(err, 'Failed to create order draft.'), 'Error');
        }
      });
      return;
    }

    this.productionService.updateProductionOrder(this.productionOrderId, payload).subscribe({
      next: () => finalize(),
      error: (err) => {
        this.isSaving = false;
        this.toastr.error(this.extractError(err, 'Failed to update order draft.'), 'Error');
      }
    });
  }

  async onSubmitOrder(): Promise<void> {
    if (!this.productionOrderId) {
      this.toastr.error('Save draft first before submit.', 'Validation');
      return;
    }

    const validationError = await this.validateBeforeSubmit();
    if (validationError) {
      this.toastr.error(validationError, 'Validation');
      return;
    }

    this.isSubmitting = true;
    this.productionService.submitProductionOrder(this.productionOrderId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success('Production order submitted successfully.', 'Success');
        this.router.navigate(['/processes/production/orders', this.warehouseId]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastr.error(this.extractError(err, 'Failed to submit production order.'), 'Error');
      }
    });
  }

  onSaveHeaderBatch(): void {
    if (!this.productionOrderId) {
      this.toastr.error('Save draft first to add header batches.', 'Validation');
      return;
    }

    if (this.headerBatchForm.invalid) {
      this.headerBatchForm.markAllAsTouched();
      this.toastr.error('Please enter valid header batch data.', 'Validation');
      return;
    }

    const payload = {
      quantity: Number(this.headerBatchForm.value.quantity),
      batchNumber: String(this.headerBatchForm.value.batchNumber || '').trim(),
      expiryDate: this.headerBatchForm.value.expiryDate || null
    };

    if (this.editingHeaderBatchId) {
      this.productionService.updateProductionHeaderBatch(this.editingHeaderBatchId, payload).subscribe({
        next: () => {
          this.toastr.success('Header batch updated successfully.', 'Success');
          this.resetHeaderBatchForm();
          this.loadHeaderBatches();
        },
        error: (err) => this.toastr.error(this.extractError(err, 'Failed to update header batch.'), 'Error')
      });
      return;
    }

    this.productionService.createProductionHeaderBatch({
      productionOrderId: this.productionOrderId,
      ...payload
    }).subscribe({
      next: () => {
        this.toastr.success('Header batch added successfully.', 'Success');
        this.resetHeaderBatchForm();
        this.loadHeaderBatches();
      },
      error: (err) => this.toastr.error(this.extractError(err, 'Failed to add header batch.'), 'Error')
    });
  }

  onEditHeaderBatch(batch: ProductionHeaderBatch): void {
    this.editingHeaderBatchId = batch.productionHeaderBatchId;
    this.headerBatchForm.patchValue({
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      expiryDate: batch.expiryDate ? this.toDateInputValue(batch.expiryDate) : null
    });
  }

  onCancelHeaderBatchEdit(): void {
    this.resetHeaderBatchForm();
  }

  onDeleteHeaderBatch(batch: ProductionHeaderBatch): void {
    if (!confirm(`Delete header batch ${batch.batchNumber}?`)) {
      return;
    }

    this.productionService.deleteProductionHeaderBatch(batch.productionHeaderBatchId).subscribe({
      next: () => {
        this.toastr.success('Header batch deleted successfully.', 'Success');
        this.loadHeaderBatches();
      },
      error: (err) => this.toastr.error(this.extractError(err, 'Failed to delete header batch.'), 'Error')
    });
  }

  onSaveComponentLine(line: ProductionComponentLine): void {
    if (line.issueType === 'Backflush') {
      this.toastr.info('Required quantity cannot be edited for Backflush components.', 'Info');
      return;
    }

    this.productionService.updateProductionComponentLine(line.productionComponentLineId, {
      warehouseId: this.warehouseId,
      requiredQuantity: Number(line.requiredQuantity),
      issuedQuantity: line.issuedQuantity,
      issueType: line.issueType
    }).subscribe({
      next: () => {
        this.toastr.success('Component line updated successfully.', 'Success');
        this.loadComponentLines();
      },
      error: (err) => this.toastr.error(this.extractError(err, 'Failed to update component line.'), 'Error')
    });
  }

  onDeleteComponentLine(line: ProductionComponentLine): void {
    if (!confirm(`Delete component line ${line.itemCode || line.itemId}?`)) {
      return;
    }

    this.productionService.deleteProductionComponentLine(line.productionComponentLineId).subscribe({
      next: () => {
        this.toastr.success('Component line deleted successfully.', 'Success');
        this.loadComponentLines();
      },
      error: (err) => this.toastr.error(this.extractError(err, 'Failed to delete component line.'), 'Error')
    });
  }

  private loadOrderDetails(): void {
    this.isLoading = true;

    this.productionService.getProductionOrderById(this.productionOrderId).subscribe({
      next: (res: any) => {
        const order = this.pickData<any>(res);
        this.warehouseId = Number(order?.warehouseId || this.warehouseId);
        this.status = String(order?.status || 'Draft');

        this.form.patchValue({
          postingDate: this.toDateInputValue(order?.postingDate),
          dueDate: this.toDateInputValue(order?.dueDate),
          remarks: order?.remarks || '',
          warehouseId: this.warehouseId
        });

        this.loadFinishedGoods(this.warehouseId);
        this.loadOrderItems();
        this.loadHeaderBatches();
        this.loadComponentLines();

        setTimeout(() => {
          this.isLoading = false;
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading = false;
        });
        this.toastr.error(this.extractError(err, 'Failed to load production order.'), 'Error');
      }
    });
  }

  private loadOrderItems(): void {
    if (!this.productionOrderId) {
      return;
    }

    this.productionService.getProductionOrderItems(this.productionOrderId, 1, 50).subscribe({
      next: (res: any) => {
        const items = this.toArray<ProductionOrderItem>(res);

        if (items.length > 0) {
          const item = items[0];
          this.productionOrderItemId = Number(item.productionOrderItemId || 0);
          this.form.patchValue({
            finishedGoodItemId: item.itemId,
            plannedQuantity: item.plannedQuantity
          });
        } else {
          this.productionOrderItemId = 0;
        }
      },
      error: () => {
        this.productionOrderItemId = 0;
      }
    });
  }

  private loadHeaderBatches(): void {
    if (!this.productionOrderId) {
      this.headerBatches = [];
      return;
    }

    this.productionService.getProductionHeaderBatches(this.productionOrderId, 1, 200).subscribe({
      next: (res: any) => {
        this.headerBatches = this.toArray<ProductionHeaderBatch>(res);
      },
      error: (err) => {
        this.headerBatches = [];
        this.toastr.error(this.extractError(err, 'Failed to load header batches.'), 'Error');
      }
    });
  }

  private loadComponentLines(): void {
    if (!this.productionOrderId) {
      this.componentLines = [];
      return;
    }

    this.productionService.getProductionComponentLines(this.productionOrderId, 1, 300).subscribe({
      next: (res: any) => {
        this.componentLines = this.toArray<ProductionComponentLine>(res);
        this.componentBatchesMap = {};

        this.componentLines.forEach((line) => {
          this.loadComponentBatches(line.productionComponentLineId);
        });
      },
      error: (err) => {
        this.componentLines = [];
        this.componentBatchesMap = {};
        this.toastr.error(this.extractError(err, 'Failed to load BOM components.'), 'Error');
      }
    });
  }

  private loadComponentBatches(lineId: number): void {
    this.productionService.getProductionComponentBatches(lineId, 1, 200).subscribe({
      next: (res: any) => {
        this.componentBatchesMap[lineId] = this.toArray<ProductionComponentBatch>(res);
      },
      error: () => {
        this.componentBatchesMap[lineId] = [];
      }
    });
  }

  private loadFinishedGoods(warehouseId: number, onDone?: () => void): void {
    if (!warehouseId) {
      this.finishedGoods = [];
      if (onDone) {
        onDone();
      }
      return;
    }

    this.productionService.getFinishedGoodsByWarehouse(warehouseId, 1, 500).subscribe({
      next: (res: any) => {
        this.finishedGoods = this.toArray<FinishedGoodItem>(res);
        if (onDone) {
          onDone();
        }
      },
      error: () => {
        this.finishedGoods = [];
        if (onDone) {
          onDone();
        }
      }
    });
  }

  private upsertFinishedGoodItem(onSuccess: (syncMessage?: string) => void, onError: (message: string) => void): void {
    const payload = {
      productionOrderId: this.productionOrderId,
      plannedQuantity: Number(this.form.value.plannedQuantity),
      itemId: Number(this.form.value.finishedGoodItemId)
    };

    if (!payload.itemId || !payload.plannedQuantity) {
      onError('Finished good item and quantity are required.');
      return;
    }

    if (this.productionOrderItemId) {
      this.productionService.updateProductionOrderItem(this.productionOrderItemId, {
        plannedQuantity: payload.plannedQuantity
      }).subscribe({
        next: (res: any) => onSuccess(this.extractResponseMessage(res)),
        error: (err) => onError(this.extractError(err, 'Failed to update finished good item.'))
      });

      return;
    }

    this.productionService.createProductionOrderItem(payload).subscribe({
      next: (res: any) => {
        const data = this.pickData<any>(res);
        this.productionOrderItemId = Number(data?.productionOrderItemId || 0);
        onSuccess(this.extractResponseMessage(res));
      },
      error: (err) => onError(this.extractError(err, 'Failed to add finished good item.'))
    });
  }

  private saveOrderHeaderOnly(onDone: () => void): void {
    if (!this.productionOrderId) {
      onDone();
      return;
    }

    this.productionService.updateProductionOrder(this.productionOrderId, this.buildOrderPayload()).subscribe({
      next: () => onDone(),
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Failed to update header warehouse.'), 'Error');
      }
    });
  }

  private buildOrderPayload(): any {
    return {
      postingDate: this.formatDateToISOString(this.form.value.postingDate),
      dueDate: this.formatDateToISOString(this.form.value.dueDate),
      remarks: this.form.value.remarks,
      warehouseId: Number(this.form.value.warehouseId)
    };
  }

  private async validateBeforeSubmit(): Promise<string | null> {
    if (!this.selectedFinishedGoodId || this.plannedQuantity <= 0) {
      return 'Finished good and quantity are required.';
    }

    let isBatchManaged = false;
    try {
      const res = await firstValueFrom(
        this.productionService.getFinishedGoodItemByItemAndWarehouse(this.selectedFinishedGoodId, this.warehouseId)
      );
      const data = this.pickData<any>(res);
      isBatchManaged = Boolean(data?.isBatchManaged ?? data?.IsBatchManaged ?? false);
    } catch {
      isBatchManaged = false;
    }

    if (isBatchManaged) {
      if (this.headerBatches.length === 0) {
        return 'Batch-managed finished good requires header batches before submit.';
      }

      const total = this.headerBatchTotal;
      if (Number(total.toFixed(6)) !== Number(this.plannedQuantity.toFixed(6))) {
        return 'Header batch quantity total must equal finished good quantity.';
      }
    }

    for (const line of this.componentLines) {
      if (line.issueType !== 'Manual') {
        continue;
      }

      const selectedBatches = this.componentBatchesMap[line.productionComponentLineId] || [];
      if (selectedBatches.length === 0) {
        continue;
      }

      const lineBatchTotal = selectedBatches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
      if (Number(lineBatchTotal.toFixed(6)) !== Number(Number(line.requiredQuantity || 0).toFixed(6))) {
        return `Component ${line.itemCode || line.itemId} batch total must equal required quantity.`;
      }
    }

    return null;
  }

  private resetHeaderBatchForm(): void {
    this.editingHeaderBatchId = 0;
    this.headerBatchForm.reset({
      batchNumber: '',
      quantity: null,
      expiryDate: null
    });
  }

  private scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (!el) {
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private toDateInputValue(value: any): string {
    const date = new Date(value || new Date());
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatDateToISOString(date: string | Date | null | undefined): string {
    if (!date) {
      return '';
    }

    if (typeof date === 'string') {
      return `${date}T00:00:00.000Z`;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
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

  private extractResponseMessage(res: any): string {
    if (typeof res?.message === 'string' && res.message.trim()) {
      return res.message;
    }

    if (typeof res?.data?.message === 'string' && res.data.message.trim()) {
      return res.data.message;
    }

    return '';
  }
}
