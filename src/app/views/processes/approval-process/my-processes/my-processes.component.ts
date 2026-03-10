import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableModule, CardModule, ButtonModule, GridModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { ApprovalService } from '../Services/approval.service';
import { ProcessApproval } from '../Models/approval-model';
import { AuthService } from '../../../pages/Services/auth.service';

@Component({
  selector: 'app-my-processes',
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ButtonModule,
    GridModule,
    IconDirective
  ],
  templateUrl: './my-processes.component.html',
  styleUrl: './my-processes.component.scss',
})
export class MyProcessesComponent implements OnInit, OnDestroy {
  approvals: ProcessApproval[] = [];
  filteredApprovals: ProcessApproval[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

  // Expose Math to template
  Math = Math;

  canViewMyApprovals: boolean = false;
  canActionApprovals: boolean = false;

  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private approvalService: ApprovalService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.checkPermissions();
  }

  checkPermissions(): void {
    this.canViewMyApprovals = this.authService.hasPermission('Approvals.GetMy');
    this.canActionApprovals = this.authService.hasPermission('Approvals.Action');
  }

  ngOnInit(): void {
    if (!this.canViewMyApprovals) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;

      this.loadMyApprovals();
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadMyApprovals(): void {
    if (!this.canViewMyApprovals) {
      this.loading = false;
      this.approvals = [];
      this.filteredApprovals = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.hasNext = false;
      this.hasPrevious = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.approvalService.getMyProcessApprovals(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.approvals = res.data.data || [];
          this.filteredApprovals = this.approvals;

          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;

          if (this.approvals.length > 0) {
            this.toastr.success(`Loaded ${this.approvals.length} approval(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading approvals:', err);
        this.loading = false;
        this.approvals = [];
        this.filteredApprovals = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load approvals. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedApprovals(): ProcessApproval[] {
    return this.filteredApprovals;
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.loading = true;
    this.cdr.detectChanges();

    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;

    if (page !== this.currentPage) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          page: page,
          pageSize: this.itemsPerPage
        },
        queryParamsHandling: 'merge'
      });
    }
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

  goToProcess(approval: ProcessApproval): void {
    if (!this.canActionApprovals) {
      this.toastr.error('You do not have permission to take action on approvals.', 'Access Denied');
      return;
    }

    const processType = approval.processItemIsProgress?.processType || '';
    const referenceId = approval.processItemIsProgress?.referenceId;

    if (!referenceId) {
      this.toastr.warning('No reference ID found for this process.', 'Warning');
      return;
    }
//       
    switch (processType.toLowerCase()) {
      case 'sales':
        this.router.navigate(['/processes/sales/sales-items', referenceId]);
        break;
      case 'purchase':
      case 'purchases':
        this.router.navigate(['/processes/purchases/purchase-items', referenceId]);
        break;
     case 'receipt':
            this.router.navigate(['/processes/purchases/receipt-order', 0,referenceId]);
        break;

        case 'goodsreturn':
            this.router.navigate(['/processes/purchases/goods-return-order', 0, 0, referenceId]);
        break;
      case 'deliverynote':
        this.router.navigate(['/processes/sales/delivery-note-order', 0, referenceId]);
        break;
      case 'transferred':
      case 'transferredrequest':
      case 'transfer':
        this.router.navigate(['/processes/transferred-request/transferred-request-items', referenceId]);
        break;
      case 'transferredstock':
      case 'stocktransferred':
        this.router.navigate(['/processes/transferred-request/transferred-stock', 0, referenceId]);
        break;
      case 'quantityadjustmentstock':
      case 'quantityadjustment':
      case 'adjustmentstock':
      case 'countingadjustment':
        this.router.navigate([
          '/processes/quantity-adjustment-stock/quantity-adjustment-stock',
          referenceId
        ]);
        break;
    
        default:
        this.toastr.info(`No navigation defined for ${processType}.`, 'Info');
        break;
    }
  }

  get tableColumnCount(): number {
    return this.canActionApprovals ? 8 : 7;
  }
}
