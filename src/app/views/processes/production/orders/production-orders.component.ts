import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { WarehouseOption, ProductionOrder } from '../Models/production.model';
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
  warehouseId = 0;
  orders: ProductionOrder[] = [];
  allowedWarehouses: WarehouseOption[] = [];
  filteredOrders: ProductionOrder[] = [];
  paginatedOrders: ProductionOrder[] = [];
  showAddModal = false;
  savingAddOrder = false;
  loadingWarehouses = false;

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

    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.loadAllowedWarehouses();
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

  onOpen(order: ProductionOrder): void {
    this.router.navigate(['/processes/production/order-form', this.warehouseId, order.productionOrderId]);
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
      next: () => {
        setTimeout(() => {
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

  onOpenComponents(order: ProductionOrder): void {
    this.router.navigate(
      ['/processes/production/order-form', this.warehouseId, order.productionOrderId],
      { fragment: 'components-section' }
    );
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
      case 'Completed':
      case 'Final':
        return 'badge bg-success';
      case 'PartiallyFailed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
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
            const allOrders = this.toArray<ProductionOrder>(res);
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
      if (statusFilter && String(order.status || '') !== statusFilter) {
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
          String(order.status || '').toLowerCase().includes(searchTerm) ||
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

  private loadAllowedWarehouses(): void {
    this.loadingWarehouses = true;
    this.productionService.getWarehouses().subscribe({
      next: (res: any) => {
        this.allowedWarehouses = this.toArray<WarehouseOption>(res).map((warehouse: any) => ({
          warehouseId: Number(warehouse.warehouseId ?? warehouse.WarehouseId ?? 0),
          warehouseName: String(warehouse.warehouseName ?? warehouse.WarehouseName ?? ''),
          sapId: Number(warehouse.sapId ?? warehouse.SapId ?? 0)
        }));

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
}
