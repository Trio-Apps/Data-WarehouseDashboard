import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormModule,
  GutterDirective,
  RowComponent
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs/operators';
import { FinishedGoodItem, WarehouseOption } from '../Models/production.model';
import { ProductionService } from '../Services/production.service';

@Component({
  selector: 'app-bulk-orders',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    GutterDirective,
    ButtonDirective,
    FormModule,
    IconDirective
  ],
  templateUrl: './bulk-orders.component.html',
  styleUrl: './bulk-orders.component.scss'
})
export class BulkOrdersComponent implements OnInit {
  bulkForm!: FormGroup;
  warehouseId = 0;

  allowedWarehouses: WarehouseOption[] = [];
  finishedGoods: FinishedGoodItem[] = [];

  loadingWarehouses = false;
  loadingItems = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private productionService: ProductionService
  ) {}

  ngOnInit(): void {
    this.bulkForm = this.fb.group({
      warehouseId: [null, [Validators.required]],
      orders: this.fb.array([])
    });

    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.loadAllowedWarehouses();
  }

  get ordersArray(): FormArray {
    return this.bulkForm.get('orders') as FormArray;
  }

  onBack(): void {
    const selectedWarehouseId = Number(this.bulkForm.value.warehouseId || this.warehouseId || 0);
    this.router.navigate(['/processes/production/orders', selectedWarehouseId || this.warehouseId || 0]);
  }

  onWarehouseChange(): void {
    const selectedWarehouseId = Number(this.bulkForm.value.warehouseId || 0);
    if (!selectedWarehouseId || !this.isWarehouseAllowed(selectedWarehouseId)) {
      this.finishedGoods = [];
      this.ordersArray.controls.forEach((row) => {
        row.patchValue({ finishedGoodItemId: null }, { emitEvent: false });
      });
      return;
    }

    this.warehouseId = selectedWarehouseId;
    this.loadFinishedGoods(selectedWarehouseId);
  }

  onAddRow(): void {
    this.ordersArray.push(this.createOrderRow(this.toDateInputValue(new Date())));
  }

  onRemoveRow(index: number): void {
    if (this.ordersArray.length <= 1) {
      this.toastr.warning('At least one row is required.', 'Validation');
      return;
    }

    this.ordersArray.removeAt(index);
  }

  onSaveAll(): void {
    if (this.saving) {
      return;
    }

    if (this.bulkForm.invalid || this.ordersArray.length === 0) {
      this.bulkForm.markAllAsTouched();
      this.toastr.error('Please complete all required fields.', 'Validation');
      return;
    }

    const selectedWarehouseId = Number(this.bulkForm.value.warehouseId || 0);
    if (!selectedWarehouseId || !this.isWarehouseAllowed(selectedWarehouseId)) {
      this.toastr.error('Warehouse is required.', 'Validation');
      return;
    }

    const payloads = this.ordersArray.controls.map((row) => {
      const value = row.value;
      const itemId = Number(value.finishedGoodItemId);
      const plannedQuantity = Number(value.plannedQuantity);
      const rawBatchQty = value.batchQuantity;
      const batchQuantity = rawBatchQty === null || rawBatchQty === '' ? 0 : Number(rawBatchQty);

      return {
        finishedGoodItemId: itemId,
        plannedQuantity,
        batchNumber: String(value.batchNumber || '').trim(),
        batchQuantity,
        expiryDate: value.expiryDate || null,
        postingDate: this.formatDateToISOString(value.postingDate),
        dueDate: this.formatDateToISOString(value.dueDate),
        remarks: value.remarks || '',
        warehouseId: selectedWarehouseId
      };
    });

    const batchManagedByItemId = new Map<number, boolean | undefined>(
      this.finishedGoods.map((item) => [
        Number(item.itemId),
        typeof item.isBatchManaged === 'boolean' ? item.isBatchManaged : undefined
      ])
    );

    for (let i = 0; i < payloads.length; i++) {
      const row = payloads[i];
      if (
        !Number.isFinite(row.finishedGoodItemId) ||
        row.finishedGoodItemId <= 0 ||
        !Number.isFinite(row.plannedQuantity) ||
        row.plannedQuantity <= 0
      ) {
        this.toastr.error(`Row ${i + 1}: Item and quantity are required.`, 'Validation');
        return;
      }

      const hasBatchNumber = !!row.batchNumber;
      const hasBatchQuantity = Number.isFinite(row.batchQuantity) && row.batchQuantity > 0;
      if (hasBatchNumber !== hasBatchQuantity) {
        this.toastr.error(`Row ${i + 1}: Batch number and batch quantity must be filled together.`, 'Validation');
        return;
      }

      const isBatchManaged = batchManagedByItemId.get(row.finishedGoodItemId);
      if ((hasBatchNumber || hasBatchQuantity) && isBatchManaged === false) {
        this.toastr.error(`Row ${i + 1}: Selected item is not batch-managed, so batch fields must be empty.`, 'Validation');
        return;
      }
    }

    this.saving = true;

    let createdCount = 0;
    const failedMessages: string[] = [];

    const processNext = (index: number): void => {
      if (index >= payloads.length) {
        this.saving = false;

        if (createdCount > 0) {
          this.toastr.success(`${createdCount} production order(s) created successfully.`, 'Success');
          this.router.navigate(['/processes/production/orders', selectedWarehouseId], { replaceUrl: true });
        }

        if (failedMessages.length > 0) {
          const first = failedMessages[0];
          const suffix = failedMessages.length > 1 ? ` (+${failedMessages.length - 1} more errors)` : '';
          this.toastr.error(`${first}${suffix}`, 'Bulk Create');
        }

        if (createdCount === 0 && failedMessages.length === 0) {
          this.toastr.warning('No orders were created.', 'Bulk Create');
        }

        return;
      }

      this.productionService.createProductionOrder(payloads[index]).subscribe({
        next: (orderRes: any) => {
          if (this.isExplicitFailureResponse(orderRes)) {
            failedMessages.push(
              `Row ${index + 1}: ${this.extractError({ error: orderRes }, 'Failed to create production order.')}`
            );
            processNext(index + 1);
            return;
          }

          const createdOrderId = this.extractProductionOrderId(orderRes);
          if (!createdOrderId) {
            failedMessages.push(`Row ${index + 1}: Order created but ID was not returned.`);
            processNext(index + 1);
            return;
          }

          const rowPayload = payloads[index];
          this.productionService.createProductionOrderItem({
            productionOrderId: createdOrderId,
            itemId: rowPayload.finishedGoodItemId,
            plannedQuantity: rowPayload.plannedQuantity
          }).subscribe({
            next: (itemRes: any) => {
              if (this.isExplicitFailureResponse(itemRes)) {
                failedMessages.push(
                  `Row ${index + 1}: ${this.extractError({ error: itemRes }, 'Failed to create production item.')}`
                );
                processNext(index + 1);
                return;
              }

              const isBatchManaged = batchManagedByItemId.get(rowPayload.finishedGoodItemId);
              const hasBatch = !!rowPayload.batchNumber && rowPayload.batchQuantity > 0;
              if (!hasBatch || isBatchManaged === false) {
                createdCount += 1;
                processNext(index + 1);
                return;
              }

              this.productionService.createProductionHeaderBatch({
                productionOrderId: createdOrderId,
                batchNumber: rowPayload.batchNumber,
                quantity: rowPayload.batchQuantity,
                expiryDate: rowPayload.expiryDate
              }).subscribe({
                next: (batchRes: any) => {
                  if (this.isExplicitFailureResponse(batchRes)) {
                    failedMessages.push(
                      `Row ${index + 1}: ${this.extractError({ error: batchRes }, 'Failed to create production batch.')}`
                    );
                  } else {
                    createdCount += 1;
                  }
                  processNext(index + 1);
                },
                error: (batchErr) => {
                  failedMessages.push(
                    `Row ${index + 1}: ${this.extractError(batchErr, 'Failed to create production batch.')}`
                  );
                  processNext(index + 1);
                }
              });
            },
            error: (itemErr) => {
              failedMessages.push(
                `Row ${index + 1}: ${this.extractError(itemErr, 'Failed to create production item.')}`
              );
              processNext(index + 1);
            }
          });
        },
        error: (err) => {
          failedMessages.push(
            `Row ${index + 1}: ${this.extractError(err, 'Failed to create production order.')}`
          );
          processNext(index + 1);
        }
      });
    };

    processNext(0);
  }

  private loadAllowedWarehouses(): void {
    this.loadingWarehouses = true;
    this.productionService.getWarehouses().subscribe({
      next: (res: any) => {
        this.allowedWarehouses = this.toArray<any>(res)
          .map((warehouse) => ({
            warehouseId: Number(this.readProp(warehouse, 'warehouseId', 'WarehouseId') || 0),
            warehouseName: String(this.readProp(warehouse, 'warehouseName', 'WarehouseName') || ''),
            sapId: Number(this.readProp(warehouse, 'sapId', 'SapId') || 0)
          }))
          .filter((warehouse) => warehouse.warehouseId > 0);

        this.loadingWarehouses = false;
        this.alignWarehouseAndInitRows();
      },
      error: (err) => {
        this.loadingWarehouses = false;
        this.toastr.error(this.extractError(err, 'Failed to load warehouses.'), 'Error');
      }
    });
  }

  private alignWarehouseAndInitRows(): void {
    if (this.allowedWarehouses.length === 0) {
      this.toastr.error('You do not have access to any warehouse.', 'Permission');
      this.router.navigate(['/processes/production/menu']);
      return;
    }

    if (!this.isWarehouseAllowed(this.warehouseId)) {
      this.warehouseId = this.allowedWarehouses[0].warehouseId;
    }

    const today = this.toDateInputValue(new Date());
    this.bulkForm.patchValue({ warehouseId: this.warehouseId });
    this.ordersArray.clear();
    this.ordersArray.push(this.createOrderRow(today));
    this.loadFinishedGoods(this.warehouseId);
  }

  private loadFinishedGoods(warehouseId: number): void {
    this.loadingItems = true;
    this.productionService.getFinishedGoodsByWarehouse(warehouseId, 1, 500)
      .pipe(timeout(10000))
      .subscribe({
        next: (res: any) => {
          this.finishedGoods = this.toArray<any>(res).map((item) => this.mapFinishedGoodItem(item));
          this.loadingItems = false;

          const validItemIds = new Set(this.finishedGoods.map((x) => Number(x.itemId)));
          this.ordersArray.controls.forEach((row) => {
            const currentItemId = Number(row.value.finishedGoodItemId || 0);
            if (currentItemId > 0 && !validItemIds.has(currentItemId)) {
              row.patchValue({ finishedGoodItemId: null }, { emitEvent: false });
            }
            this.syncBatchFieldsState(row as FormGroup);
          });
        },
        error: () => {
          this.finishedGoods = [];
          this.loadingItems = false;
        }
      });
  }

  private createOrderRow(today: string): FormGroup {
    const row = this.fb.group({
      postingDate: [today, Validators.required],
      dueDate: [today, Validators.required],
      remarks: [''],
      finishedGoodItemId: [null, [Validators.required]],
      plannedQuantity: [1, [Validators.required]],
      batchNumber: [''],
      batchQuantity: [null],
      expiryDate: [null]
    });

    row.get('finishedGoodItemId')?.valueChanges.subscribe(() => {
      this.syncBatchFieldsState(row);
    });

    this.syncBatchFieldsState(row);
    return row;
  }

  onFinishedGoodChange(index: number): void {
    const row = this.ordersArray.at(index) as FormGroup | null;
    if (!row) {
      return;
    }

    this.syncBatchFieldsState(row);
  }

  private isWarehouseAllowed(warehouseId: number): boolean {
    return this.allowedWarehouses.some((w) => Number(w.warehouseId) === Number(warehouseId));
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

  private extractProductionOrderId(res: any): number {
    const data = this.pickData<any>(res);
    return Number(
      this.readProp(data, 'productionOrderId', 'ProductionOrderId')
      ?? this.readProp(res, 'productionOrderId', 'ProductionOrderId')
      ?? 0
    );
  }

  private isExplicitFailureResponse(res: any): boolean {
    const success = this.toNullableBoolean(this.readProp(res, 'success', 'Success'));
    return success === false;
  }

  private toArray<T>(res: any): T[] {
    if (Array.isArray(res?.data?.$values)) return res.data.$values as T[];
    if (Array.isArray(res?.Data?.$values)) return res.Data.$values as T[];
    if (Array.isArray(res?.data?.data?.$values)) return res.data.data.$values as T[];
    if (Array.isArray(res?.Data?.Data?.$values)) return res.Data.Data.$values as T[];
    if (Array.isArray(res?.data?.data?.data?.$values)) return res.data.data.data.$values as T[];
    if (Array.isArray(res?.data?.data)) return res.data.data as T[];
    if (Array.isArray(res?.Data?.Data?.Data)) return res.Data.Data.Data as T[];
    if (Array.isArray(res?.Data?.Data)) return res.Data.Data as T[];
    if (Array.isArray(res?.data)) return res.data as T[];
    if (Array.isArray(res?.Data)) return res.Data as T[];
    if (Array.isArray(res)) return res as T[];
    return [];
  }

  private pickData<T>(res: any): T {
    if (res?.data?.data?.data) return res.data.data.data as T;
    if (res?.data?.data) return res.data.data as T;
    if (res?.data) return res.data as T;
    if (res?.Data?.Data?.Data) return res.Data.Data.Data as T;
    if (res?.Data?.Data) return res.Data.Data as T;
    if (res?.Data) return res.Data as T;
    return res as T;
  }

  private readProp(obj: any, ...keys: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }
    return undefined;
  }

  private toNullableBoolean(value: any): boolean | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
    return null;
  }

  private extractError(err: any, fallback: string): string {
    const body = err?.error;

    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    if (Array.isArray(body?.errors) && body.errors.length > 0) return String(body.errors[0]);

    if (body?.errors && typeof body.errors === 'object') {
      const firstKey = Object.keys(body.errors)[0];
      if (firstKey && Array.isArray(body.errors[firstKey]) && body.errors[firstKey].length > 0) {
        return String(body.errors[firstKey][0]);
      }
    }

    return fallback;
  }

  private mapFinishedGoodItem(item: any): FinishedGoodItem {
    return {
      itemId: Number(this.readProp(item, 'itemId', 'ItemId') || 0),
      itemCode: String(this.readProp(item, 'itemCode', 'ItemCode') || ''),
      itemName: String(this.readProp(item, 'itemName', 'ItemName') || ''),
      warehouseId: Number(this.readProp(item, 'warehouseId', 'WarehouseId') || 0),
      warehouseCode: String(this.readProp(item, 'warehouseCode', 'WarehouseCode') || ''),
      inStock: Number(this.readProp(item, 'inStock', 'InStock') || 0),
      minStock: Number(this.readProp(item, 'minStock', 'MinStock') || 0),
      isBatchManaged: this.toNullableBoolean(
        this.readProp(
          item,
          'isBatchManaged',
          'IsBatchManaged',
          'batchManaged',
          'BatchManaged',
          'isBatches',
          'IsBatches',
          'batchNumbers',
          'BatchNumbers',
          'manBtchNum',
          'ManBtchNum'
        )
      ) ?? undefined
    };
  }

  private syncBatchFieldsState(row: FormGroup): void {
    const itemId = Number(row.get('finishedGoodItemId')?.value || 0);
    const isBatchManaged = this.finishedGoods.find((item) => Number(item.itemId) === itemId)?.isBatchManaged;

    const batchNumberControl = row.get('batchNumber');
    const batchQuantityControl = row.get('batchQuantity');
    const expiryDateControl = row.get('expiryDate');

    if (!batchNumberControl || !batchQuantityControl || !expiryDateControl) {
      return;
    }

    if (isBatchManaged === false) {
      batchNumberControl.patchValue('', { emitEvent: false });
      batchQuantityControl.patchValue(null, { emitEvent: false });
      expiryDateControl.patchValue(null, { emitEvent: false });

      batchNumberControl.disable({ emitEvent: false });
      batchQuantityControl.disable({ emitEvent: false });
      expiryDateControl.disable({ emitEvent: false });
      return;
    }

    batchNumberControl.enable({ emitEvent: false });
    batchQuantityControl.enable({ emitEvent: false });
    expiryDateControl.enable({ emitEvent: false });
  }
}
