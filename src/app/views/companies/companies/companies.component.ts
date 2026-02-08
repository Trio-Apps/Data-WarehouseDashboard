import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  TableModule,
  CardModule,
  CardBodyComponent,
  CardHeaderComponent,
  ButtonModule,
  FormModule,
  GridModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { CompaniesService } from '../Services/companies.service';
import { Company } from '../Models/company.model';
import { CompanyFormModalComponent } from './company-form-modal/company-form-modal.component';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../pages/Services/auth.service';

@Component({
  selector: 'app-companies',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    CardBodyComponent,
    CardHeaderComponent,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    CompanyFormModalComponent
  ],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss',
})
export class CompaniesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  companies: Company[] = [];
  filteredCompanies: Company[] = [];

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
  showCompanyModal: boolean = false;
  selectedCompany: Company | null = null;
  isEditMode: boolean = false;
  modalLoading: boolean = false;

  canViewCompanies: boolean = false;
  canCreateCompanies: boolean = false;
  canEditCompanies: boolean = false;
  canDeleteCompanies: boolean = false;

  // Company details card
  companyDetails: any = null;
  loadingCompanyDetails: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private companiesService: CompaniesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.checkPermissions();
    this.form = this.fb.group({
      search: ['']
    });
  }

  checkPermissions(): void {
    this.canViewCompanies = this.authService.hasPermission('Companys.Get');
    this.canCreateCompanies = this.authService.hasPermission('Companys.Create');
    this.canEditCompanies = this.authService.hasPermission('Companys.Edit');
    this.canDeleteCompanies = this.authService.hasPermission('Companys.Delete');
  }

  ngOnInit(): void {
    if (!this.canViewCompanies) {
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

      this.loadCompanies();
    });

    this.loadCompanyDetails(0); // Load default company details on init
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadCompanies(): void {
    if (!this.canViewCompanies) {
      this.loading = false;
      this.companies = [];
      this.filteredCompanies = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.hasNext = false;
      this.hasPrevious = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.companiesService.getCompanies(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        console.log(res);

        // Extract data from response
        if (res.data) {
          this.companies = res.data.data || [];
          this.filteredCompanies = this.companies;

          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;
          
          if (this.companies.length > 0) {
            this.toastr.success(`Loaded ${this.companies.length} company(ies) successfully`, 'Success');
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading companies:', err);
        this.loading = false;
        this.companies = [];
        this.filteredCompanies = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load companies. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedCompanies(): Company[] {
    return this.filteredCompanies;
  }
  changeStatusCompany(company: Company): void {
    if (!this.canEditCompanies) {
      this.toastr.error('You do not have permission to edit companies.', 'Access Denied');
      return;
    }

    if (company.companyId) {
      this.companiesService.changeStatusCompany(company.companyId).subscribe({  
        next: (res: any) => {
          console.log('Company status changed:', res);
          this.toastr.success(`Company "${company.name}" status changed successfully`, 'Success');
          this.loadCompanies();
          this.cdr.detectChanges();
        }
        ,
        error: (err) => {
          console.error('Error changing company status:', err);
          const errorMessage = err.error?.message || 'Error changing company status. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
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
      // Update URL with new page - this will trigger queryParams subscription and loadCompanies
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
    if (!this.canViewCompanies) {
      this.toastr.error('You do not have permission to view companies.', 'Access Denied');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const searchValue = this.form.value.search || '';
    this.searchTerm = searchValue;

    if (searchValue) {
      this.toastr.info('Searching companies...', 'Info');
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

  onAddCompany(): void {
    if (!this.canCreateCompanies) {
      this.toastr.error('You do not have permission to create companies.', 'Access Denied');
      return;
    }

    this.selectedCompany = null;
    this.isEditMode = false;
    this.showCompanyModal = true;
  }

  onEditCompany(company: Company): void {
    if (!this.canEditCompanies) {
      this.toastr.error('You do not have permission to edit companies.', 'Access Denied');
      return;
    }

    this.selectedCompany = { ...company };
    this.isEditMode = true;
    this.showCompanyModal = true;
  }

  onSaveCompany(companyData: Company): void {
    if (this.isEditMode && !this.canEditCompanies) {
      this.toastr.error('You do not have permission to edit companies.', 'Access Denied');
      return;
    }
    if (!this.isEditMode && !this.canCreateCompanies) {
      this.toastr.error('You do not have permission to create companies.', 'Access Denied');
      return;
    }

    this.modalLoading = true;
    this.cdr.detectChanges();

    if (this.isEditMode && companyData.companyId) {
      // Update existing company
      this.companiesService.updateCompany(companyData).subscribe({
        next: (res: any) => {
          console.log('Company updated:', res);
          this.modalLoading = false;
          this.showCompanyModal = false;
          this.selectedCompany = null;
          this.isEditMode = false;
          this.toastr.success('Company updated successfully', 'Success');
          this.loadCompanies();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating company:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error updating company. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new company
      this.companiesService.createCompany(companyData).subscribe({
        next: (res: any) => {
          console.log('Company created:', res);
          this.modalLoading = false;
          this.showCompanyModal = false;
          this.selectedCompany = null;
          this.isEditMode = false;
          this.toastr.success('Company created successfully', 'Success');
          this.loadCompanies();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating company:', err);
          this.modalLoading = false;
          const errorMessage = err.error?.message || err.error?.errors?.join(', ') || 'Error creating company. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancelCompanyModal(): void {
    this.showCompanyModal = false;
    this.selectedCompany = null;
    this.isEditMode = false;
  }

  onDeleteCompany(company: Company): void {
    if (!this.canDeleteCompanies) {
      this.toastr.error('You do not have permission to delete companies.', 'Access Denied');
      return;
    }

    if (confirm(`Are you sure you want to delete company: ${company.name}?`)) {
      if (company.companyId) {
        this.companiesService.deleteCompany(company.companyId).subscribe({
          next: () => {
            this.toastr.success(`Company "${company.name}" deleted successfully`, 'Success');
            this.loadCompanies();
          },
          error: (err) => {
            console.error('Error deleting company:', err);
            const errorMessage = err.error?.message || 'Error deleting company. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onAction(company: Company): void {
    if (!this.canEditCompanies) {
      this.toastr.error('You do not have permission to edit companies.', 'Access Denied');
      return;
    }

    if (company.companyId) {
      // Call performAction endpoint
      this.companiesService.selectCompany(company.companyId).subscribe({
        next: (res: any) => {
          console.log('Action performed:', res);
          this.toastr.success(`Company "${company.name}" selected successfully`, 'Success');
          // After action, load company details
          this.loadCompanyDetails(company.companyId!);
        },
        error: (err) => {
          console.error('Error performing action:', err);
          const errorMessage = err.error?.message || 'Error performing action. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  loadCompanyDetails(companyId: number): void {
    if (!this.canViewCompanies) {
      this.companyDetails = null;
      this.loadingCompanyDetails = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingCompanyDetails = true;
    this.companyDetails = null;
    this.cdr.detectChanges();

    this.companiesService.getCompanyById(companyId).subscribe({
      next: (res: any) => {
        console.log('Company details loaded:', res);
        if (res.data) {
          this.companyDetails = res.data;
        } else {
          this.companyDetails = res;
        }
        if(res.success){
          this.loadingCompanyDetails = false;
          this.toastr.info('Company details loaded successfully', 'Info');
          this.cdr.detectChanges();
        }
       
      },
      error: (err) => {
        console.error('Error loading company details:', err);
        this.loadingCompanyDetails = false;
        this.companyDetails = null;
        this.toastr.warning('Failed to load company details', 'Warning');
        this.cdr.detectChanges();
      }
    });
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  formatKey(key: string): string {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  get tableColumnCount(): number {
    return this.canEditCompanies || this.canDeleteCompanies ? 4 : 3;
  }
}
