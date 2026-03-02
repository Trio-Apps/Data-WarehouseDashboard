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
import { AvailableComponentBatch, ProductionComponentBatch, ProductionComponentLine } from '../Models/production.model';
import { ProductionService } from '../Services/production.service';

@Component({
  selector: 'app-production-component-batches',
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
  templateUrl: './production-component-batches.component.html',
  styleUrl: './production-component-batches.component.scss'
})
export class ProductionComponentBatchesComponent implements OnInit {
  warehouseId = 0;
  productionOrderId = 0;
  componentLineId = 0;

  isLoading = false;
  isSavingLine = false;

  componentLine: ProductionComponentLine | null = null;
  componentLines: ProductionComponentLine[] = [];
  batches: ProductionComponentBatch[] = [];
  availableBatches: AvailableComponentBatch[] = [];

  batchForm!: FormGroup;
  editingBatchId = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private productionService: ProductionService
  ) {}

  ngOnInit(): void {
    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.productionOrderId = Number(this.route.snapshot.paramMap.get('productionOrderId') || 0);
    this.componentLineId = Number(this.route.snapshot.paramMap.get('componentLineId') || 0);

    this.batchForm = this.fb.group({
      batchNumber: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.000001)]],
      expiryDate: [null]
    });

    if (!this.productionOrderId || !this.componentLineId) {
      this.toastr.error('Invalid component route parameters.', 'Error');
      this.onBack();
      return;
    }

    this.loadPageData();
  }

  get totalBatchQuantity(): number {
    return this.batches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
  }

  get requiredQuantity(): number {
    return Number(this.componentLine?.requiredQuantity || 0);
  }

  get isBackflush(): boolean {
    return String(this.componentLine?.issueType || '').toLowerCase() === 'backflush';
  }

  get currentLineIndex(): number {
    return this.componentLines.findIndex((line) => line.productionComponentLineId === this.componentLineId);
  }

  get hasPrevLine(): boolean {
    return this.currentLineIndex > 0;
  }

  get hasNextLine(): boolean {
    return this.currentLineIndex >= 0 && this.currentLineIndex < this.componentLines.length - 1;
  }

  onBack(): void {
    if (this.productionOrderId) {
      this.router.navigate(['/processes/production/order-form', this.warehouseId, this.productionOrderId], {
        fragment: 'components-section'
      });
      return;
    }

    this.router.navigate(['/processes/production/orders', this.warehouseId]);
  }

  onRefresh(): void {
    this.loadPageData();
  }

  onGoToPrevLine(): void {
    if (!this.hasPrevLine) {
      return;
    }

    const target = this.componentLines[this.currentLineIndex - 1];
    this.navigateToLine(target.productionComponentLineId);
  }

  onGoToNextLine(): void {
    if (!this.hasNextLine) {
      return;
    }

    const target = this.componentLines[this.currentLineIndex + 1];
    this.navigateToLine(target.productionComponentLineId);
  }

  onSaveRequiredQuantity(): void {
    if (!this.componentLine || this.isBackflush) {
      return;
    }

    const payload = {
      warehouseId: this.warehouseId,
      requiredQuantity: Number(this.componentLine.requiredQuantity || 0),
      issuedQuantity: this.componentLine.issuedQuantity,
      issueType: this.componentLine.issueType
    };

    this.isSavingLine = true;
    this.productionService.updateProductionComponentLine(this.componentLine.productionComponentLineId, payload).subscribe({
      next: () => {
        this.isSavingLine = false;
        this.toastr.success('Component quantity updated successfully.', 'Success');
        this.loadComponentLines();
      },
      error: (err) => {
        this.isSavingLine = false;
        this.toastr.error(this.extractError(err, 'Failed to update component quantity.'), 'Error');
      }
    });
  }

  onSaveBatch(): void {
    if (!this.componentLine) {
      return;
    }

    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      this.toastr.error('Please enter valid batch data.', 'Validation');
      return;
    }

    const payload = {
      quantity: Number(this.batchForm.value.quantity),
      batchNumber: String(this.batchForm.value.batchNumber || '').trim(),
      expiryDate: this.batchForm.value.expiryDate || null
    };

    if (this.editingBatchId) {
      this.productionService.updateProductionComponentBatch(this.editingBatchId, payload).subscribe({
        next: () => {
          this.toastr.success('Component batch updated successfully.', 'Success');
          this.resetBatchForm();
          this.loadBatches();
          this.loadAvailableBatches();
        },
        error: (err) => this.toastr.error(this.extractError(err, 'Failed to update component batch.'), 'Error')
      });
      return;
    }

    this.productionService
      .createProductionComponentBatch({
        productionComponentLineId: this.componentLine.productionComponentLineId,
        ...payload
      })
      .subscribe({
        next: () => {
          this.toastr.success('Component batch added successfully.', 'Success');
          this.resetBatchForm();
          this.loadBatches();
          this.loadAvailableBatches();
        },
        error: (err) => this.toastr.error(this.extractError(err, 'Failed to add component batch.'), 'Error')
      });
  }

  onEditBatch(batch: ProductionComponentBatch): void {
    this.editingBatchId = batch.productionComponentBatchId;
    this.batchForm.patchValue({
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      expiryDate: batch.expiryDate ? this.toDateInputValue(batch.expiryDate) : null
    });
  }

  onCancelBatchEdit(): void {
    this.resetBatchForm();
  }

  onDeleteBatch(batch: ProductionComponentBatch): void {
    if (!confirm(`Delete component batch ${batch.batchNumber}?`)) {
      return;
    }

    this.productionService.deleteProductionComponentBatch(batch.productionComponentBatchId).subscribe({
      next: () => {
        this.toastr.success('Component batch deleted successfully.', 'Success');
        this.loadBatches();
        this.loadAvailableBatches();
      },
      error: (err) => this.toastr.error(this.extractError(err, 'Failed to delete component batch.'), 'Error')
    });
  }

  private loadPageData(): void {
    this.isLoading = true;

    this.loadComponentLines(() => {
      this.loadBatches();
      this.loadAvailableBatches();
      this.isLoading = false;
    });
  }

  private loadComponentLines(onDone?: () => void): void {
    this.productionService.getProductionComponentLines(this.productionOrderId, 1, 500).subscribe({
      next: (res: any) => {
        this.componentLines = this.toArray<ProductionComponentLine>(res);
        this.componentLine = this.componentLines.find((line) => line.productionComponentLineId === this.componentLineId) || null;

        if (!this.componentLine) {
          this.productionService.getProductionComponentLineById(this.componentLineId).subscribe({
            next: (lineRes: any) => {
              this.componentLine = this.pickData<ProductionComponentLine>(lineRes);
              if (onDone) {
                onDone();
              }
            },
            error: () => {
              this.toastr.error('Component line not found.', 'Error');
              this.onBack();
            }
          });
          return;
        }

        if (onDone) {
          onDone();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error(this.extractError(err, 'Failed to load component lines.'), 'Error');
      }
    });
  }

  private loadBatches(): void {
    this.productionService.getProductionComponentBatches(this.componentLineId, 1, 300).subscribe({
      next: (res: any) => {
        this.batches = this.toArray<ProductionComponentBatch>(res);
        this.mergeSelectedBatchNumbersIntoAvailable();
      },
      error: () => {
        this.batches = [];
        this.mergeSelectedBatchNumbersIntoAvailable();
      }
    });
  }

  private loadAvailableBatches(): void {
    this.productionService.getAvailableComponentBatches(this.componentLineId).subscribe({
      next: (res: any) => {
        this.availableBatches = this.normalizeAvailableBatches(res);
        this.mergeSelectedBatchNumbersIntoAvailable();

        if (this.availableBatches.length === 0) {
          this.loadFallbackAvailableBatches();
        }
      },
      error: () => {
        this.availableBatches = [];
        this.mergeSelectedBatchNumbersIntoAvailable();

        this.loadFallbackAvailableBatches();
      }
    });
  }

  private loadFallbackAvailableBatches(): void {
    const itemId = Number(this.componentLine?.itemId || 0);
    const warehouseId = Number(this.componentLine?.warehouseId || this.warehouseId || 0);
    if (!itemId || !warehouseId) {
      return;
    }

    this.productionService.getAvailableComponentBatchesFallback(itemId, warehouseId).subscribe({
      next: (rows: any[]) => {
        if (!Array.isArray(rows) || rows.length === 0) {
          return;
        }

        this.availableBatches = rows
          .map((batch: any) => this.toAvailableBatch(batch))
          .filter((batch: AvailableComponentBatch) => Boolean(batch.batchNumber));
        this.mergeSelectedBatchNumbersIntoAvailable();
      },
      error: () => {
        // keep current list as-is
      }
    });
  }

  private normalizeAvailableBatches(res: any): AvailableComponentBatch[] {
    const direct = this.toArray<any>(res);
    if (direct.length > 0) {
      return direct
        .map((batch) => this.toAvailableBatch(batch))
        .filter((batch) => Boolean(batch.batchNumber));
    }

    const data = this.pickData<any>(res);
    const nestedCandidates = [
      data?.items,
      data?.Items,
      data?.batches,
      data?.Batches,
      data?.result,
      data?.Result
    ];

    const nestedArray = nestedCandidates.find((item) => Array.isArray(item));
    if (!Array.isArray(nestedArray)) {
      return [];
    }

    return nestedArray
      .map((batch: any) => this.toAvailableBatch(batch))
      .filter((batch: AvailableComponentBatch) => Boolean(batch.batchNumber));
  }

  private toAvailableBatch(raw: any): AvailableComponentBatch {
    return {
      batchNumber: String(raw?.batchNumber ?? raw?.BatchNumber ?? ''),
      expiryDate: raw?.expiryDate ?? raw?.ExpiryDate ?? null,
      quantityReceived: Number(raw?.quantityReceived ?? raw?.QuantityReceived ?? 0),
      quantityAllocatedInOrder: Number(raw?.quantityAllocatedInOrder ?? raw?.QuantityAllocatedInOrder ?? 0),
      quantityAvailable: Number(raw?.quantityAvailable ?? raw?.QuantityAvailable ?? 0)
    };
  }

  private mergeSelectedBatchNumbersIntoAvailable(): void {
    const map: Record<string, AvailableComponentBatch> = {};

    for (const batch of this.availableBatches) {
      const key = String(batch.batchNumber || '').trim();
      if (!key) {
        continue;
      }

      map[key] = batch;
    }

    for (const batch of this.batches) {
      const key = String(batch.batchNumber || '').trim();
      if (!key || map[key]) {
        continue;
      }

      map[key] = {
        batchNumber: key,
        expiryDate: batch.expiryDate,
        quantityReceived: Number(batch.quantity || 0),
        quantityAllocatedInOrder: 0,
        quantityAvailable: 0
      };
    }

    this.availableBatches = Object.values(map);
  }

  private navigateToLine(lineId: number): void {
    this.router.navigate(['/processes/production/component-batches', this.warehouseId, this.productionOrderId, lineId]);
  }

  private resetBatchForm(): void {
    this.editingBatchId = 0;
    this.batchForm.reset({
      batchNumber: '',
      quantity: null,
      expiryDate: null
    });
  }

  private toDateInputValue(value: any): string {
    const date = new Date(value || new Date());
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private toArray<T>(res: any): T[] {
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
    return err?.error?.message || err?.error?.detail || fallback;
  }
}
