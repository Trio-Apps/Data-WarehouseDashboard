import { Component, EventEmitter, Input, OnInit, OnChanges, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import {
  ModalComponent,
  ModalBodyComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ButtonModule,
  FormModule,
  GridModule,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import { AddUser, User } from '../../Models/user.model';
import { Role } from '../../../roles/Models/role.model';
import { RolesService } from '../../../roles/Services/roles.service';
import { AuthService } from '../../../pages/Services/auth.service';
import { CompaniesService } from '../../../companies/Services/companies.service';
import { Company } from '../../../companies/Models/company.model';
import { SapAuthService } from '../../../settings/Auth/Services/sap-auth.service';
import { Sap } from '../../../settings/Auth/Models/sap-auth.model';
import { UsersService } from '../../Services/users.service';
import { Warehouse } from '../../../Inquiries/Models/warehouse.model';


@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ButtonModule,
    FormModule,
    GridModule,
    FormCheckInputDirective,
    FormCheckLabelDirective
  ],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.scss'
})
export class UserFormModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() user: User | null = null;
  @Input() isEditMode: boolean = false;
  @Input() saving: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<User>();
  @Output() cancel = new EventEmitter<void>();

  userForm!: FormGroup;
  loading: boolean = false;
  rolesList: Role[] = [];

  // Role & related data
  isSuperAdmin: boolean = false;
  isAdmin: boolean = false;
  isManager: boolean = false;
  companyIdFromAuth: number | null = null;
  requiresCompanySelection: boolean = false;
  requiresSapWarehouseSelection: boolean = false;
  companies: Company[] = [];
  saps: Sap[] = [];
  warehousesBySap: Record<number, Warehouse[]> = {};
  loadingWarehousesBySap: Record<number, boolean> = {};
  loadingCompanies: boolean = false;
  loadingSaps: boolean = false;

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private authService: AuthService,
    private companiesService: CompaniesService,
    private sapAuthService: SapAuthService,
    private usersService: UsersService,
    private cdr:ChangeDetectorRef
  ) {
    this.checkUserRole();
    this.setCompanyContext();
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
    this.getRolesObserve();

    if (this.requiresCompanySelection) {
      this.loadCompanies();
    }

    if (this.requiresSapWarehouseSelection) {
      this.loadAllSaps();
    }
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.user && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  initForm(): void {
    // Set validators based on role
    const companyIdValidators = this.requiresCompanySelection ? [Validators.required] : [];

    this.userForm = this.fb.group(
      {
        // userName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        fullName: [''],
        phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]+$/)]],
        roles: ['', Validators.required],
        companyId: [this.requiresCompanySelection ? null : this.companyIdFromAuth, companyIdValidators],
        sapIds: this.fb.array([]),
        warehouseIds: this.fb.array([]),
        // isActive: [true],
        password: [''],
        confirmPassword: ['']
      },
      { validators: this.passwordMatchValidator }
    );

    this.userForm.get('roles')?.valueChanges.subscribe(() => {
      this.applySapWarehouseValidators();
      this.cdr.detectChanges();
    });
  }

  checkUserRole(): void {
    this.isSuperAdmin = this.authService.hasRole('super-admin');
    this.isAdmin = this.authService.hasRole('admin');
    this.isManager = this.authService.hasRole('manager');

  }

  setCompanyContext(): void {
    this.companyIdFromAuth = this.authService.getCompanyId();
    this.requiresCompanySelection = this.companyIdFromAuth === null;
    this.requiresSapWarehouseSelection = this.companyIdFromAuth !== null;
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
      error: () => {
        this.loadingCompanies = false;
        this.companies = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadAllSaps(): void {
    this.loadingSaps = true;
    const request$ = this.companyIdFromAuth != null
      ? this.sapAuthService.getSapsbyCompanyId(this.companyIdFromAuth)
      : this.sapAuthService.getAllSap();

    request$.subscribe({
      next: (res: any) => {
        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];

        this.saps = data;
        this.loadingSaps = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadingSaps = false;
        this.saps = [];
        this.cdr.detectChanges();
      }
    });
  }

  private roleDoesNotRequireSapWarehouse(roleName: string | null | undefined): boolean {
    if (!roleName) {
      return false;
    }

    return ['admin', 'manager', 'super-admin'].includes(roleName.toLowerCase());
  }

  get shouldShowSapWarehouseSelection(): boolean {
    if (!this.requiresSapWarehouseSelection) {
      return false;
    }

    const selectedRole = this.userForm?.get('roles')?.value as string | null | undefined;
    return !this.roleDoesNotRequireSapWarehouse(selectedRole);
  }

  get shouldRequireSapWarehouseSelection(): boolean {
    return this.shouldShowSapWarehouseSelection;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  getRolesObserve() {
    this.rolesService.getAllRoles().subscribe({
      next: (res: any) => {
        this.rolesList = res.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rolesList = [];
        this.cdr.detectChanges();
      }
    });
  }

  getAvailableRoles(): Role[] {
    if (this.isSuperAdmin) {
      // super-admin can assign only admin role
      return this.rolesList.filter(r => r.roleName === 'admin');
    }
    if (this.isAdmin) {
      // admin can assign all roles except super-admin and admin
      return this.rolesList.filter(r => r.roleName !== 'super-admin' && r.roleName !== 'admin');
    }
     if (this.isManager) {
      // admin can assign all roles except super-admin and admin
      return this.rolesList.filter(r => r.roleName !== 'super-admin' && r.roleName !== 'admin' && r.roleName !== 'manager' );
    }
    
    // other roles - return all as fallback
    return this.rolesList;
  }

  applySapWarehouseValidators(): void {
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;

    if (this.shouldRequireSapWarehouseSelection) {
      sapIdsArray.setValidators([(control: AbstractControl): ValidationErrors | null => {
        const formArray = control as FormArray;
        return formArray.length > 0 ? null : { required: true };
      }]);
      warehouseIdsArray.setValidators([(control: AbstractControl): ValidationErrors | null => {
        const formArray = control as FormArray;
        return formArray.length > 0 ? null : { required: true };
      }]);
    } else {
      sapIdsArray.clearValidators();
      warehouseIdsArray.clearValidators();
    }

    sapIdsArray.updateValueAndValidity();
    warehouseIdsArray.updateValueAndValidity();
  }

  loadWarehousesBySapId(sapId: number): Promise<void> {
    this.loadingWarehousesBySap[sapId] = true;
    return new Promise((resolve) => {
      this.usersService.getWarehousesBySapId(sapId).subscribe({
        next: (res: any) => {
          if (Array.isArray(res)) {
            this.warehousesBySap[sapId] = res;
          } else if (res.data && Array.isArray(res.data)) {
            this.warehousesBySap[sapId] = res.data;
          } else {
            this.warehousesBySap[sapId] = [];
          }
          this.loadingWarehousesBySap[sapId] = false;
          this.cdr.detectChanges();
          resolve();
        },
        error: () => {
          this.loadingWarehousesBySap[sapId] = false;
          this.warehousesBySap[sapId] = [];
          this.cdr.detectChanges();
          resolve();
        }
      });
    });
  }

  onSapIdsChange(selectedSapIds: number[]): void {
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    
    // Clear existing
    while (sapIdsArray.length !== 0) {
      sapIdsArray.removeAt(0);
    }
    
    // Add selected SAPs
    selectedSapIds.forEach(sapId => {
      sapIdsArray.push(this.fb.control(sapId));
    });
    
    // Update form validity
    sapIdsArray.updateValueAndValidity();
  }

  onWarehouseIdsChange(selectedWarehouseIds: number[]): void {
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    
    // Clear existing
    while (warehouseIdsArray.length !== 0) {
      warehouseIdsArray.removeAt(0);
    }
    
    // Add selected warehouses
    selectedWarehouseIds.forEach(warehouseId => {
      warehouseIdsArray.push(this.fb.control(warehouseId));
    });
    
    // Update form validity
    warehouseIdsArray.updateValueAndValidity();
  }

  isSapSelected(sapId: number): boolean {
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    return sapIdsArray.value.includes(sapId);
  }

  isWarehouseSelected(warehouseId: number): boolean {
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    return warehouseIdsArray.value.includes(warehouseId);
  }

  onSapCheckboxChange(sapId: number, event: any): void {
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    const isChecked = event.target.checked;
    
    if (isChecked) {
      // Add SAP ID if not already present
      if (!sapIdsArray.value.includes(sapId)) {
        sapIdsArray.push(this.fb.control(sapId));
        this.loadWarehousesBySapId(sapId);
      }
    } else {
      // Remove SAP ID
      const index = sapIdsArray.value.indexOf(sapId);
      if (index > -1) {
        sapIdsArray.removeAt(index);
      }

      const warehousesToRemove = this.warehousesBySap[sapId]?.map(w => w.warehouseId) || [];
      const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
      warehousesToRemove.forEach((warehouseId) => {
        const warehouseIndex = warehouseIdsArray.value.indexOf(warehouseId);
        if (warehouseIndex > -1) {
          warehouseIdsArray.removeAt(warehouseIndex);
        }
      });
      delete this.warehousesBySap[sapId];
      delete this.loadingWarehousesBySap[sapId];
    }
    
    sapIdsArray.updateValueAndValidity();
    this.applySapWarehouseValidators();
  }

  onWarehouseCheckboxChange(warehouseId: number, event: any): void {
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    const isChecked = event.target.checked;
    
    if (isChecked) {
      // Add warehouse ID if not already present
      if (!warehouseIdsArray.value.includes(warehouseId)) {
        warehouseIdsArray.push(this.fb.control(warehouseId));
      }
    } else {
      // Remove warehouse ID
      const index = warehouseIdsArray.value.indexOf(warehouseId);
      if (index > -1) {
        warehouseIdsArray.removeAt(index);
      }
    }
    
    warehouseIdsArray.updateValueAndValidity();
  }

  getSelectedSapIds(): number[] {
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    return sapIdsArray.value || [];
  }

  getSapName(sapId: number): string {
    const sap = this.saps.find(s => s.sapId === sapId);
    return sap?.name || `SAP ${sapId}`;
  }

  getWarehousesForSap(sapId: number): Warehouse[] {
    return this.warehousesBySap[sapId] || [];
  }

  isWarehousesLoadingForSap(sapId: number): boolean {
    return !!this.loadingWarehousesBySap[sapId];
  }
  populateForm(): void {
    if (this.user) {
      const sapIds = (this.user as any).sapIds || [];
      const warehouseIds = (this.user as any).warehouseIds || [];
      
      // Clear form arrays first
      const sapIdsArray = this.userForm.get('sapIds') as FormArray;
      const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
      while (sapIdsArray.length !== 0) {
        sapIdsArray.removeAt(0);
      }
      while (warehouseIdsArray.length !== 0) {
        warehouseIdsArray.removeAt(0);
      }
      this.warehousesBySap = {};
      this.loadingWarehousesBySap = {};
      
      // Patch form values
      this.userForm.patchValue({
        email: this.user.email || '',
        fullName: this.user.fullName || '',
        phoneNumber: this.user.phoneNumber || '',
        roles: this.user.roleName || '',
        companyId: this.requiresCompanySelection ? ((this.user as any).companyId || null) : this.companyIdFromAuth
      });

      const companyIdValidators = this.requiresCompanySelection ? [Validators.required] : [];
      this.userForm.get('companyId')?.setValidators(companyIdValidators);
      this.userForm.get('companyId')?.updateValueAndValidity();
      
      if (this.requiresSapWarehouseSelection && Array.isArray(sapIds) && sapIds.length > 0) {
        sapIds.forEach((sapId: number) => {
          if (sapId != null) {
            sapIdsArray.push(this.fb.control(sapId));
          }
        });
        sapIdsArray.updateValueAndValidity();

        Promise.all(sapIds.map((sapId: number) => this.loadWarehousesBySapId(sapId))).then(() => {
          if (warehouseIds && Array.isArray(warehouseIds) && warehouseIds.length > 0) {
            warehouseIds.forEach((warehouseId: number) => {
              if (warehouseId != null) {
                warehouseIdsArray.push(this.fb.control(warehouseId));
              }
            });
            warehouseIdsArray.updateValueAndValidity();
          }
          this.cdr.detectChanges();
        });
      }
      this.applySapWarehouseValidators();

      // Remove password validators in edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('confirmPassword')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.userForm.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  resetForm(): void {
    this.warehousesBySap = {};
    this.loadingWarehousesBySap = {};
    
    // Clear form arrays
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    
    while (sapIdsArray.length !== 0) {
      sapIdsArray.removeAt(0);
    }
    while (warehouseIdsArray.length !== 0) {
      warehouseIdsArray.removeAt(0);
    }
    
    this.userForm.reset({
      // userName: '',
      email: '',
      fullName: '',
      phoneNumber: '',
      roles: '',
      companyId: this.requiresCompanySelection ? null : this.companyIdFromAuth,
      // isActive: true,
      password: '',
      confirmPassword: ''
    });

    // Set validators based on role
    const companyIdValidators = this.requiresCompanySelection ? [Validators.required] : [];
    this.userForm.get('companyId')?.setValidators(companyIdValidators);
    this.userForm.get('companyId')?.updateValueAndValidity();
    this.applySapWarehouseValidators();

    // Add password validators for new user
    if (!this.isEditMode) {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
      this.userForm.get('password')?.updateValueAndValidity();
      this.userForm.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  onSave(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
    
    // Mark form arrays as touched
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    
    if (sapIdsArray) {
      sapIdsArray.controls.forEach(control => control.markAsTouched());
      sapIdsArray.updateValueAndValidity();
    }
    if (warehouseIdsArray) {
      warehouseIdsArray.controls.forEach(control => control.markAsTouched());
      warehouseIdsArray.updateValueAndValidity();
    }

    // Validate form
    if (!this.userForm.valid) {
      return;
    }
    const formValue = this.userForm.value;
    const selectedRole = formValue.roles || '';

    if (this.shouldRequireSapWarehouseSelection) {
      if (sapIdsArray.length === 0) {
        sapIdsArray.setErrors({ required: true });
        sapIdsArray.controls.forEach(control => control.markAsTouched());
        sapIdsArray.updateValueAndValidity();
        return;
      }

      if (warehouseIdsArray.length === 0) {
        warehouseIdsArray.setErrors({ required: true });
        warehouseIdsArray.controls.forEach(control => control.markAsTouched());
        warehouseIdsArray.updateValueAndValidity();
        return;
      }
    }
    
    const userData: AddUser = {
      // userName: formValue.userName,
      email: formValue.email,
      fullName: formValue.fullName,
      phoneNumber: formValue.phoneNumber,
      roleName: selectedRole,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      companyId: null,
      sapIds: null,
      warehouseIds: null
      // isActive: formValue.isActive
    };

    if (this.requiresCompanySelection) {
      userData.companyId = formValue.companyId || null;
    }

    if (this.shouldRequireSapWarehouseSelection) {
      const sapIds = sapIdsArray.value || [];
      const warehouseIds = warehouseIdsArray.value || [];
      if (sapIds.length > 0) {
        userData.sapIds = sapIds;
      }
      if (warehouseIds.length > 0) {
        userData.warehouseIds = warehouseIds;
      }
    }
     // else if (this.isAdmin && !this.isSuperAdmin) {
    //   // Other roles with admin: Single SAP
    //   userData.sapId = formValue.sapId || null;
    // }

    if (this.isEditMode && this.user?.id) {
      userData.id = this.user.id;
    }

    if (formValue.password && !this.isEditMode) {
      (userData as any).password = formValue.password;
    }

    this.save.emit(userData);
  }

  onCancel(): void {
    this.visibleChange.emit(false);
    this.cancel.emit();
    this.resetForm();
  }

  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
    if (!visible) {
      this.resetForm();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors?.['pattern']) {
        return 'Please enter a valid phoneNumber number';
      }
      if (field.errors?.['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      // userName: 'Username',
      email: 'Email',
      fullName: 'Full Name',
      phoneNumber: 'phoneNumber',
      roles: 'roles',
      companyId: 'Company',
      password: 'Password',
      confirmPassword: 'Confirm Password'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isSapIdsInvalid(): boolean {
    if (!this.shouldRequireSapWarehouseSelection) return false;
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    return sapIdsArray.invalid && sapIdsArray.touched;
  }

  isWarehouseIdsInvalid(): boolean {
    if (!this.shouldRequireSapWarehouseSelection) return false;
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    return warehouseIdsArray.invalid && warehouseIdsArray.touched;
  }
}
