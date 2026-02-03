import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableModule, CardModule, ButtonModule, FormModule, GridModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../pages/Services/auth.service';
import { CompaniesService } from '../../companies/Services/companies.service';
import { Company } from '../../companies/Models/company.model';
import { RolesService } from '../../roles/Services/roles.service';
import { Role } from '../../roles/Models/role.model';
import { ApprovalService } from './Services/approval.service';
import {
  AddApprovalStepDto,
  ApprovalStepDto,
  UpdateApprovalStepDto
} from './Models/approval-model';
import { ApprovalFormComponent } from './approval-form/approval-form.component';

@Component({
  selector: 'app-approval-process',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    ApprovalFormComponent
  ],
  templateUrl: './approval-process.component.html',
  styleUrl: './approval-process.component.scss',
})
export class ApprovalProcessComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  approvalSteps: ApprovalStepDto[] = [];
  filteredApprovalSteps: ApprovalStepDto[] = [];
  roles: Role[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

  // Modal state
  showStepModal: boolean = false;
  selectedStep: ApprovalStepDto | null = null;
  isEditMode: boolean = false;
  modalLoading: boolean = false;

  // Search filters
  searchCompanyId: number | null = null;
  searchStepName: string = '';
  searchRoleId: string = '';
  searchIsActive: boolean | null = null;

  // Companies for search
  companies: Company[] = [];
  loadingCompanies: boolean = false;
  loadingRoles: boolean = false;
  isSuperAdmin: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private approvalService: ApprovalService,
    private rolesService: RolesService,
    private authService: AuthService,
    private companiesService: CompaniesService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.isSuperAdmin = this.authService.hasRole('super-admin');
    this.form = this.fb.group({
      searchCompanyId: [null],
      searchStepName: [''],
      searchRoleId: [''],
      searchIsActive: [null]
    });
  }

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.loadCompanies();
    }
    this.loadRoles();

    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;

      this.loadApprovalSteps();
    });
 
 
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadCompanies(): void {
    this.loadingCompanies = true;
    this.companiesService.getCompanies(1, 1000).subscribe({
      next: (res: any) => {
        if (res.data && res.data.data) {
          this.companies = res.data.data;
        }
        this.loadingCompanies = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading companies:', err);
        this.loadingCompanies = false;
        this.companies = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadRoles(): void {
    this.loadingRoles = true;
    this.rolesService.getAllRoles().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.roles = res.data;
        } else if (res.data?.data) {
          this.roles = res.data.data;
        }

      // ❗ استبعاد super-admin
      this.roles = this.roles.filter(
        role => role.roleName !== 'super-admin');
        this.loadingRoles = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.loadingRoles = false;
        this.roles = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadApprovalSteps(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.approvalService.getApprovalSteps(
      this.currentPage,
      this.itemsPerPage,
      // this.searchCompanyId,
      // this.searchStepName,
      // this.searchRoleId,
      // this.searchIsActive
    ).subscribe({
      next: (res: any) => {
        if (res.data) {
          console.log('Approval Steps Response:', res);
          this.approvalSteps = res.data.data || [];
          this.filteredApprovalSteps = this.approvalSteps;

          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;

          if (this.approvalSteps.length > 0) {
            this.toastr.success(`Loaded ${this.approvalSteps.length} approval step(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading approval steps:', err);
        this.loading = false;
        this.approvalSteps = [];
        this.filteredApprovalSteps = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load approval steps. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedSteps(): ApprovalStepDto[] {
    return this.filteredApprovalSteps;
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

  onSearch(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const formValue = this.form.value;
    this.searchCompanyId = formValue.searchCompanyId || null;
    this.searchStepName = formValue.searchStepName || '';
    this.searchRoleId = formValue.searchRoleId || '';
    this.searchIsActive =
      formValue.searchIsActive !== null && formValue.searchIsActive !== undefined
        ? formValue.searchIsActive
        : null;

    if (this.searchCompanyId || this.searchStepName || this.searchRoleId || this.searchIsActive !== null) {
      this.toastr.info('Searching approval steps...', 'Info');
    }

    this.currentPage = 1;
    this.loadApprovalSteps();
  }

  onAddStepClick(): void {
    this.selectedStep = null;
    this.isEditMode = false;
    this.showStepModal = true;
  }

  onEditStep(step: ApprovalStepDto): void {
    this.selectedStep = { ...step };
    this.isEditMode = true;
    this.showStepModal = true;
  }

  onSaveStep(stepData: AddApprovalStepDto | UpdateApprovalStepDto): void {
    this.modalLoading = true;
    this.cdr.detectChanges();

    if (this.isEditMode && 'approvalStepId' in stepData) {
      this.onUpdateStep(stepData);
    } else {
      this.onAddStep(stepData as AddApprovalStepDto);
    }
  }

  onCancelStepModal(): void {
    this.showStepModal = false;
    this.selectedStep = null;
    this.isEditMode = false;
  }

  onAddStep(stepData: AddApprovalStepDto): void {
    this.approvalService.createApprovalStep(stepData).subscribe({
      next: () => {
        this.toastr.success('Approval step created successfully', 'Success');
        this.modalLoading = false;
        this.showStepModal = false;
        this.loadApprovalSteps();
      },
      error: (err) => {
        console.error('Error creating approval step:', err);
        this.modalLoading = false;
        const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error creating approval step.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  onUpdateStep(stepData: UpdateApprovalStepDto): void {
    this.approvalService.updateApprovalStep(stepData).subscribe({
      next: () => {
        this.toastr.success('Approval step updated successfully', 'Success');
        this.modalLoading = false;
        this.showStepModal = false;
        this.loadApprovalSteps();
      },
      error: (err) => {
        console.error('Error updating approval step:', err);
        this.modalLoading = false;
        const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error updating approval step.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  onDeleteStep(step: ApprovalStepDto): void {
    if (confirm(`Are you sure you want to delete step: ${step.stepName}?`)) {
      this.approvalService.deleteApprovalStep(step.approvalStepId).subscribe({
        next: () => {
          this.toastr.success(`Step "${step.stepName}" deleted successfully`, 'Success');
          this.loadApprovalSteps();
        },
        error: (err) => {
          console.error('Error deleting approval step:', err);
          const errorMessage = err.error?.message || 'Error deleting approval step. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }
}
