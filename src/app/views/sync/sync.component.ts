import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ButtonModule,
  CardModule,
  PaginationModule,
  TableModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../pages/Services/auth.service';
import { SapSyncResetService } from './Services/sap-sync-reset.service';
import {
  SapSyncEntityKey,
  SapSyncState
} from './Models/sap-sync-reset.model';

@Component({
  selector: 'app-sync',
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ButtonModule,
    PaginationModule,
    IconDirective,
    DatePipe
  ],
  templateUrl: './sync.component.html',
  styleUrl: './sync.component.scss',
})
export class SyncComponent implements OnInit {
  syncStates: SapSyncState[] = [];
  loading: boolean = true;
  resettingRowKeys: Set<string> = new Set<string>();

  // Permissions
  canViewSync: boolean = false;
  canEditSync: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

  // Expose Math to template
  Math = Math;

  private readonly entityDisplayMap: Record<SapSyncEntityKey, string> = {
    item: 'Item',
    warehouse: 'Warehouse',
    purchase: 'Purchase',
    count: 'Count',
    businessPartners: 'Business Partners',
    itemUomGroup: 'Item UoM Group',
    sales: 'Sales'
  };

  constructor(
    private syncService: SapSyncResetService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.checkPermissions();
  }

  ngOnInit(): void {
    if (!this.canViewSync) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadSyncStates();
  }

  private checkPermissions(): void {
    this.canViewSync = this.authService.hasPermission('Saps.Get');
    this.canEditSync = this.authService.hasPermission('Saps.Edit');
  }

  loadSyncStates(): void {
    if (!this.canViewSync) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.syncService.getCompanySyncState().subscribe({
      next: (res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        this.syncStates = rows
          .map((row) => this.normalizeRow(row))
          .sort((a, b) => {
            if (a.sapId !== b.sapId) {
              return a.sapId - b.sapId;
            }
            return this.getEntityDisplayName(a.entityName).localeCompare(this.getEntityDisplayName(b.entityName));
          });

        this.currentPage = 1;
        this.updatePaginationState();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading sync state:', err);
        this.syncStates = [];
        this.loading = false;
        this.updatePaginationState();
        const errorMessage = err?.error?.message || 'Failed to load sync state. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedSyncStates(): SapSyncState[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.syncStates.slice(start, start + this.itemsPerPage);
  }

  onResetSync(state: SapSyncState): void {
    if (!this.canEditSync) {
      this.toastr.error('You do not have permission to reset sync.', 'Access Denied');
      return;
    }

    if (!state.sapId || state.sapId <= 0) {
      this.toastr.error('Invalid SAP ID.', 'Error');
      return;
    }

    const entity = this.resolveEntityKey(state.entityName);
    if (!entity) {
      this.toastr.warning(`Entity "${state.entityName}" is not supported for reset.`, 'Warning');
      return;
    }

    const rowKey = this.getRowKey(state);
    if (this.resettingRowKeys.has(rowKey)) {
      return;
    }

    this.resettingRowKeys.add(rowKey);
    this.syncService.resetSyncByEntity(entity, state.sapId).subscribe({
      next: (res) => {
        this.resettingRowKeys.delete(rowKey);

        if (res?.success === false || res?.data === false) {
          this.toastr.error(res?.message || 'Failed to reset sync.', 'Error');
          this.cdr.detectChanges();
          return;
        }

        this.toastr.success(
          `${this.getEntityDisplayName(state.entityName)} sync reset successfully`,
          'Success'
        );
        this.loadSyncStates();
      },
      error: (err) => {
        console.error('Error resetting sync:', err);
        this.resettingRowKeys.delete(rowKey);
        const errorMessage = err?.error?.message || 'Failed to reset sync. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  isResetting(state: SapSyncState): boolean {
    return this.resettingRowKeys.has(this.getRowKey(state));
  }

  canResetRow(state: SapSyncState): boolean {
    return !!this.resolveEntityKey(state.entityName);
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    if (page === this.currentPage || this.totalPages === 0) {
      return;
    }

    this.currentPage = page;
    this.updatePaginationState();
    this.cdr.detectChanges();
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

  getEntityDisplayName(entityName: string): string {
    const entity = this.resolveEntityKey(entityName);
    if (!entity) {
      return entityName || 'Unknown';
    }

    return this.entityDisplayMap[entity];
  }

  getRowTrackId(state: SapSyncState, index: number): string {
    return `${this.getRowKey(state)}-${index}`;
  }

  private updatePaginationState(): void {
    this.totalItems = this.syncStates.length;
    this.totalPages = this.totalItems > 0 ? Math.ceil(this.totalItems / this.itemsPerPage) : 0;

    if (this.totalPages === 0) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.hasPrevious = this.totalPages > 0 && this.currentPage > 1;
    this.hasNext = this.totalPages > 0 && this.currentPage < this.totalPages;
  }

  private resolveEntityKey(entityName: string | null | undefined): SapSyncEntityKey | null {
    const normalized = (entityName || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, '');

    const entityMap: Record<string, SapSyncEntityKey> = {
      item: 'item',
      warehouse: 'warehouse',
      purchase: 'purchase',
      count: 'count',
      businesspartners: 'businessPartners',
      itemuomgroup: 'itemUomGroup',
      sales: 'sales'
    };

    return entityMap[normalized] || null;
  }

  private getRowKey(state: SapSyncState): string {
    return `${state.sapId}-${(state.entityName || '').toLowerCase()}`;
  }

  private normalizeRow(row: SapSyncState): SapSyncState {
    return {
      sapId: Number(row?.sapId) || 0,
      entityName: row?.entityName || '',
      lastSyncDate: row?.lastSyncDate || null,
      skip: row?.skip ?? null
    };
  }
}
