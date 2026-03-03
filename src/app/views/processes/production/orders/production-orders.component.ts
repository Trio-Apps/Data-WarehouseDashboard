import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  FormModule,
  TableModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { ProductionOrder } from '../Models/production.model';
import { ProductionService } from '../Services/production.service';

@Component({
  selector: 'app-production-orders',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    FormModule,
    TableModule,
    IconDirective
  ],
  templateUrl: './production-orders.component.html',
  styleUrl: './production-orders.component.scss'
})
export class ProductionOrdersComponent implements OnInit {
  warehouseId = 0;
  orders: ProductionOrder[] = [];
  searchTerm = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private productionService: ProductionService
  ) {}

  ngOnInit(): void {
    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.loadOrders();
  }

  onBack(): void {
    this.router.navigate(['/processes/production/menu', this.warehouseId]);
  }

  onAddOrder(): void {
    this.router.navigate(['/processes/production/order-form', this.warehouseId]);
  }

  onOpen(order: ProductionOrder): void {
    this.router.navigate(['/processes/production/order-form', this.warehouseId, order.productionOrderId]);
  }

  onRefresh(): void {
    this.loadOrders();
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
        return 'badge bg-success';
      case 'PartiallyFailed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  get filteredOrders(): ProductionOrder[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.orders;
    }

    return this.orders.filter((order) => {
      return (
        String(order.productionOrderId).includes(term) ||
        String(order.status || '').toLowerCase().includes(term) ||
        String(order.remarks || '').toLowerCase().includes(term)
      );
    });
  }

  private loadOrders(): void {
    this.loading = true;

    this.productionService.getProductionOrders(1, 300).subscribe({
      next: (res: any) => {
        const allOrders = this.toArray<ProductionOrder>(res);
        this.orders = allOrders
          .filter((order) => Number(order.warehouseId) === this.warehouseId)
          .sort((a, b) => b.productionOrderId - a.productionOrderId);

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.orders = [];
        this.toastr.error(this.extractError(err, 'Failed to load production orders.'), 'Error');
      }
    });
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

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.detail || fallback;
  }
}
