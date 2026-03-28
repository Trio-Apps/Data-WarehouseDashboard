import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { catchError, finalize, firstValueFrom, of, timeout } from 'rxjs';
import {
  FinishedGoodItem,
  ProductionHeaderBatch,
  ProductionOrderItem
} from '../Models/production.model';
import { ProductionService } from '../Services/production.service';
import { ReasonService } from '../../reasons/Services/reason.service';
import { ReasonDto } from '../../reasons/Models/reason.model';

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
  private readonly minHeaderBatchQuantity = 0.01;

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
  private loadToken = 0;

  finishedGoods: FinishedGoodItem[] = [];
  headerBatches: ProductionHeaderBatch[] = [];

  editingHeaderBatchId = 0;
  reasons: ReasonDto[] = [];
  loadingReasons = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private productionService: ProductionService,
    private cdr: ChangeDetectorRef,
    private reasonService: ReasonService
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
      plannedQuantity: [1, [Validators.required, Validators.min(0.000001)]],
      reasonId: [null]
    });

    this.headerBatchForm = this.fb.group({
      batchNumber: ['', [Validators.required, Validators.maxLength(100)]],
      quantity: [null, [Validators.required, Validators.min(this.minHeaderBatchQuantity)]],
      expiryDate: [null]
    });

    this.warehouseId = this.getRouteNumber('warehouseId');
    this.productionOrderId = this.getRouteNumber('productionOrderId');
    this.isEditMode = this.productionOrderId > 0;

    this.form.patchValue({ warehouseId: this.warehouseId });

    this.loadReasons();

    this.route.fragment.subscribe((fragment) => {
      if (!fragment) {
        return;
      }

      setTimeout(() => this.scrollToSection(fragment), 150);
    });

    if ((this.route.snapshot.routeConfig?.path || '').startsWith('production-header-batches')) {
      setTimeout(() => this.scrollToSection('header-batches-section'), 200);
    }

    this.runUiUpdate(() => {
      if (this.isEditMode) {
        this.loadOrderDetails();
        return;
      }

      this.loadFinishedGoods(this.warehouseId, () => {
        this.runUiUpdate(() => {
          this.isLoading = false;
        });
      });
    });
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

  onWarehouseChange(): void {
    const selectedWarehouseId = Number(this.form.get('warehouseId')?.value || 0);
    if (!selectedWarehouseId || selectedWarehouseId === this.warehouseId) {
      return;
    }

    this.warehouseId = selectedWarehouseId;

    if (!this.productionOrderId) {
      this.loadFinishedGoods(this.warehouseId);
      return;
    }

    this.saveOrderHeaderOnly(() => {
      this.loadFinishedGoods(this.warehouseId);
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

  private loadReasons(): void {
    this.loadingReasons = true;

    this.reasonService.getReasonsByProcessType('Production').subscribe({
      next: (res) => {
        const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
        this.reasons = Array.isArray(payload) ? payload : [];
        this.loadingReasons = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading reasons:', err);
        this.reasons = [];
        this.loadingReasons = false;
        this.cdr.detectChanges();
      }
    });
  }
  private loadOrderDetails(): void {
    if (!this.productionOrderId) {
      this.runUiUpdate(() => {
        this.isLoading = false;
      });
      return;
    }

    const currentLoadToken = ++this.loadToken;
    this.runUiUpdate(() => {
      this.isLoading = true;
    });

    const failSafe = setTimeout(() => {
      if (currentLoadToken !== this.loadToken || !this.isLoading) {
        return;
      }
      this.runUiUpdate(() => {
        if (currentLoadToken !== this.loadToken || !this.isLoading) {
          return;
        }
        this.isLoading = false;
        this.toastr.error('Loading production order is taking too long. Please check API health.', 'Error');
      });
    }, 20000);

    this.productionService.getProductionOrderById(this.productionOrderId)
      .pipe(
        timeout(10000),
        catchError((err) => of({ __loadError: err })),
        finalize(() => {
          clearTimeout(failSafe);
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }
            this.isLoading = false;
          });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }

            if (res?.__loadError) {
              const fallback = this.isTimeoutError(res.__loadError)
                ? 'Loading production order timed out. Please try again.'
                : 'Failed to load production order.';
              this.toastr.error(this.extractError(res.__loadError, fallback), 'Error');
              return;
            }

            const order = this.pickData<any>(res);
            this.warehouseId = Number(order?.warehouseId ?? order?.WarehouseId ?? this.warehouseId);
            this.status = String(order?.status ?? order?.Status ?? 'Draft');

            this.form.patchValue({
              postingDate: this.toDateInputValue(order?.postingDate ?? order?.PostingDate),
              dueDate: this.toDateInputValue(order?.dueDate ?? order?.DueDate),
              remarks: order?.remarks ?? order?.Remarks ?? '',
              reasonId: order?.reasonId ?? order?.ReasonId ?? null,
              warehouseId: this.warehouseId
            });

            this.loadFinishedGoods(this.warehouseId);
            this.loadOrderItems();
            this.loadHeaderBatches();
          });
        },
        error: (err) => {
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }
            const fallback = this.isTimeoutError(err)
              ? 'Loading production order timed out. Please try again.'
              : 'Failed to load production order.';
            this.toastr.error(this.extractError(err, fallback), 'Error');
          });
        }
      });
  }

  private loadOrderItems(): void {
    if (!this.productionOrderId) {
      return;
    }

    this.productionService.getProductionOrderItems(this.productionOrderId, 1, 50)
      .pipe(timeout(10000))
      .subscribe({
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
        error: (err) => {
          this.productionOrderItemId = 0;
          if (this.isTimeoutError(err)) {
            this.toastr.warning('Loading production items timed out. You can retry.', 'Warning');
          }
        }
      });
  }

  private loadHeaderBatches(): void {
    if (!this.productionOrderId) {
      this.runUiUpdate(() => {
        this.headerBatches = [];
      });
      return;
    }

    this.productionService.getProductionHeaderBatches(this.productionOrderId, 1, 200)
      .pipe(timeout(10000))
      .subscribe({
        next: (res: any) => {
          this.runUiUpdate(() => {
            this.headerBatches = this.toArray<ProductionHeaderBatch>(res);
          });
        },
        error: (err) => {
          this.runUiUpdate(() => {
            this.headerBatches = [];
            const fallback = this.isTimeoutError(err)
              ? 'Loading header batches timed out. Please try again.'
              : 'Failed to load header batches.';
            this.toastr.error(this.extractError(err, fallback), 'Error');
          });
        }
      });
  }

  private loadFinishedGoods(warehouseId: number, onDone?: () => void): void {
    if (!warehouseId) {
      this.runUiUpdate(() => {
        this.finishedGoods = [];
      });
      onDone?.();
      return;
    }

    this.productionService.getFinishedGoodsByWarehouse(warehouseId, 1, 500)
      .pipe(timeout(10000))
      .subscribe({
        next: (res: any) => {
          this.runUiUpdate(() => {
            this.finishedGoods = this.toArray<FinishedGoodItem>(res);
          });
          onDone?.();
        },
        error: (err) => {
          this.runUiUpdate(() => {
            this.finishedGoods = [];
          });
          if (this.isTimeoutError(err)) {
            this.toastr.warning('Loading finished goods timed out. You can retry.', 'Warning');
          }
          onDone?.();
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
      reasonId: Number(this.form.value.reasonId) || null,
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

  private getRouteNumber(key: string): number {
    const fromParam = Number(this.route.snapshot.paramMap.get(key) || 0);
    if (fromParam > 0) {
      return fromParam;
    }

    const fromQuery = Number(this.route.snapshot.queryParamMap.get(key) || 0);
    if (fromQuery > 0) {
      return fromQuery;
    }

    return 0;
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
    if (Array.isArray(res?.data?.data?.data?.$values)) {
      return res.data.data.data.$values as T[];
    }

    if (Array.isArray(res?.data?.data?.data)) {
      return res.data.data.data as T[];
    }

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

    if (Array.isArray(res?.Data?.Data?.Data?.$values)) {
      return res.Data.Data.Data.$values as T[];
    }

    if (Array.isArray(res?.Data?.Data?.Data)) {
      return res.Data.Data.Data as T[];
    }

    if (Array.isArray(res?.Data?.Data?.$values)) {
      return res.Data.Data.$values as T[];
    }

    if (Array.isArray(res?.Data?.Data)) {
      return res.Data.Data as T[];
    }

    if (Array.isArray(res?.Data?.$values)) {
      return res.Data.$values as T[];
    }

    if (Array.isArray(res?.Data)) {
      return res.Data as T[];
    }

    if (Array.isArray(res)) {
      return res as T[];
    }

    return [];
  }

  private pickData<T>(res: any): T {
    if (res?.data?.data?.data) {
      return res.data.data.data as T;
    }

    if (res?.data?.data) {
      return res.data.data as T;
    }

    if (res?.data) {
      return res.data as T;
    }

    if (res?.Data?.Data?.Data) {
      return res.Data.Data.Data as T;
    }

    if (res?.Data?.Data) {
      return res.Data.Data as T;
    }

    if (res?.Data) {
      return res.Data as T;
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

    if (err?.message) {
      return err.message;
    }

    return fallback;
  }

  private isTimeoutError(err: any): boolean {
    return String(err?.name || '').toLowerCase() === 'timeouterror';
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

  private runUiUpdate(action: () => void): void {
    setTimeout(() => {
      action();
      this.cdr.detectChanges();
    });
  }
}

