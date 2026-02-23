import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { DashboardHomeInfo, DashboardSyncResponse } from './Models/dashboard.model';

interface ModuleTile {
  title: string;
  description: string;
  icon: string;
  iconClass: string;
  route?: string;
  permissions?: string[];
  disabled?: boolean;
  isAuthorized?: boolean;
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
export class DashboardComponent implements OnInit {
  userDisplayName = 'User';
  connectedDatabase = '';
  lastSyncAt: string | null = null;
  syncing = false;
  loadingHome = false;

  moduleTiles: ModuleTile[] = [
    {
      title: 'Master Data',
      description: 'Core items and catalogs',
      icon: 'cilLayers',
      iconClass: 'icon-emerald',
      route: '/items/items',
      permissions: ['Items.Get']
    },
    {
      title: 'Purchasing',
      description: 'Purchase orders & receipts',
      icon: 'cilBasket',
      iconClass: 'icon-green',
      route: '/inquiries/processes-inquiry',
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Outbound Deliveries',
      description: 'Sales & deliveries flow',
      icon: 'cilShareBoxed',
      iconClass: 'icon-blue',
      route: '/inquiries/processes-inquiry',
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Production',
      description: 'Manufacturing processes',
      icon: 'cilTask',
      iconClass: 'icon-orange',
      disabled: true,
      permissions: ['Warehouses.Get']
    },
    {
      title: 'Inventory',
      description: 'Stock visibility & checks',
      icon: 'cilGrid',
      iconClass: 'icon-mint',
      route: '/inquiries/items-inquiry',
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
      disabled: true
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setUserDisplayName();
    this.loadHomeInfo();
    this.loadSelectedDatabase();
    this.applyAuthorization();
  }

  get visibleModuleTiles(): ModuleTile[] {
    return this.moduleTiles.filter((tile) => tile.isAuthorized);
  }

  onModuleClick(tile: ModuleTile): void {
    if (!tile.isAuthorized || tile.disabled || !tile.route) {
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

  private isModuleAuthorized(tile: ModuleTile, currentPermissions: string[]): boolean {
    if (currentPermissions.length === 0) {
      return true;
    }
    if (!tile.permissions || tile.permissions.length === 0) {
      return true;
    }
    return this.authService.hasAnyPermission(tile.permissions);
  }
}
