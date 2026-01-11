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
  FormCheckComponent,
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
    FormCheckComponent,
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
  companies: Company[] = [];
  saps: Sap[] = [];
  warehouses: Warehouse[] = [];
  loadingCompanies: boolean = false;
  loadingSaps: boolean = false;
  loadingWarehouses: boolean = false;
  selectedRole: string = '';

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
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
    this.getRolesObserve();

    if (this.isSuperAdmin) {
      this.loadCompanies();
    }

    if (this.isAdmin || this.isManager) {
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
    const companyIdValidators = this.isSuperAdmin ? [Validators.required] : [];

    this.userForm = this.fb.group(
      {
        // userName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        fullName: [''],
        phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]+$/)]],
        roles: ['', Validators.required],
        companyId: [null, companyIdValidators],
        sapEmployeeId: [null], // Single SAP for employee
        sapIds: this.fb.array([]), // Multiple SAPs for manager
        warehouseIds: this.fb.array([]), // Multiple warehouses for employee
        // isActive: [true],
        password: [''],
        confirmPassword: ['']
      },
      { validators: this.passwordMatchValidator }
    );

    // Subscribe to role changes
    this.userForm.get('roles')?.valueChanges.subscribe(role => {
      this.onRoleChange(role);
    });
  }

  checkUserRole(): void {
    this.isSuperAdmin = this.authService.hasRole('super-admin');
    this.isAdmin = this.authService.hasRole('admin');
    this.isManager = this.authService.hasRole('manager');

  }

  loadCompanies(): void {
    this.loadingCompanies = true;
    this.companiesService.getCompanies(1, 1000).subscribe({
      next: (res: any) => {
        if (res.data && res.data.data) {
          this.companies = res.data.data;
        }
        this.loadingCompanies = false;
      },
      error: () => {
        this.loadingCompanies = false;
        this.companies = [];
      }
    });
  }

  loadAllSaps(): void {
    this.loadingSaps = true;
    this.sapAuthService.getAllSap().subscribe({
      next: (res: any) => {
        console.log("saps",res)
        if (res.data) {
          this.saps = res.data;
        }
        this.loadingSaps = false;
      },
      error: (err: any) => {
        this.loadingSaps = false;
        this.saps = [];
        console.log("error get sap :",err)
      }
    });
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
      },
      error: () => {
        this.rolesList = [];
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

  onRoleChange(role: string): void {
    this.selectedRole = role || '';
    
    // Reset SAP and warehouse selections
    this.userForm.patchValue({
      sapId: null
    });
    
    // Clear form arrays
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    
    while (sapIdsArray.length !== 0) {
      sapIdsArray.removeAt(0);
    }
    while (warehouseIdsArray.length !== 0) {
      warehouseIdsArray.removeAt(0);
    }
    
    this.warehouses = [];
    
    // Set validators based on selected role
    if (role === 'manager') {
      // Manager: Multiple SAPs required
      this.userForm.get('sapId')?.clearValidators();
      this.userForm.get('sapId')?.updateValueAndValidity();
      // Custom validator for FormArray
      sapIdsArray.setValidators([(control: AbstractControl): ValidationErrors | null => {
        const formArray = control as FormArray;
        return formArray.length > 0 ? null : { required: true };
      }]);
      sapIdsArray.updateValueAndValidity();
      this.userForm.get('warehouseIds')?.clearValidators();
      this.userForm.get('warehouseIds')?.updateValueAndValidity();
    } else if (role === 'employee') {
      // Employee: Single SAP required, then multiple warehouses (validated in onSapIdChange)
      this.userForm.get('sapEmployeeId')?.setValidators([Validators.required]);
      this.userForm.get('sapEmployeeId')?.updateValueAndValidity();
      sapIdsArray.clearValidators();
      sapIdsArray.updateValueAndValidity();
      // Warehouse validation will be set after SAP is selected
      warehouseIdsArray.clearValidators();
      warehouseIdsArray.updateValueAndValidity();
    } else {
      // Other roles: Clear validators
      this.userForm.get('sapEmployeeId')?.clearValidators();
      this.userForm.get('sapEmployeeId')?.updateValueAndValidity();
      sapIdsArray.clearValidators();
      sapIdsArray.updateValueAndValidity();
      this.userForm.get('warehouseIds')?.clearValidators();
      this.userForm.get('warehouseIds')?.updateValueAndValidity();
    }
  }

  onSapIdChange(sapId: number | null): void {
    const sapIdValue = sapId ? parseInt(sapId.toString()) : null;
    
    if (this.selectedRole === 'employee' && sapIdValue) {
      this.loadWarehousesBySapId(sapIdValue);
      // Set warehouse validation after SAP is selected
      const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
      warehouseIdsArray.setValidators([(control: AbstractControl): ValidationErrors | null => {
        const formArray = control as FormArray;
        return formArray.length > 0 ? null : { required: true };
      }]);
      warehouseIdsArray.updateValueAndValidity();
    } else {
      this.warehouses = [];
      const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
      while (warehouseIdsArray.length !== 0) {
        warehouseIdsArray.removeAt(0);
      }
      warehouseIdsArray.clearValidators();
      warehouseIdsArray.updateValueAndValidity();
    }
  }

  loadWarehousesBySapId(sapId: number): Promise<void> {
    this.loadingWarehouses = true;
    return new Promise((resolve) => {
      this.usersService.getWarehousesBySapId(sapId).subscribe({
        next: (res: any) => {
          if (Array.isArray(res)) {
            this.warehouses = res;
          } else if (res.data && Array.isArray(res.data)) {
            this.warehouses = res.data;
          } else {
            this.warehouses = [];
          }
          this.loadingWarehouses = false;
          resolve();
        },
        error: (err) => {
          this.loadingWarehouses = false;
          this.warehouses = [];
          console.log("sap",err)
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
      }
    } else {
      // Remove SAP ID
      const index = sapIdsArray.value.indexOf(sapId);
      if (index > -1) {
        sapIdsArray.removeAt(index);
      }
    }
    
    sapIdsArray.updateValueAndValidity();
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
  populateForm(): void {
    if (this.user) {
      const userRole = this.user.roleName || '';
      this.selectedRole = userRole;
      
      // Get data from user object
      const sapIds = (this.user as any).sapIds || [];
      const warehouseIds = (this.user as any).warehouseIds || [];
      const sapEmployeeId = (this.user as any).sapEmployeeId || null;
      
      // Clear form arrays first
      const sapIdsArray = this.userForm.get('sapIds') as FormArray;
      const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
      while (sapIdsArray.length !== 0) {
        sapIdsArray.removeAt(0);
      }
      while (warehouseIdsArray.length !== 0) {
        warehouseIdsArray.removeAt(0);
      }
      
      // Patch form values
      this.userForm.patchValue({
        email: this.user.email || '',
        fullName: this.user.fullName || '',
        phoneNumber: this.user.phoneNumber || '',
        roles: userRole,
        companyId: (this.user as any).companyId || null,
        sapEmployeeId: sapEmployeeId,
      });

      // Set validators based on role first
      const companyIdValidators = this.isSuperAdmin ? [Validators.required] : [];
      this.userForm.get('companyId')?.setValidators(companyIdValidators);
      this.userForm.get('companyId')?.updateValueAndValidity();
      
      this.onRoleChange(userRole);

      // Populate SAP IDs array for manager (only if sapIds exists and is not null/empty)
      if (userRole === 'manager' && sapIds && Array.isArray(sapIds) && sapIds.length > 0) {
        sapIds.forEach((sapId: number) => {
          if (sapId != null) {
            sapIdsArray.push(this.fb.control(sapId));
          }
        });
        sapIdsArray.updateValueAndValidity();
      }

      // Load warehouses for employee if sapEmployeeId exists (do this first)
      if (userRole === 'employee' && sapEmployeeId) {
        this.loadWarehousesBySapId(sapEmployeeId).then(() => {
          // After warehouses are loaded, populate warehouse IDs if they exist
          if (warehouseIds && Array.isArray(warehouseIds) && warehouseIds.length > 0) {
            warehouseIds.forEach((warehouseId: number) => {
              if (warehouseId != null) {
                warehouseIdsArray.push(this.fb.control(warehouseId));
              }
            });
            warehouseIdsArray.updateValueAndValidity();
          }
          // Force change detection to update UI
          this.cdr.detectChanges();
        });
      } else if (userRole === 'employee' && warehouseIds && Array.isArray(warehouseIds) && warehouseIds.length > 0) {
        // If no sapEmployeeId but warehouseIds exist, still populate them
        warehouseIds.forEach((warehouseId: number) => {
          if (warehouseId != null) {
            warehouseIdsArray.push(this.fb.control(warehouseId));
          }
        });
        warehouseIdsArray.updateValueAndValidity();
      }

      // Remove password validators in edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('confirmPassword')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.userForm.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  resetForm(): void {
    this.selectedRole = '';
    this.warehouses = [];
    
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
      companyId: null,
      sapId: null,
      // isActive: true,
      password: '',
      confirmPassword: ''
    });

    // Set validators based on role
    const companyIdValidators = this.isSuperAdmin ? [Validators.required] : [];
    this.userForm.get('companyId')?.setValidators(companyIdValidators);
    this.userForm.get('companyId')?.updateValueAndValidity();

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
    
    // Additional validation based on role
    if (selectedRole === 'manager') {
      const sapIdsArray = this.userForm.get('sapIds') as FormArray;
      if (sapIdsArray.length === 0) {
        sapIdsArray.setErrors({ required: true });
        sapIdsArray.controls.forEach(control => control.markAsTouched());
        sapIdsArray.updateValueAndValidity();
        return;
      }
    } else if (selectedRole === 'employee') {
      const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
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
      sapEmployeeId: null,
      sapIds: null,
      warehouseIds: null
      // isActive: formValue.isActive
    };

    // Set companyId for super-admin
    if (this.isSuperAdmin) {
      userData.companyId = formValue.companyId || null;
    }

    // Handle SAP and warehouse assignments based on role
    if (selectedRole === 'manager') {
      // Manager: Multiple SAPs
      const sapIdsArray = this.userForm.get('sapIds') as FormArray;
      const sapIds = sapIdsArray.value || [];
      if (sapIds.length > 0) {
        userData.sapIds = sapIds;
      }
    } else if (selectedRole === 'employee') {
      // Employee: Single SAP and multiple warehouses
      if (formValue.sapEmployeeId) {
        userData.sapEmployeeId = formValue.sapEmployeeId;
      }
      const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
      const warehouseIds = warehouseIdsArray.value || [];
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
      sapId: 'SAP',
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
    if (this.selectedRole !== 'manager') return false;
    const sapIdsArray = this.userForm.get('sapIds') as FormArray;
    return sapIdsArray.invalid && sapIdsArray.touched;
  }

  isWarehouseIdsInvalid(): boolean {
    if (this.selectedRole !== 'employee') return false;
    const warehouseIdsArray = this.userForm.get('warehouseIds') as FormArray;
    return warehouseIdsArray.invalid && warehouseIdsArray.touched;
  }
}

