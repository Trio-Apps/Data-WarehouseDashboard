import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { AuthService } from '../../../pages/Services/auth.service';
import { WarehouseOption } from '../Models/production.model';
import { ProductionService } from '../Services/production.service';

@Component({
  selector: 'app-production-menu',
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
  templateUrl: './production-menu.component.html',
  styleUrl: './production-menu.component.scss'
})
export class ProductionMenuComponent implements OnInit {
  form!: FormGroup;
  warehouses: WarehouseOption[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService,
    private productionService: ProductionService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      warehouseId: [null, [Validators.required, Validators.min(1)]]
    });

    this.loadWarehouses();
  }

  get selectedWarehouseId(): number {
    return Number(this.form.get('warehouseId')?.value || 0);
  }

  onCreateProduction(): void {
    if (!this.selectedWarehouseId) {
      this.toastr.error('Please select warehouse first.', 'Validation');
      return;
    }

    this.router.navigate(['/processes/production/order-form', this.selectedWarehouseId]);
  }

  onViewOrders(): void {
    if (!this.selectedWarehouseId) {
      this.toastr.error('Please select warehouse first.', 'Validation');
      return;
    }

    this.router.navigate(['/processes/production/orders', this.selectedWarehouseId]);
  }

  onBackToProcesses(): void {
    if (this.selectedWarehouseId) {
      this.router.navigate(['/inquiries/show-processes', this.selectedWarehouseId]);
      return;
    }

    this.router.navigate(['/inquiries/processes-inquiry']);
  }

  private loadWarehouses(): void {
    this.loading = true;
    const routeWarehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);

    this.productionService.getWarehouses().subscribe({
      next: (res: any) => {
        const list = this.toArray<WarehouseOption>(res).map((warehouse: any) => ({
          warehouseId: Number(warehouse.warehouseId ?? warehouse.WarehouseId ?? 0),
          warehouseName: String(warehouse.warehouseName ?? warehouse.WarehouseName ?? ''),
          sapId: Number(warehouse.sapId ?? warehouse.SapId ?? 0)
        }));

        const currentUserId = this.authService.getID();
        if (currentUserId) {
          this.loadUserDefaultWarehouse(currentUserId, list, routeWarehouseId);
          return;
        }

        this.warehouses = list;
        this.setPreferredWarehouse(routeWarehouseId);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(this.extractError(err, 'Failed to load warehouses.'), 'Error');
      }
    });
  }

  private loadUserDefaultWarehouse(userId: string, allWarehouses: WarehouseOption[], routeWarehouseId: number): void {
    this.productionService.getUserWarehouses(userId).subscribe({
      next: (res: any) => {
        const allowedWarehouseIds = new Set(
          this.toArray<any>(res).map((item: any) => Number(item.warehouseId ?? item.WarehouseId ?? 0))
        );

        this.warehouses = allWarehouses.filter((warehouse) => allowedWarehouseIds.has(warehouse.warehouseId));

        if (this.warehouses.length === 0) {
          this.warehouses = allWarehouses;
        }

        this.setPreferredWarehouse(routeWarehouseId);
        this.loading = false;
      },
      error: () => {
        this.warehouses = allWarehouses;
        this.setPreferredWarehouse(routeWarehouseId);
        this.loading = false;
      }
    });
  }

  private setPreferredWarehouse(routeWarehouseId: number): void {
    if (this.warehouses.length === 0) {
      this.form.patchValue({ warehouseId: null });
      return;
    }

    const fromRoute = this.warehouses.find((warehouse) => warehouse.warehouseId === routeWarehouseId);
    const selectedId = fromRoute?.warehouseId ?? this.warehouses[0].warehouseId;

    this.form.patchValue({ warehouseId: selectedId });
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
