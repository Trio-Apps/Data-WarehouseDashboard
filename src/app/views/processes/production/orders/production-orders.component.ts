import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  GridModule,
  FormModule,
  PaginationModule,
  TableModule,
  UtilitiesModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs/operators';
import { FinishedGoodItem, WarehouseOption, ProductionOrder } from '../Models/production.model';
import { ProductionService } from '../Services/production.service';

@Component({
  selector: 'app-production-orders',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ButtonDirective,
    FormModule,
    GridModule,
    PaginationModule,
    TableModule,
    UtilitiesModule,
    IconDirective
  ],
  templateUrl: './production-orders.component.html',
  styleUrl: './production-orders.component.scss'
})
export class ProductionOrdersComponent implements OnInit {
  form!: FormGroup;
  addOrderForm!: FormGroup;
  bulkOrderForm!: FormGroup;
  warehouseId = 0;
  orders: ProductionOrder[] = [];
  bulkFinishedGoods: FinishedGoodItem[] = [];
  allowedWarehouses: WarehouseOption[] = [];
  filteredOrders: ProductionOrder[] = [];
  paginatedOrders: ProductionOrder[] = [];
  showAddModal = false;
  showBulkAddModal = false;
  savingAddOrder = false;
  savingBulkOrders = false;
  loadingWarehouses = false;
  loadingBulkFinishedGoods = false;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  hasNext = false;
  hasPrevious = false;
  loading = true;
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private productionService: ProductionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = this.toDateInputValue(new Date());

    this.form = this.fb.group({
      status: [''],
      postingDate: [null],
      dueDate: [null],
      searchTerm: ['']
    });
    this.addOrderForm = this.fb.group({
      warehouseId: [null, [Validators.required, Validators.min(1)]],
      postingDate: [today, Validators.required],
      dueDate: [today, Validators.required],
      remarks: ['']
    });
    this.bulkOrderForm = this.fb.group({
      warehouseId: [null, [Validators.required, Validators.min(1)]],
      orders: this.fb.array([])
    });

    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.loadAllowedWarehouses();
  }

  get bulkOrdersArray(): FormArray {
    return this.bulkOrderForm.get('orders') as FormArray;
  }

  onBack(): void {
    this.router.navigate(['/processes/production/menu', this.warehouseId]);
  }

  onAddOrder(): void {
    if (this.allowedWarehouses.length === 0) {
      this.toastr.error('No accessible warehouses found for your user.', 'Permission');
      return;
    }

    this.resetAddOrderForm();
    this.showAddModal = true;
  }

  onGoToBulkPage(): void {
    this.router.navigate(['/processes/production/bulk', this.warehouseId]);
  }

  onAddBulkOrder(): void {
    if (this.allowedWarehouses.length === 0) {
      this.toastr.error('No accessible warehouses found for your user.', 'Permission');
      return;
    }

    this.resetBulkOrderForm();
    this.showBulkAddModal = true;
  }

  onOpen(order: ProductionOrder): void {
    this.router.navigate(['/processes/production/order-items', this.warehouseId, order.productionOrderId]);
  }

  onRefresh(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onAddModalVisibleChange(visible: boolean): void {
    this.showAddModal = visible;
    if (!visible && !this.savingAddOrder) {
      this.resetAddOrderForm();
    }
  }

  onBulkModalVisibleChange(visible: boolean): void {
    this.showBulkAddModal = visible;
    if (!visible && !this.savingBulkOrders) {
      this.resetBulkOrderForm();
    }
  }

  onBulkWarehouseChange(): void {
    const selectedWarehouseId = Number(this.bulkOrderForm.value.warehouseId || 0);
    if (!selectedWarehouseId || !this.isWarehouseAllowed(selectedWarehouseId)) {
      this.bulkFinishedGoods = [];
      this.bulkOrdersArray.controls.forEach((row) => {
        row.patchValue({ finishedGoodItemId: null }, { emitEvent: false });
      });
      return;
    }

    this.loadBulkFinishedGoods(selectedWarehouseId);
  }

  onCreateOrder(): void {
    if (this.savingAddOrder) {
      return;
    }

    if (this.addOrderForm.invalid) {
      this.addOrderForm.markAllAsTouched();
      this.toastr.error('Please complete warehouse, posting date and due date.', 'Validation');
      return;
    }

    const selectedWarehouseId = Number(this.addOrderForm.value.warehouseId || 0);
    if (!selectedWarehouseId || !this.isWarehouseAllowed(selectedWarehouseId)) {
      this.toastr.error('Warehouse is required.', 'Validation');
      return;
    }

    this.savingAddOrder = true;
    const payload = {
      postingDate: this.formatDateToISOString(this.addOrderForm.value.postingDate),
      dueDate: this.formatDateToISOString(this.addOrderForm.value.dueDate),
      remarks: this.addOrderForm.value.remarks || '',
      warehouseId: selectedWarehouseId
    };

    this.productionService.createProductionOrder(payload).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          if (this.isExplicitFailureResponse(res)) {
            this.savingAddOrder = false;
            this.toastr.error(
              this.extractError({ error: res }, 'Failed to create production order.'),
              'Error'
            );
            this.cdr.detectChanges();
            return;
          }

          this.warehouseId = selectedWarehouseId;
          this.savingAddOrder = false;
          this.showAddModal = false;
          this.toastr.success('Production order created successfully.', 'Success');
          this.resetAddOrderForm();
          this.currentPage = 1;
          this.router.navigate(['/processes/production/orders', this.warehouseId], { replaceUrl: true });
          this.loadOrders();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.savingAddOrder = false;
          const message = this.extractError(err, 'Failed to create production order.');
          if (message.toLowerCase().includes('access to this warehouse')) {
            this.toastr.error(`You don't have access to warehouse #${selectedWarehouseId}.`, 'Permission');
          } else {
            this.toastr.error(message, 'Error');
          }
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  onAddBulkRow(): void {
    const today = this.toDateInputValue(new Date());
    this.bulkOrdersArray.push(this.createBulkOrderRow(today));
  }

  onRemoveBulkRow(index: number): void {
    if (this.bulkOrdersArray.length <= 1) {
      this.toastr.warning('At least one order row is required.', 'Validation');
      return;
    }

    this.bulkOrdersArray.removeAt(index);
  }

  onCreateBulkOrders(): void {
    if (this.savingBulkOrders) {
      return;
    }

    if (this.bulkOrderForm.invalid || this.bulkOrdersArray.length === 0) {
      this.bulkOrderForm.markAllAsTouched();
      this.toastr.error('Please complete all required fields in bulk rows.', 'Validation');
      return;
    }

    const selectedWarehouseId = Number(this.bulkOrderForm.value.warehouseId || 0);
    if (!selectedWarehouseId || !this.isWarehouseAllowed(selectedWarehouseId)) {
      this.toastr.error('Warehouse is required.', 'Validation');
      return;
    }

    const payloads = this.bulkOrdersArray.controls.map((row) => {
      const value = row.value;
      return {
        finishedGoodItemId: Number(value.finishedGoodItemId || 0),
        plannedQuantity: Number(value.plannedQuantity || 0),
        batchNumber: String(value.batchNumber || '').trim(),
        batchQuantity: Number(value.batchQuantity || 0),
        expiryDate: value.expiryDate || null,
        postingDate: this.formatDateToISOString(value.postingDate),
        dueDate: this.formatDateToISOString(value.dueDate),
        remarks: value.remarks || '',
        warehouseId: selectedWarehouseId
      };
    });

    if (payloads.length === 0) {
      this.toastr.error('Add at least one order row.', 'Validation');
      return;
    }

    for (let i = 0; i < payloads.length; i++) {
      const row = payloads[i];
      if (!row.finishedGoodItemId || row.plannedQuantity <= 0) {
        this.toastr.error(`Row ${i + 1}: Item and quantity are required.`, 'Validation');
        return;
      }

      const hasBatchNumber = !!row.batchNumber;
      const hasBatchQuantity = row.batchQuantity > 0;
      if (hasBatchNumber !== hasBatchQuantity) {
        this.toastr.error(`Row ${i + 1}: Batch number and batch quantity must be filled together.`, 'Validation');
        return;
      }
    }

    this.savingBulkOrders = true;

    let createdCount = 0;
    const failedMessages: string[] = [];

    const processNext = (index: number): void => {
      if (index >= payloads.length) {
        this.savingBulkOrders = false;

        if (createdCount > 0) {
          this.warehouseId = selectedWarehouseId;
          this.showBulkAddModal = false;
          this.resetBulkOrderForm();
          this.currentPage = 1;
          this.router.navigate(['/processes/production/orders', this.warehouseId], { replaceUrl: true });
          this.loadOrders();
          this.toastr.success(`${createdCount} production order(s) created successfully.`, 'Success');
        }

        if (failedMessages.length > 0) {
          const first = failedMessages[0];
          const suffix = failedMessages.length > 1 ? ` (+${failedMessages.length - 1} more errors)` : '';
          this.toastr.error(`${first}${suffix}`, 'Bulk Create');
        }

        if (createdCount === 0 && failedMessages.length === 0) {
          this.toastr.warning('No orders were created.', 'Bulk Create');
        }

        this.cdr.detectChanges();
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

              const hasBatch = !!rowPayload.batchNumber && rowPayload.batchQuantity > 0;
              if (!hasBatch) {
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

  onDelete(order: ProductionOrder): void {
    if (!confirm(`Delete production order #${order.productionOrderId}?`)) {
      return;
    }

    this.productionService.deleteProductionOrder(order.productionOrderId).subscribe({
      next: () => {
        this.toastr.success('Production order deleted successfully.', 'Success');
        this.loadOrders();
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Failed to delete order.'), 'Error');
      }
    });
  }

  onSubmit(order: ProductionOrder): void {
    this.productionService.submitProductionOrder(order.productionOrderId).subscribe({
      next: () => {
        this.toastr.success('Production order submitted successfully.', 'Success');
        this.loadOrders();
      },
      error: (err) => {
        this.toastr.error(this.extractError(err, 'Submit failed.'), 'Error');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Draft':
        return 'badge bg-warning';
      case 'Processing':
        return 'badge bg-info';
      case 'Approved':
      case 'Completed':
      case 'Final':
        return 'badge bg-success';
      case 'Rejected':
      case 'PartiallyFailed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getDisplayStatus(order: ProductionOrder): string {
    const approvalStatus = String(order.approvalStatus || '').trim().toLowerCase();
    if (approvalStatus === 'approved') {
      return 'Approved';
    }
    if (approvalStatus === 'rejected') {
      return 'Rejected';
    }

    return String(order.status || '').trim() || 'Unknown';
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  onResetFilters(): void {
    this.form.reset({
      status: '',
      postingDate: null,
      dueDate: null,
      searchTerm: ''
    });
    this.currentPage = 1;
    this.applyFilter();
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (page < 1) {
      page = 1;
    }
    if (page > this.totalPages) {
      page = this.totalPages;
    }
    if (page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
  }

  onNextPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasNext) {
      this.onPageChange(this.currentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasPrevious) {
      this.onPageChange(this.currentPage - 1, event);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  private loadOrders(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.productionService.getProductionOrders(this.warehouseId, 1, 300)
      .pipe(
        timeout(15000)
      )
      .subscribe({
        next: (res: any) => {
          setTimeout(() => {
            if (this.isExplicitFailureResponse(res)) {
              this.orders = [];
              this.filteredOrders = [];
              this.paginatedOrders = [];
              this.totalItems = 0;
              this.totalPages = 0;
              this.hasNext = false;
              this.hasPrevious = false;
              this.loading = false;
              this.toastr.error(this.extractError({ error: res }, 'Failed to load production orders.'), 'Error');
              this.cdr.detectChanges();
              return;
            }

            const allOrders = this.toArray<any>(res).map((raw) => this.mapOrder(raw));
            this.orders = allOrders
              .filter((order) => Number(order.warehouseId) === this.warehouseId)
              .sort((a, b) => b.productionOrderId - a.productionOrderId);
            this.applyFilter();
            this.loading = false;
            this.cdr.detectChanges();
          }, 0);
        },
        error: (err) => {
          setTimeout(() => {
            this.orders = [];
            this.filteredOrders = [];
            this.paginatedOrders = [];
            this.totalItems = 0;
            this.totalPages = 0;
            this.hasNext = false;
            this.hasPrevious = false;
            this.loading = false;
            this.toastr.error(this.extractError(err, 'Failed to load production orders (timeout or network issue).'), 'Error');
            this.cdr.detectChanges();
          }, 0);
        }
      });
  }

  private applyFilter(): void {
    const formValue = this.form.value;
    const statusFilter = String(formValue.status || '').trim();
    const postingDateFilter = this.normalizeDate(formValue.postingDate);
    const dueDateFilter = this.normalizeDate(formValue.dueDate);
    const searchTerm = String(formValue.searchTerm || '').trim().toLowerCase();

    this.filteredOrders = this.orders.filter((order) => {
      const displayStatus = this.getDisplayStatus(order);

      if (statusFilter && displayStatus !== statusFilter) {
        return false;
      }

      if (postingDateFilter && this.normalizeDate(order.postingDate) !== postingDateFilter) {
        return false;
      }

      if (dueDateFilter && this.normalizeDate(order.dueDate) !== dueDateFilter) {
        return false;
      }

      if (searchTerm) {
        const matchesSearch =
          String(order.productionOrderId).includes(searchTerm) ||
          displayStatus.toLowerCase().includes(searchTerm) ||
          String(order.remarks || '').toLowerCase().includes(searchTerm);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });

    this.totalItems = this.filteredOrders.length;
    this.totalPages = this.totalItems > 0 ? Math.ceil(this.totalItems / this.itemsPerPage) : 0;

    if (this.totalPages === 0) {
      this.currentPage = 1;
      this.paginatedOrders = [];
      this.hasNext = false;
      this.hasPrevious = false;
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.updatePagination();
  }

  private updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(start, end);

    this.hasPrevious = this.currentPage > 1;
    this.hasNext = this.currentPage < this.totalPages;
  }

  private normalizeDate(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toArray<T>(res: any): T[] {
    if (Array.isArray(res?.data?.$values)) {
      return res.data.$values as T[];
    }

    if (Array.isArray(res?.Data?.$values)) {
      return res.Data.$values as T[];
    }

    if (Array.isArray(res?.data?.data?.$values)) {
      return res.data.data.$values as T[];
    }

    if (Array.isArray(res?.Data?.Data?.$values)) {
      return res.Data.Data.$values as T[];
    }

    if (Array.isArray(res?.data?.data?.data?.$values)) {
      return res.data.data.data.$values as T[];
    }

    if (Array.isArray(res?.data?.data)) {
      return res.data.data as T[];
    }

    if (Array.isArray(res?.Data?.Data?.Data)) {
      return res.Data.Data.Data as T[];
    }

    if (Array.isArray(res?.Data?.Data)) {
      return res.Data.Data as T[];
    }

    if (Array.isArray(res?.data)) {
      return res.data as T[];
    }

    if (Array.isArray(res?.Data)) {
      return res.Data as T[];
    }

    if (Array.isArray(res)) {
      return res as T[];
    }

    return [];
  }

  private toDateInputValue(value: any): string {
    const date = new Date(value || new Date());
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private resetAddOrderForm(): void {
    const today = this.toDateInputValue(new Date());
    const defaultWarehouseId = this.isWarehouseAllowed(this.warehouseId)
      ? this.warehouseId
      : (this.allowedWarehouses[0]?.warehouseId ?? null);

    this.addOrderForm.reset({
      warehouseId: defaultWarehouseId,
      postingDate: today,
      dueDate: today,
      remarks: ''
    });
  }

  private resetBulkOrderForm(): void {
    const today = this.toDateInputValue(new Date());
    const defaultWarehouseId = this.isWarehouseAllowed(this.warehouseId)
      ? this.warehouseId
      : (this.allowedWarehouses[0]?.warehouseId ?? null);

    this.bulkOrderForm.reset({
      warehouseId: defaultWarehouseId
    });

    this.bulkOrdersArray.clear();
    this.bulkOrdersArray.push(this.createBulkOrderRow(today));
    this.bulkFinishedGoods = [];

    if (defaultWarehouseId) {
      this.loadBulkFinishedGoods(defaultWarehouseId);
    }
  }

  private createBulkOrderRow(today: string): FormGroup {
    return this.fb.group({
      postingDate: [today, Validators.required],
      dueDate: [today, Validators.required],
      remarks: [''],
      finishedGoodItemId: [null, [Validators.required, Validators.min(1)]],
      plannedQuantity: [1, [Validators.required, Validators.min(0.000001)]],
      batchNumber: [''],
      batchQuantity: [null, [Validators.min(0.000001)]],
      expiryDate: [null]
    });
  }

  private loadBulkFinishedGoods(warehouseId: number): void {
    this.loadingBulkFinishedGoods = true;
    this.productionService.getFinishedGoodsByWarehouse(warehouseId, 1, 500)
      .pipe(timeout(10000))
      .subscribe({
        next: (res: any) => {
          this.bulkFinishedGoods = this.toArray<FinishedGoodItem>(res);
          this.loadingBulkFinishedGoods = false;

          const validItemIds = new Set(this.bulkFinishedGoods.map((x) => Number(x.itemId)));
          this.bulkOrdersArray.controls.forEach((row) => {
            const currentItemId = Number(row.value.finishedGoodItemId || 0);
            if (currentItemId > 0 && !validItemIds.has(currentItemId)) {
              row.patchValue({ finishedGoodItemId: null }, { emitEvent: false });
            }
          });
        },
        error: () => {
          this.bulkFinishedGoods = [];
          this.loadingBulkFinishedGoods = false;
        }
      });
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
        this.alignCurrentWarehouseWithAllowed();
      },
      error: (err) => {
        this.loadingWarehouses = false;
        this.toastr.error(this.extractError(err, 'Failed to load warehouses.'), 'Error');
      }
    });
  }

  private alignCurrentWarehouseWithAllowed(): void {
    if (this.allowedWarehouses.length === 0) {
      this.orders = [];
      this.filteredOrders = [];
      this.paginatedOrders = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.hasNext = false;
      this.hasPrevious = false;
      this.loading = false;
      this.toastr.error('You do not have access to any warehouse.', 'Permission');
      return;
    }

    if (!this.isWarehouseAllowed(this.warehouseId)) {
      this.warehouseId = this.allowedWarehouses[0].warehouseId;
      this.router.navigate(['/processes/production/orders', this.warehouseId], { replaceUrl: true });
    }

    this.currentPage = 1;
    setTimeout(() => this.loadOrders(), 0);
  }

  private isWarehouseAllowed(warehouseId: number): boolean {
    return this.allowedWarehouses.some((w) => Number(w.warehouseId) === Number(warehouseId));
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

  private extractProductionOrderId(res: any): number {
    const data = this.pickData<any>(res);

    return Number(
      this.readProp(data, 'productionOrderId', 'ProductionOrderId')
      ?? this.readProp(res, 'productionOrderId', 'ProductionOrderId')
      ?? 0
    );
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

  private isExplicitFailureResponse(res: any): boolean {
    const success = this.toNullableBoolean(this.readProp(res, 'success', 'Success'));
    return success === false;
  }

  private mapOrder(raw: any): ProductionOrder {
    return {
      productionOrderId: Number(this.readProp(raw, 'productionOrderId', 'ProductionOrderId') || 0),
      postingDate: String(this.readProp(raw, 'postingDate', 'PostingDate') || ''),
      dueDate: String(this.readProp(raw, 'dueDate', 'DueDate') || ''),
      remarks: String(this.readProp(raw, 'remarks', 'Remarks') || ''),
      status: this.normalizeStatus(this.readProp(raw, 'status', 'Status')),
      userId: String(this.readProp(raw, 'userId', 'UserId') || ''),
      warehouseId: Number(this.readProp(raw, 'warehouseId', 'WarehouseId') || 0),
      numberOfProductionItem: Number(this.readProp(raw, 'numberOfProductionItem', 'NumberOfProductionItem') || 0),
      approval: this.toNullableBoolean(this.readProp(raw, 'approval', 'Approval')) ?? false,
      approvalStatus: String(this.readProp(raw, 'approvalStatus', 'ApprovalStatus') || ''),
      canSubmit: this.toNullableBoolean(this.readProp(raw, 'canSubmit', 'CanSubmit')) ?? undefined
    };
  }

  private normalizeStatus(status: any): string {
    const raw = String(status ?? '').trim();
    const asNumber = Number(raw);
    if (!Number.isNaN(asNumber)) {
      switch (asNumber) {
        case 1: return 'Draft';
        case 2: return 'Processing';
        case 3: return 'Completed';
        case 4: return 'PartiallyFailed';
        default: return raw || 'Unknown';
      }
    }
    return raw || 'Unknown';
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
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }

    return null;
  }
}
