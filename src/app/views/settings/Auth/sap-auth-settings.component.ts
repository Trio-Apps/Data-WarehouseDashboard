import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  CardModule,
  CardBodyComponent,
  CardHeaderComponent,
  ButtonModule,
  FormModule,
  GridModule,
  GutterDirective,
  TableModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { SapAuthService } from './Services/sap-auth.service';
import { SapAuthSettings, Sap } from './Models/sap-auth.model';
import { SapFormModalComponent } from './sap-form-modal/sap-form-modal.component';
import { AuthService } from '../../pages/Services/auth.service';
import { CompaniesService } from '../../companies/Services/companies.service';
import { Company } from '../../companies/Models/company.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sap-auth-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    CardBodyComponent,
    CardHeaderComponent,
    ButtonModule,
    FormModule,
    GridModule,
    GutterDirective,
    TableModule,
    IconDirective,
    SapFormModalComponent
  ],
  templateUrl: './sap-auth-settings.component.html',
  styleUrl: './sap-auth-settings.component.scss'
})
export class SapAuthSettingsComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading: boolean = false;
  saving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // SAP List
  saps: Sap[] = [];
  filteredSaps: Sap[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loadingSaps: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  searchTerm: string = '';

  // Modal state
  showSapModal: boolean = false;
  selectedSap: SapAuthSettings | null = null;
  isEditMode: boolean = false;
  modalLoading: boolean = false;

  // SAP details card
  sapDetails: any = null;
  loadingSapDetails: boolean = false;

  // Search filters
  searchCompanyId: number | null = null;
  searchSapName: string = '';
  searchUserName: string = '';
  searchCompanyDB: string = '';

  // Companies for search (super-admin only)
  companies: Company[] = [];
  loadingCompanies: boolean = false;
  isSuperAdmin: boolean = false;

  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private sapAuthService: SapAuthService,
    private authService: AuthService,
    private companiesService: CompaniesService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.checkUserRole();
    this.form = this.fb.group({
      sapId : ['', [Validators.required]],
      sapName: ['', [Validators.required]],
      companyDB: ['', [Validators.required]],
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
      search: [''],
      searchCompanyId: [null],
      searchSapName: [''],
      searchUserName: ['']
    });
  }

  checkUserRole(): void {
    this.isSuperAdmin = this.authService.hasRole('super-admin');
  }

  ngOnInit(): void {
    // Load companies for super-admin
    if (this.isSuperAdmin) {
      this.loadCompanies();
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

      this.loadSaps();
    });
  }

  loadCompanies(): void {
    this.loadingCompanies = true;
    // Load all companies - using a large page size to get all companies
    this.companiesService.getCompanies(1, 1000).subscribe({
      next: (res: any) => {
        if (res.data && res.data.data) {
          this.companies = res.data.data;
          if (this.companies.length > 0) {
            this.toastr.success(`Loaded ${this.companies.length} company(ies) successfully`, 'Success');
          }
        }
        this.loadingCompanies = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading companies:', err);
        this.loadingCompanies = false;
        this.companies = [];
        this.toastr.error('Failed to load companies. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadSettings(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.sapAuthService.getSapAuthSettings().subscribe({
      next: (settings: any) => {
        console.log('Loaded SAP Auth settings:', settings);
        this.form.patchValue({
           sapId : settings.data.sapId || '',
           sapName: settings.data.name || '',
          companyDB: settings.data.companyDB || '',
          userName: settings.data.userName || '',
          password: settings.data.password || ''
           
        });
        this.loading = false;
        this.toastr.info('SAP Auth settings loaded successfully', 'Info');
        console.log('Form values after loading settings:', this.form.value);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading SAP Auth settings:', err);
        this.errorMessage = 'فشل تحميل الإعدادات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
        this.toastr.error('Failed to load SAP Auth settings. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const settings: SapAuthSettings = {
      sapId : this.form.value.sapId,
        name: this.form.value.sapName,
      companyDB: this.form.value.companyDB,
      userName: this.form.value.userName,
      password: this.form.value.password
    };

    this.sapAuthService.updateSapAuthSettings(settings).subscribe({
      next: (res: any) => {
        console.log('SAP Auth settings updated:', res);
        this.successMessage = 'تم حفظ الإعدادات بنجاح.';
        this.saving = false;
        this.toastr.success('SAP Auth settings saved successfully', 'Success');
        this.cdr.detectChanges();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('Error updating SAP Auth settings:', err);
        this.errorMessage = err.error?.message || 'فشل حفظ الإعدادات. يرجى المحاولة مرة أخرى.';
        this.saving = false;
        const errorMessage = err.error?.message || 'Failed to save SAP Auth settings. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'هذا الحقل مطلوب';
      }
    }
    return '';
  }

  onAddSap(): void {
    this.selectedSap = null;
    this.isEditMode = false;
    this.showSapModal = true;
  }

  onSaveSap(sapData: SapAuthSettings): void {
    this.modalLoading = true;
    this.cdr.detectChanges();

    if (this.isEditMode && sapData.sapId) {
      // Update existing SAP
      this.sapAuthService.updateSapAuthSettings(sapData).subscribe({
        next: (res: any) => {
          console.log('SAP updated:', res);
          this.modalLoading = false;
          this.showSapModal = false;
          this.selectedSap = null;
          this.isEditMode = false;
          this.successMessage = 'تم تحديث SAP بنجاح.';
          this.toastr.success('SAP updated successfully', 'Success');
          this.loadSaps();
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => {
          console.error('Error updating SAP:', err);
          this.modalLoading = false;
          this.errorMessage = err.error?.message || 'فشل تحديث SAP. يرجى المحاولة مرة أخرى.';
          const errorMessage = err.error?.message || 'Failed to update SAP. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new SAP
      this.sapAuthService.createSap(sapData).subscribe({
        next: (res: any) => {
          console.log('SAP created:', res);
          this.modalLoading = false;
          this.showSapModal = false;
          this.selectedSap = null;
          this.isEditMode = false;
          this.successMessage = 'تم إضافة SAP بنجاح.';
          this.toastr.success('SAP created successfully', 'Success');
          this.loadSaps();
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => {
          console.error('Error creating SAP:', err);
          this.modalLoading = false;
          this.errorMessage = err.error?.message || 'فشل إضافة SAP. يرجى المحاولة مرة أخرى.';
          const errorMessage = err.error?.message || 'Failed to create SAP. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancelSapModal(): void {
    this.showSapModal = false;
    this.selectedSap = null;
    this.isEditMode = false;
  }

  loadSaps(): void {
    this.loadingSaps = true;
    this.cdr.detectChanges();

    this.sapAuthService.getSaps(
      this.currentPage, 
      this.itemsPerPage,
      this.searchCompanyId,
      this.searchSapName,
      this.searchUserName
   
    ).subscribe({
      next: (res: any) => {
        console.log('Loaded SAPs:', res);
        console.log('Search Company ID:', this.searchCompanyId);
        // Extract data from response
        if (res.data) {
          this.saps = res.data.data || [];
          this.filteredSaps = this.saps;

          // Get pagination info from backend
          this.currentPage = res.data.pageNumber || this.currentPage;
          this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
          this.totalPages = res.data.totalPages || 0;
          this.totalItems = res.data.totalRecords || 0;
          this.hasNext = res.data.hasNext || false;
          this.hasPrevious = res.data.hasPrevious || false;
          
          if (this.saps.length > 0) {
            this.toastr.success(`Loaded ${this.saps.length} SAP(s) successfully`, 'Success');
          }
        }

        this.loadingSaps = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading SAPs:', err);
        this.loadingSaps = false;
        this.saps = [];
        this.filteredSaps = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrevious = false;
        this.toastr.error('Failed to load SAPs. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedSaps(): Sap[] {
    return this.filteredSaps;
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.loadingSaps = true;
    this.cdr.detectChanges();

    // Validate page number
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;

    if (page !== this.currentPage) {
      // Update URL with new page - this will trigger queryParams subscription and loadSaps
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
    this.loadingSaps = true;
    this.cdr.detectChanges();

    const formValue = this.form.value;
    
    // Update search filters
    this.searchCompanyId = formValue.searchCompanyId || null;
    this.searchSapName = formValue.searchSapName || '';
    this.searchUserName = formValue.searchUserName || '';
    this.searchCompanyDB = formValue.searchCompanyDB || '';

    if (this.searchCompanyId || this.searchSapName || this.searchUserName || this.searchCompanyDB) {
      this.toastr.info('Searching SAPs...', 'Info');
    }

    // Reset to first page when searching
    this.currentPage = 1;
    this.loadSaps();
  }

  onEditSap(sap: Sap): void {
    this.selectedSap = {
      sapId: sap.sapId,
      name: sap.name,
      companyDB: sap.companyDB,
      userName: sap.userName,
      password: sap.password,
      sapUrl: sap.sapUrl,
      isActive: sap.isActive,
      companyId: sap.companyId
    };
    this.isEditMode = true;
    this.showSapModal = true;
  }

  onDeleteSap(sap: Sap): void {
    if (confirm(`Are you sure you want to delete SAP: ${sap.name}?`)) {
      this.sapAuthService.deleteSap(sap.sapId).subscribe({
        next: () => {
          this.toastr.success(`SAP "${sap.name}" deleted successfully`, 'Success');
          this.loadSaps();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting SAP:', err);
          const errorMessage = err.error?.message || 'Error deleting SAP. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  onAction(sap: Sap): void {
    if (sap.sapId) {
      // Call selectSap endpoint
      this.sapAuthService.selectSap(sap.sapId).subscribe({
        next: (res: any) => {
          console.log('SAP selected:', res);
          this.toastr.success(`SAP "${sap.name}" selected successfully`, 'Success');
          // After action, load SAP details
          this.loadSapDetails();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error selecting SAP:', err);
          const errorMessage = err.error?.message || 'Error selecting SAP. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  loadSapDetails(): void {
    this.loadingSapDetails = true;
    this.sapDetails = null;
    this.cdr.detectChanges();

    this.sapAuthService.getSelectedSap().subscribe({
      next: (res: any) => {
        console.log('Selected SAP details loaded:', res);
        if (res.data) {
          this.sapDetails = res.data;
        } else {
          this.sapDetails = res;
        }
        if (res.success) {
          this.loadingSapDetails = false;
          this.toastr.info('Selected SAP details loaded successfully', 'Info');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading selected SAP details:', err);
        this.loadingSapDetails = false;
        this.sapDetails = null;
        this.toastr.warning('Failed to load selected SAP details', 'Warning');
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
}

