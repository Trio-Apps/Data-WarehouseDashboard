import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective, CardBodyComponent, CardComponent, CardHeaderComponent, FormModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { WarehouseOption } from '../Models/stock-counting.model';
import { StockCountingService } from '../Services/stock-counting.service';

@Component({
  selector: 'app-stock-counting-menu',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    FormModule,
    IconDirective
  ],
  templateUrl: './stock-counting-menu.component.html',
  styleUrl: './stock-counting-menu.component.scss'
})
export class StockCountingMenuComponent implements OnInit {
  loading = false;
  warehouses: WarehouseOption[] = [];

  form = this.fb.group({
    warehouseId: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private stockService: StockCountingService
  ) {}

  ngOnInit(): void {
    this.loadWarehouses();
  }

  get selectedWarehouseId(): number {
    return Number(this.form.get('warehouseId')?.value || 0);
  }

  onCreateOrder(): void {
    if (!this.selectedWarehouseId) {
      this.toastr.error('Please select warehouse first.', 'Validation');
      return;
    }

    this.router.navigate(['/processes/stock-counting/order-form', this.selectedWarehouseId]);
  }

  onViewOrders(): void {
    if (!this.selectedWarehouseId) {
      this.toastr.error('Please select warehouse first.', 'Validation');
      return;
    }

    this.router.navigate(['/processes/stock-counting/orders', this.selectedWarehouseId]);
  }

  private loadWarehouses(): void {
    this.loading = true;
    const routeWarehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);

    this.stockService.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses = this.toArray<WarehouseOption>(res).map((warehouse: any) => ({
          warehouseId: Number(warehouse.warehouseId ?? warehouse.WarehouseId ?? 0),
          warehouseName: String(warehouse.warehouseName ?? warehouse.WarehouseName ?? '')
        }));

        if (this.warehouses.length === 0) {
          this.toastr.error('You do not have access to any warehouse.', 'Permission');
        }

        const selected = this.warehouses.find((w) => w.warehouseId === routeWarehouseId)?.warehouseId
          ?? this.warehouses[0]?.warehouseId
          ?? null;

        this.form.patchValue({ warehouseId: selected });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(this.extractError(err, 'Failed to load warehouses.'), 'Error');
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
