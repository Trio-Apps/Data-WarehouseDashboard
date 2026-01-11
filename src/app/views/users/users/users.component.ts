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
import { UsersService } from '../Services/users.service';
import { UpdateUser, User } from '../Models/user.model';
import { UserFormModalComponent } from './user-form-modal/user-form-modal.component';
import { AuthService } from '../../pages/Services/auth.service';
import { CompaniesService } from '../../companies/Services/companies.service';
import { Company } from '../../companies/Models/company.model';
import { SapAuthService } from '../../settings/Auth/Services/sap-auth.service';
import { Sap } from '../../settings/Auth/Models/sap-auth.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    UserFormModalComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  users: User[] = [];
  filteredUsers: User[] = [];

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
  showUserModal: boolean = false;
  selectedUser: User | null = null;
  isEditMode: boolean = false;
  modalLoading: boolean = false;

  // Search filters
  searchCompanyId: number | null = null;
  searchSapId: number | null = null;
  searchEmail: string = '';
  searchName: string = '';

  // Companies and SAPs for search
  companies: Company[] = [];
  saps: Sap[] = [];
  loadingCompanies: boolean = false;
  loadingSaps: boolean = false;
  isSuperAdmin: boolean = false;
  isAdmin: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService,
    private companiesService: CompaniesService,
    private sapAuthService: SapAuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.checkUserRole();
    this.form = this.fb.group({
      search: [''],
      searchCompanyId: [null],
      searchSapId: [null],
      searchEmail: [''],
      searchName: ['']
    });
  }

  checkUserRole(): void {
    this.isSuperAdmin = this.authService.hasRole('super-admin');
    this.isAdmin = this.authService.hasRole('admin');
  }

  ngOnInit(): void {
    // Load companies for super-admin
    if (this.isSuperAdmin) {
      this.loadCompanies();
    }
    
    // Load SAPs for admin (without company filter)
    if (this.isAdmin && !this.isSuperAdmin) {
      this.loadAllSaps();
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

      this.loadUsers();
    });
  }

  loadCompanies(): void {
    this.loadingCompanies = true;
    // Load all companies - using a large page size to get all companies
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

  onCompanyChange(): void {
    const companyId = this.form.value.searchCompanyId;
    this.searchCompanyId = companyId || null;
    
    // Reset SAP selection when company changes (only for super-admin)
    if (this.isSuperAdmin) {
      this.form.patchValue({ searchSapId: null });
      this.searchSapId = null;
      this.saps = [];

      // Load SAPs for selected company
      if (companyId) {
        this.loadSapsByCompany(companyId);
      }
    }
  }

  loadSapsByCompany(companyId: number): void {
    this.loadingSaps = true;
    // Load SAPs with company filter
    this.sapAuthService.getSapsbyCompanyId(companyId).subscribe({
      next: (res: any) => {
        if ( res.data) {
          this.saps = res.data;
        }
        console.log('Loaded SAPs for company', companyId, this.saps);
        this.loadingSaps = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading SAPs:', err);
        this.loadingSaps = false;
        this.saps = [];
        this.cdr.detectChanges();
      }
    });
  }

  
  loadAllSaps(): void {
    this.loadingSaps = true;
    // Load all SAPs for admin
    this.sapAuthService.getSaps(1, 1000).subscribe({
      next: (res: any) => {
        if (res.data && res.data.data) {
          this.saps = res.data.data;
        }
        this.loadingSaps = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading SAPs:', err);
        this.loadingSaps = false;
        
        this.saps = [];
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.cdr.detectChanges();


    this.usersService.getUsers(
      this.currentPage, 
      this.itemsPerPage,
      this.searchCompanyId,
      this.searchSapId,
      this.searchEmail,
      this.searchName
    ).subscribe({
      next: (res: any) => {
        console.log(res);

        // Extract data from response
        if (res.data) {
          this.users = res.data.data.map((user:any) => ({
            ...user,
            // Map roleName to roles for compatibility
            roleName: user.roles[0]
          }));

          this.filteredUsers = this.users;
          console.log("he is :",this.users)
          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;
          
          if (this.users.length > 0) {
            this.toastr.success(`Loaded ${this.users.length} user(s) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
        this.users = [];
        this.filteredUsers = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load users. Please try again.', err.error?.detail || 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedUsers(): User[] {
    return this.filteredUsers;
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
      // Update URL with new page - this will trigger queryParams subscription and loadUsers
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
    this.loading = true;
    this.cdr.detectChanges();

    const formValue = this.form.value;
    
    // Update search filters
    this.searchCompanyId = formValue.searchCompanyId || null;
    this.searchSapId = formValue.searchSapId || null;
    this.searchEmail = formValue.searchEmail || '';
    this.searchName = formValue.searchName || '';

    if (this.searchCompanyId || this.searchSapId || this.searchEmail || this.searchName) {
      this.toastr.info('Searching users...', 'Info');
    }

    // Reset to first page when searching
    this.currentPage = 1;
    this.loadUsers();
  }

  onAddUser(): void {
    this.selectedUser = null;
    this.isEditMode = false;
    this.showUserModal = true;
  }

  onEditUser(user: User): void {
    this.selectedUser = { ...user };

    console.log("edit here :", this.selectedUser);
    this.isEditMode = true;
    this.showUserModal = true;
  }

  onSaveUser(userData: User): void {
    this.modalLoading = true;
    this.cdr.detectChanges();
console.log("User Model : " ,userData);
    if (this.isEditMode && userData.id) {
      // Update existing user
       //userData.roles = userData.roles[0]; 
      this.usersService.updateUser(userData).subscribe({
        next: (res: any) => {
          console.log('User updated:', res);
          this.modalLoading = false;
          this.showUserModal = false;
          this.selectedUser = null;
          this.isEditMode = false;
          this.toastr.success('User updated successfully', 'Success');
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error updating user. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new user
      this.usersService.createUser(userData).subscribe({
        next: (res: any) => {
          console.log('User created:', res);
          this.modalLoading = false;
          this.showUserModal = false;
          this.selectedUser = null;
          this.isEditMode = false;
          this.toastr.success('User created successfully', 'Success');
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating user:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error creating user. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancelUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
    this.isEditMode = false;
  }

  onDeleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user: ${user.id}?`)) {
      if (user.id) {
        this.usersService.deleteUser(user.id).subscribe({
          next: () => {
            this.toastr.success(`User "${user.email || user.id}" deleted successfully`, 'Success');
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            const errorMessage = err.error?.message || 'Error deleting user. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }
}

