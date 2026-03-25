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
  ProcessSettingApprovalDto,
  UpdateApprovalStepDto
} from './Models/approval-model';
import { ApprovalFormComponent } from './approval-form/approval-form.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationService } from 'src/app/core/i18n/translation.service';

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
    ApprovalFormComponent,
    TranslatePipe
  ],
  templateUrl: './approval-process.component.html',
  styleUrl: './approval-process.component.scss',
})
export class ApprovalProcessComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  approvalSteps: ApprovalStepDto[] = [];
  filteredApprovalSteps: ApprovalStepDto[] = [];
  selectedProcessSetting: ProcessSettingApprovalDto | null = null;
  processSettingId: number | null = null;
  roles: Role[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  togglingIgnoreSteps: boolean = false;

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
  canViewApprovalSteps: boolean = false;
  canCreateApprovalSteps: boolean = false;
  canEditApprovalSteps: boolean = false;
  canDeleteApprovalSteps: boolean = false;
  canViewCompanies: boolean = false;
  canViewRoles: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;
  private routeParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private approvalService: ApprovalService,
    private rolesService: RolesService,
    private authService: AuthService,
    private companiesService: CompaniesService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private translationService: TranslationService
  ) {
    this.checkPermissions();
    this.form = this.fb.group({
      searchCompanyId: [null],
      searchStepName: [''],
      searchRoleId: [''],
      searchIsActive: [null]
    });
  }

  checkPermissions(): void {
    this.canViewApprovalSteps = this.authService.hasPermission('ApprovalSteps.Get');
    this.canCreateApprovalSteps = this.authService.hasPermission('ApprovalSteps.Create');
    this.canEditApprovalSteps = this.authService.hasPermission('ApprovalSteps.Edit');
    this.canDeleteApprovalSteps = this.authService.hasPermission('ApprovalSteps.Delete');
    this.canViewCompanies = this.authService.hasPermission('Companys.Get');
    this.canViewRoles = this.authService.hasPermission('Roles.Get');
  }

  ngOnInit(): void {
    if (!this.canViewApprovalSteps) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    if (this.canViewCompanies) {
      this.loadCompanies();
    }
    if (this.canViewRoles) {
      this.loadRoles();
    }

    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.refreshPagination();
      this.cdr.detectChanges();
    });

    this.routeParamsSubscription = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id') || 0);
      this.processSettingId = id > 0 ? id : null;

      if (!this.processSettingId) {
        this.loading = false;
        this.selectedProcessSetting = null;
        this.approvalSteps = [];
        this.filteredApprovalSteps = [];
        this.refreshPagination();
        this.toastr.error('Invalid process setting id.', 'Error');
        this.cdr.detectChanges();
        return;
      }

      this.loadApprovalSteps();
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }

  loadCompanies(): void {
    if (!this.canViewCompanies) {
      this.loadingCompanies = false;
      this.companies = [];
      this.cdr.detectChanges();
      return;
    }

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
    if (!this.canViewRoles) {
      this.loadingRoles = false;
      this.roles = [];
      this.cdr.detectChanges();
      return;
    }

    this.loadingRoles = true;
    this.rolesService.getAllRoles().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.roles = res.data;
        } else if (res.data?.data) {
          this.roles = res.data.data;
        }

        this.roles = this.roles.filter(role => role.roleName !== 'super-admin');
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
    if (!this.canViewApprovalSteps || !this.processSettingId) {
      this.loading = false;
      this.selectedProcessSetting = null;
      this.approvalSteps = [];
      this.filteredApprovalSteps = [];
      this.refreshPagination();
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.approvalService.getProcessSettingById(this.processSettingId).subscribe({
      next: (res) => {
        const setting = this.extractProcessSetting(res);

        if (!setting) {
          this.selectedProcessSetting = null;
          this.approvalSteps = [];
          this.filteredApprovalSteps = [];
          this.refreshPagination();
          this.loading = false;
          this.toastr.error('Process setting not found.', 'Error');
          this.cdr.detectChanges();
          return;
        }

        this.selectedProcessSetting = setting;
        this.approvalSteps = [...(setting.approvalSteps || [])].sort((a, b) => a.stepOrder - b.stepOrder);
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading process setting details:', err);
        this.loading = false;
        this.selectedProcessSetting = null;
        this.approvalSteps = [];
        this.filteredApprovalSteps = [];
        this.refreshPagination();
        this.toastr.error('Failed to load process setting details. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private extractProcessSetting(
    response: ProcessSettingApprovalDto | { data: ProcessSettingApprovalDto } | any
  ): ProcessSettingApprovalDto | null {
    const payload = response?.data?.data ?? response?.data ?? response;
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (typeof payload.processSettingApprovalId !== 'number') {
      return null;
    }

    return payload as ProcessSettingApprovalDto;
  }

  private applyFilters(): void {
    const stepNameQuery = this.searchStepName.trim().toLowerCase();
    const roleQuery = this.searchRoleId.trim();
    const isActiveFilter = this.searchIsActive;

    this.filteredApprovalSteps = this.approvalSteps.filter(step => {
      const matchesStepName = !stepNameQuery || step.stepName.toLowerCase().includes(stepNameQuery);
      const matchesRole =
        !roleQuery || step.roleId === roleQuery || (step.roleName || '').toLowerCase().includes(roleQuery.toLowerCase());
      const matchesStatus = isActiveFilter === null || step.isActive === isActiveFilter;

      return matchesStepName && matchesRole && matchesStatus;
    });

    this.refreshPagination();
  }

  private refreshPagination(): void {
    this.totalItems = this.filteredApprovalSteps.length;
    this.totalPages = this.totalItems > 0 ? Math.ceil(this.totalItems / this.itemsPerPage) : 0;

    if (this.totalPages === 0) {
      this.currentPage = 1;
      this.hasNext = false;
      this.hasPrevious = false;
      return;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.hasNext = this.currentPage < this.totalPages;
    this.hasPrevious = this.currentPage > 1;
  }

  get paginatedSteps(): ApprovalStepDto[] {
    if (this.filteredApprovalSteps.length === 0) {
      return [];
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredApprovalSteps.slice(startIndex, endIndex);
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (this.totalPages === 0) {
      return;
    }

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
    if (!this.canViewApprovalSteps) {
      this.toastr.error('You do not have permission to view approval steps.', 'Access Denied');
      return;
    }

    const formValue = this.form.value;
    this.searchCompanyId = formValue.searchCompanyId || null;
    this.searchStepName = formValue.searchStepName || '';
    this.searchRoleId = formValue.searchRoleId || '';
    this.searchIsActive =
      formValue.searchIsActive !== null && formValue.searchIsActive !== undefined
        ? formValue.searchIsActive
        : null;

    this.currentPage = 1;
    this.applyFilters();
    this.cdr.detectChanges();
  }

  onToggleIgnoreSteps(): void {
    if (!this.selectedProcessSetting || !this.processSettingId) {
      return;
    }

    this.togglingIgnoreSteps = true;
    this.cdr.detectChanges();

    this.approvalService.toggleIgnoreSteps(this.processSettingId).subscribe({
      next: () => {
        if (this.selectedProcessSetting) {
          this.selectedProcessSetting = {
            ...this.selectedProcessSetting,
            ignoreSteps: !this.selectedProcessSetting.ignoreSteps
          };
        }
        this.togglingIgnoreSteps = false;
        this.toastr.success(
          this.translationService.translate('approvalProcess.messages.ignoreStepsUpdated'),
          this.translationService.translate('messages.success')
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error toggling ignore steps:', err);
        this.togglingIgnoreSteps = false;
        this.toastr.error(
          this.translationService.translate('approvalProcess.messages.ignoreStepsUpdateError'),
          this.translationService.translate('messages.error')
        );
        this.cdr.detectChanges();
      }
    });
  }

  goToProcessSettings(): void {
    this.router.navigate(['/processes/approval-process/approval-steps']);
  }

  onAddStepClick(): void {
    if (!this.canCreateApprovalSteps) {
      this.toastr.error(
        this.translationService.translate('approvalProcess.messages.permissionCreateDenied'),
        this.translationService.translate('messages.accessDenied')
      );
      return;
    }

    this.selectedStep = null;
    this.isEditMode = false;
    this.showStepModal = true;
  }

  onEditStep(step: ApprovalStepDto): void {
    if (!this.canEditApprovalSteps) {
      this.toastr.error(
        this.translationService.translate('approvalProcess.messages.permissionEditDenied'),
        this.translationService.translate('messages.accessDenied')
      );
      return;
    }

    this.selectedStep = { ...step };
    this.isEditMode = true;
    this.showStepModal = true;
  }

  onSaveStep(stepData: AddApprovalStepDto | UpdateApprovalStepDto): void {
   
    if (this.isEditMode && !this.canEditApprovalSteps) {
      this.toastr.error(
        this.translationService.translate('approvalProcess.messages.permissionEditDenied'),
        this.translationService.translate('messages.accessDenied')
      );
      return;
    }
    if (!this.isEditMode && !this.canCreateApprovalSteps) {
      this.toastr.error(
        this.translationService.translate('approvalProcess.messages.permissionCreateDenied'),
        this.translationService.translate('messages.accessDenied')
      );
      return;
    }

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
       console.log("step",stepData);

    if (!this.canCreateApprovalSteps) {
      this.toastr.error(
        this.translationService.translate('approvalProcess.messages.permissionCreateDenied'),
        this.translationService.translate('messages.accessDenied')
      );
      return;
    }

    this.approvalService.createApprovalStep(stepData).subscribe({
      next: () => {
        this.toastr.success(
          this.translationService.translate('approvalProcess.messages.createSuccess'),
          this.translationService.translate('messages.success')
        );
        this.modalLoading = false;
        this.showStepModal = false;
        this.loadApprovalSteps();
      },
      error: (err) => {
        console.error('Error creating approval step:', err);
        this.modalLoading = false;
        const errorMessage =
          err.error?.message ||
          err.error?.errors?.join(', ') ||
          this.translationService.translate('approvalProcess.messages.createError');
        this.toastr.error(errorMessage, this.translationService.translate('messages.error'));
      }
    });
  }

  onUpdateStep(stepData: UpdateApprovalStepDto): void {
    if (!this.canEditApprovalSteps) {
      this.toastr.error(
        this.translationService.translate('approvalProcess.messages.permissionEditDenied'),
        this.translationService.translate('messages.accessDenied')
      );
      return;
    }

    this.approvalService.updateApprovalStep(stepData).subscribe({
      next: () => {
        this.toastr.success(
          this.translationService.translate('approvalProcess.messages.updateSuccess'),
          this.translationService.translate('messages.success')
        );
        this.modalLoading = false;
        this.showStepModal = false;
        this.loadApprovalSteps();
      },
      error: (err) => {
        console.error('Error updating approval step:', err);
        this.modalLoading = false;
        const errorMessage =
          err.error?.message ||
          err.error?.errors?.join(', ') ||
          this.translationService.translate('approvalProcess.messages.updateError');
        this.toastr.error(errorMessage, this.translationService.translate('messages.error'));
      }
    });
  }

  onDeleteStep(step: ApprovalStepDto): void {
    if (!this.canDeleteApprovalSteps) {
      this.toastr.error(
        this.translationService.translate('approvalProcess.messages.permissionDeleteDenied'),
        this.translationService.translate('messages.accessDenied')
      );
      return;
    }

    if (confirm(this.translationService.translate('approvalProcess.messages.deleteConfirm', { step: step.stepName }))) {
      this.approvalService.deleteApprovalStep(step.approvalStepId).subscribe({
        next: () => {
          this.toastr.success(
            this.translationService.translate('approvalProcess.messages.deleteSuccess', { step: step.stepName }),
            this.translationService.translate('messages.success')
          );
          this.loadApprovalSteps();
        },
        error: (err) => {
          console.error('Error deleting approval step:', err);
          const errorMessage =
            err.error?.message || this.translationService.translate('approvalProcess.messages.deleteError');
          this.toastr.error(errorMessage, this.translationService.translate('messages.error'));
        }
      });
    }
  }

  get tableColumnCount(): number {
    return this.canEditApprovalSteps || this.canDeleteApprovalSteps ? 6 : 5;
  }
}
