import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  TableModule,
  CardModule,
  ButtonModule,
  FormModule,
  GridModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { RolesService } from '../Services/roles.service';
import { AddRoleWithPermissions, Role, RoleFormPayload, UpdateRoleWithPermissions } from '../Models/role.model';
import { RoleFormModalComponent } from './role-form-modal/role-form-modal.component';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../pages/Services/auth.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';

@Component({
  selector: 'app-roles',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    RoleFormModalComponent
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  roles: Role[] = [];
  filteredRoles: Role[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  searchTerm: string = '';

  // Modal state
  showRoleModal: boolean = false;
  selectedRole: Role | null = null;
  isEditMode: boolean = false;
  modalLoading: boolean = false;

  canViewRoles: boolean = false;
  canCreateRoles: boolean = false;
  canEditRoles: boolean = false;
  canDeleteRoles: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private rolesService: RolesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private translationService: TranslationService
  ) {
    this.checkPermissions();
    this.form = this.fb.group({
      search: ['']
    });
  }

  checkPermissions(): void {
    this.canViewRoles = this.authService.hasPermission('Roles.Get');
    this.canCreateRoles = this.authService.hasPermission('Roles.Create');
    this.canEditRoles = this.authService.hasPermission('Roles.Edit');
    this.canDeleteRoles = this.authService.hasPermission('Roles.Delete');
  }

  ngOnInit(): void {
    if (!this.canViewRoles) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    // Read pagination from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;
      const search = params['search'] || '';

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;
      this.searchTerm = search;
      this.form.patchValue({ search: search });

      this.loadRoles();
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadRoles(): void {
    if (!this.canViewRoles) {
      this.loading = false;
      this.roles = [];
      this.filteredRoles = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.hasNext = false;
      this.hasPrevious = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.rolesService.getRoles(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        console.log(res);

        // Extract data from response
        if (res.data) {
          this.roles = res.data.data || [];
          this.filteredRoles = this.roles;

          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;
          
          if (this.roles.length > 0) {
            this.toastr.success(`Loaded ${this.roles.length} role(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.loading = false;
        this.roles = [];
        this.filteredRoles = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load roles. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedRoles(): Role[] {
    return this.filteredRoles;
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.loading = true;
    this.cdr.detectChanges();

    // Validate page number
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;

    if (page !== this.currentPage) {
      // Update URL with new page - this will trigger queryParams subscription and loadRoles
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { 
          page: page, 
          pageSize: this.itemsPerPage,
          search: this.searchTerm || null
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
    if (!this.canViewRoles) {
      this.toastr.error('You do not have permission to view roles.', 'Access Denied');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const searchValue = this.form.value.search || '';
    this.searchTerm = searchValue;

    if (searchValue) {
      this.toastr.info('Searching roles...', 'Info');
    }

    // Reset to first page when searching
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        pageSize: this.itemsPerPage,
        search: searchValue || null
      },
      queryParamsHandling: 'merge'
    });
  }

  onAddRole(): void {
    if (!this.canCreateRoles) {
      this.toastr.error('You do not have permission to create roles.', 'Access Denied');
      return;
    }

    this.selectedRole = null;
    this.isEditMode = false;
    this.showRoleModal = true;
  }

  onEditRole(role: Role): void {
    if (!this.canEditRoles) {
      this.toastr.error('You do not have permission to edit roles.', 'Access Denied');
      return;
    }

    this.selectedRole = { ...role };
    this.isEditMode = true;
    this.showRoleModal = true;
  }

  onSaveRole(roleData: RoleFormPayload): void {
    if (this.isEditMode && !this.canEditRoles) {
      this.toastr.error('You do not have permission to edit roles.', 'Access Denied');
      return;
    }
    if (!this.isEditMode && !this.canCreateRoles) {
      this.toastr.error('You do not have permission to create roles.', 'Access Denied');
      return;
    }

    this.modalLoading = true;
    this.cdr.detectChanges();

    if (this.isEditMode && roleData.id) {
      const payload: UpdateRoleWithPermissions = {
        roleId: roleData.id,
        roleName: roleData.roleName,
        permissionIds: roleData.permissionIds || []
      };

      this.rolesService.updateRoleWithPermissions(roleData.id, payload).subscribe({
        next: () => {
          this.modalLoading = false;
          this.showRoleModal = false;
          this.selectedRole = null;
          this.isEditMode = false;
          this.toastr.success('Role updated successfully', 'Success');
          this.loadRoles();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error updating role. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new role
      const newRole: AddRoleWithPermissions = { roleName: roleData.roleName, permissionIds: roleData.permissionIds || [] };
      this.rolesService.createRoleWithPermissions(newRole).subscribe({
        next: (res: any) => {
          console.log('Role created:', res);
          this.modalLoading = false;
          this.showRoleModal = false;
          this.selectedRole = null;
          this.isEditMode = false;
          this.toastr.success('Role created successfully', 'Success');
          this.loadRoles();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating role:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error creating role. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancelRoleModal(): void {
    this.showRoleModal = false;
    this.selectedRole = null;
    this.isEditMode = false;
  }

  onDeleteRole(role: Role): void {
    if (!this.canDeleteRoles) {
      this.toastr.error('You do not have permission to delete roles.', 'Access Denied');
      return;
    }

    if (confirm(this.translationService.translate(`Are you sure you want to delete role: ${role.roleName}?`))) {
      if (role.id) {
        this.rolesService.deleteRole(role.roleName).subscribe({
          next: () => {
            this.toastr.success(`Role "${role.roleName}" deleted successfully`, 'Success');
            this.loadRoles();
          },
          error: (err) => {
            console.error('Error deleting role:', err);
            const errorMessage = err.error?.message || 'Error deleting role. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  get tableColumnCount(): number {
    return this.canEditRoles || this.canDeleteRoles ? 3 : 2;
  }
}

