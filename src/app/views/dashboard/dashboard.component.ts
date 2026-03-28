import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  GutterDirective,
  RowComponent,
  ButtonDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { AuthService } from '../pages/Services/auth.service';
import { SapAuthService } from '../settings/Auth/Services/sap-auth.service';
import { DashboardService } from './Services/dashboard.service';
import {
  DashboardHomeInfo,
  DashboardSyncResponse,
  DueTodayInventoryTask,
  DueTodayProductionOrder,
  DueTodaySummary,
  DueTodayTransferRequest
} from './Models/dashboard.model';


interface ModuleTile {
  title: string;
  description: string;
  icon: string;
  iconClass: string;
  route?: string;
  inquiryRoute?: 'show-items' | 'show-processes' | 'show-reports';
  processSection?: 'purchasing' | 'outbound' | 'production' | 'inventory';
  permissions?: string[];
  disabled?: boolean;
  isAuthorized?: boolean;
}

interface DueTodayTaskCard {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  metaLeftLabel: string;
  metaLeftValue: string;
  metaMiddleLabel: string;
  metaMiddleValue: string;
  metaRightLabel: string;
  metaRightValue: string;
  buttonText: string;
  routeCommands: string[] | null;
  category: 'all' | 'transfers' | 'production' | 'inventory';
}

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  imports: [
    CommonModule,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ColComponent,
    GutterDirective,
    ButtonDirective,
    DropdownComponent,
    DropdownToggleDirective,
    DropdownMenuDirective,
    DropdownItemDirective,
    DropdownDividerDirective,
    IconDirective
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  userDisplayName = 'User';
  connectedDatabase = '';
  lastSyncAt: string | null = null;
  syncing = false;
  loadingHome = false;
  warehouseId: number | null = null;
  dueTodaySummary: DueTodaySummary | null = null;
  loadingDueToday = false;
  selectedDueTodayTab: 'all' | 'transfers' | 'production' | 'inventory' = 'all';
  private queryParamsSubscription: any;

  moduleTiles: ModuleTile[] = [
    {
      title: 'Master Data',
      description: 'Core items and catalogs',
      icon: 'cilLayers',
      iconClass: 'icon-emerald',
      route: '/inquiries/items-inquiry',
      inquiryRoute: 'show-items',
      permissions: ['Items.Get']
    },
    {
      title: 'Purchasing',
      description: 'Purchase orders & receipts',
      icon: 'cilBasket',
      iconClass: 'icon-green',
      route: '/inquiries/processes-inquiry',
      inquiryRoute: 'show-processes',
      processSection: 'purchasing',
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Outbound Deliveries',
      description: 'Sales & deliveries flow',
      icon: 'cilShareBoxed',
      iconClass: 'icon-blue',
      route: '/inquiries/processes-inquiry',
      inquiryRoute: 'show-processes',
      processSection: 'outbound',
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Production',
      description: 'Manufacturing processes',
      icon: 'cilTask',
      iconClass: 'icon-orange',
      route: '/inquiries/processes-inquiry',
      inquiryRoute: 'show-processes',
      processSection: 'production',
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Inventory',
      description: 'Stock visibility & checks',
      icon: 'cilGrid',
      iconClass: 'icon-mint',
      route: '/inquiries/processes-inquiry',
      inquiryRoute: 'show-processes',
      processSection: 'inventory',
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Printing',
      description: 'Barcode labels & output',
      icon: 'cilPrint',
      iconClass: 'icon-purple',
      route: '/barcodes/barcodes',
      permissions: ['Items.Get']
    },
    {
      title: 'Reports',
      description: 'KPIs and analytics',
      icon: 'cilSpreadsheet',
      iconClass: 'icon-red',
      route: '/inquiries/processes-inquiry',
      inquiryRoute: 'show-reports',
      permissions: ['Reports.Get']
    },
    {
      title: 'Search & Scan',
      description: 'Search across all documents',
      icon: 'cilSearch',
      iconClass: 'icon-blue',
      route: '/processes/search-scan',
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Exporting',
      description: 'Share and export data',
      icon: 'cilCloudDownload',
      iconClass: 'icon-blue',
      disabled: true
    }
  ];

  constructor(
    private authService: AuthService,
    private sapAuthService: SapAuthService,
    private dashboardService: DashboardService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setUserDisplayName();
    this.loadHomeInfo();
    this.loadSelectedDatabase();
    this.applyAuthorization();

    // Watch for warehouse selection from other pages (via query params)
    this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
      const warehouseId = params['warehouseId'] ? Number(params['warehouseId']) : null;
      this.warehouseId = warehouseId && Number.isFinite(warehouseId) && warehouseId > 0 ? warehouseId : null;
      this.loadDueTodaySummary();
    });

    // Load due today summary immediately for the current route
    this.warehouseId = this.getWarehouseIdFromUrl();
    this.loadDueTodaySummary();
  }

  get visibleModuleTiles(): ModuleTile[] {
    return this.moduleTiles.filter((tile) => tile.isAuthorized);
  }

  onModuleClick(tile: ModuleTile): void {
    if (!tile.isAuthorized || tile.disabled || !tile.route) {
      return;
    }

    const warehouseId = this.getWarehouseIdFromUrl();

    if (tile.inquiryRoute === 'show-items') {
      if (warehouseId) {
        this.router.navigate(['/inquiries/show-items', warehouseId]);
      } else {
        this.router.navigate(['/inquiries/items-inquiry']);
      }
      return;
    }

    if (tile.inquiryRoute === 'show-processes') {
      if (warehouseId) {
        const processSectionRoute = this.getProcessSectionRoute(tile.processSection, warehouseId);
        if (processSectionRoute) {
          this.router.navigate(processSectionRoute);
          return;
        }
        this.router.navigate(['/inquiries/processes-inquiry']);
      } else {
        this.router.navigate(['/inquiries/processes-inquiry']);
      }
      return;
    }

    if (tile.inquiryRoute === 'show-reports') {
      if (warehouseId) {
        this.router.navigate(['/inquiries/show-reports', warehouseId]);
      } else {
        this.router.navigate(['/inquiries/processes-inquiry']);
      }
      return;
    }

    this.router.navigate([tile.route]);
  }

  onSyncData(): void {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    this.dashboardService.syncData().subscribe({
      next: (res: DashboardSyncResponse) => {
        this.lastSyncAt = res.lastSyncAt || new Date().toISOString();
        this.syncing = false;
      },
      error: () => {
        this.syncing = false;
      }
    });
  }

  onLogout(): void {
    this.authService.logOut();
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  private setUserDisplayName(): void {
    this.userDisplayName =
      this.authService.getUserName() ||
      this.authService.getName() ||
      this.authService.getEmail() ||
      'User';
  }

  private loadHomeInfo(): void {
    this.loadingHome = true;
    this.dashboardService.getHomeInfo().subscribe({
      next: (info: DashboardHomeInfo) => {
        if (info?.userName) {
          this.userDisplayName = info.userName;
        }
        if (info?.databaseName) {
          this.connectedDatabase = info.databaseName;
        }
        if (info?.lastSyncAt) {
          this.lastSyncAt = info.lastSyncAt;
        }
        this.loadingHome = false;
      },
      error: () => {
        this.loadingHome = false;
      }
    });
  }

  private loadSelectedDatabase(): void {
    this.sapAuthService.getSelectedSap().subscribe({
      next: (res: any) => {
        const selected = res?.data ?? res;
        const databaseName = selected?.companyDB || selected?.name || '';
        if (databaseName) {
          this.connectedDatabase = databaseName;
        }
      },
      error: () => {
        // Keep current value from home info or local storage.
      }
    });
  }

  private applyAuthorization(): void {
    const currentPermissions = this.authService.getPermissions();
    this.moduleTiles = this.moduleTiles.map((tile) => ({
      ...tile,
      isAuthorized: this.isModuleAuthorized(tile, currentPermissions)
    }));
  }

  private loadDueTodaySummary(): void {
    this.loadingDueToday = true;
    this.dueTodaySummary = null;

    this.dashboardService.getDueTodaySummary(this.warehouseId ?? undefined).subscribe({
      next: (summary: DueTodaySummary) => {
        this.dueTodaySummary = summary;
        this.loadingDueToday = false;
      },
      error: () => {
        this.loadingDueToday = false;
      }
    });
  }

  get dueTodayTasks(): DueTodayTaskCard[] {
    if (!this.dueTodaySummary) {
      return [];
    }

    const transferTasks = (this.dueTodaySummary.TransferRequests ?? []).map((task) =>
      this.mapTransferRequestTask(task)
    );
    const productionTasks = (this.dueTodaySummary.ProductionOrders ?? []).map((task) =>
      this.mapProductionOrderTask(task)
    );
    const inventoryTasks = (this.dueTodaySummary.InventoryTasks ?? []).map((task) =>
      this.mapInventoryTask(task)
    );
    const tasks = [...transferTasks, ...productionTasks, ...inventoryTasks];

    if (this.selectedDueTodayTab === 'all') {
      return tasks;
    }

    return tasks.filter((task) => task.category === this.selectedDueTodayTab);
  }

  private formatDateToQueryParam(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  openDueTodayTask(task: { routeCommands: string[] | null }): void {
    if (!task.routeCommands) {
      return;
    }

    this.router.navigate(task.routeCommands);
  }

  private mapTransferRequestTask(task: DueTodayTransferRequest): DueTodayTaskCard {
    return {
      id: `transfer-${task.TransferredRequestId}`,
      title: task.ReferenceNumber,
      subtitle: `${task.SourceWarehouseName || 'Unknown warehouse'} -> ${task.DestinationWarehouseName || 'Unknown warehouse'}`,
      badge: 'Transfer Request',
      metaLeftLabel: 'Submitted By',
      metaLeftValue: task.SubmittedBy || 'Unknown user',
      metaMiddleLabel: 'Submitted Date',
      metaMiddleValue: this.formatCardDate(task.SubmittedDate),
      metaRightLabel: 'Due Date',
      metaRightValue: this.formatCardDate(task.DueDate),
      buttonText: 'Open Request',
      routeCommands: ['/processes/transferred-request/transferred-request-items', `${task.TransferredRequestId}`],
      category: 'transfers'
    };
  }

  private mapProductionOrderTask(task: DueTodayProductionOrder): DueTodayTaskCard {
    return {
      id: `production-${task.ProductionOrderId}`,
      title: task.ReferenceNumber,
      subtitle: task.ItemName || 'Production order due today',
      badge: 'Production Order',
      metaLeftLabel: 'Qty',
      metaLeftValue: `${task.PlannedQuantity}`,
      metaMiddleLabel: 'Warehouse',
      metaMiddleValue: task.WarehouseName || `${task.WarehouseId}`,
      metaRightLabel: 'Due Date',
      metaRightValue: this.formatCardDate(task.DueDate),
      buttonText: 'Run Production',
      routeCommands: ['/processes/production/order-items', `${task.WarehouseId}`, `${task.ProductionOrderId}`],
      category: 'production'
    };
  }

  private mapInventoryTask(task: DueTodayInventoryTask): DueTodayTaskCard {
    return {
      id: `inventory-${task.QuantityAdjustmentStockId}`,
      title: task.ReferenceNumber,
      subtitle: task.ItemName || 'Inventory adjustment due today',
      badge: 'Inventory Counting Session',
      metaLeftLabel: 'Items',
      metaLeftValue: `${task.ItemCount}`,
      metaMiddleLabel: 'Warehouse',
      metaMiddleValue: task.WarehouseName || `${task.WarehouseId}`,
      metaRightLabel: 'Due Date',
      metaRightValue: this.formatCardDate(task.DueDate),
      buttonText: 'Open Session',
      routeCommands: ['/processes/quantity-adjustment-stock/quantity-adjustment-stock', `${task.QuantityAdjustmentStockId}`],
      category: 'inventory'
    };
  }

  private formatCardDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('en-GB');
  }

  private isModuleAuthorized(tile: ModuleTile, currentPermissions: string[]): boolean {
    if (currentPermissions.length === 0) {
      return true;
    }
    if (!tile.permissions || tile.permissions.length === 0) {
      return true;
    }
    return this.authService.hasAnyPermission(tile.permissions);
  }

  private getWarehouseIdFromUrl(): number | null {
    const rawWarehouseId = this.route.snapshot.queryParamMap.get('warehouseId');
    if (!rawWarehouseId) {
      return null;
    }

    const parsedWarehouseId = Number(rawWarehouseId);
    if (!Number.isFinite(parsedWarehouseId) || parsedWarehouseId <= 0) {
      return null;
    }

    return parsedWarehouseId;
  }

  private getProcessSectionRoute(
    section: ModuleTile['processSection'],
    warehouseId: number
  ): string[] | null {
    switch (section) {
      case 'purchasing':
        return ['/inquiries/show-purchasing-processes', `${warehouseId}`];
      case 'outbound':
        return ['/inquiries/show-outbound-processes', `${warehouseId}`];
      case 'production':
        return ['/inquiries/show-production-processes', `${warehouseId}`];
      case 'inventory':
        return ['/inquiries/show-inventory-processes', `${warehouseId}`];
      default:
        return null;
    }
  }
}
