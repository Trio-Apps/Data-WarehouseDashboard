import { Component, EventEmitter, Input, OnInit, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalComponent,
  ModalBodyComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ButtonModule,
  FormModule,
  GridModule
} from '@coreui/angular';
import { SapAuthSettings } from '../Models/sap-auth.model';
import { AuthService } from '../../../pages/Services/auth.service';
import { CompaniesService } from '../../../companies/Services/companies.service';
import { Company } from '../../../companies/Models/company.model';

@Component({
  selector: 'app-sap-form-modal',
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
    GridModule
  ],
  templateUrl: './sap-form-modal.component.html',
  styleUrl: './sap-form-modal.component.scss'
})
export class SapFormModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() sap: SapAuthSettings | null = null;
  @Input() isEditMode: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<SapAuthSettings>();
  @Output() cancel = new EventEmitter<void>();

  sapForm!: FormGroup;
  loading: boolean = false;
  companies: Company[] = [];
  loadingCompanies: boolean = false;
  isSuperAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private companiesService: CompaniesService
  ) {
    this.checkUserRole();
    this.initForm();
  }

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.loadCompanies();
    }
  }

  checkUserRole(): void {
    this.isSuperAdmin = this.authService.hasRole('super-admin');
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
      },
      error: (err) => {
        console.error('Error loading companies:', err);
        this.loadingCompanies = false;
        this.companies = [];
      }
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.sap && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  initForm(): void {
    const formControls: any = {
      name: ['', [Validators.required]],
      companyDB: ['', [Validators.required]],
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
      sapUrl: ['', [Validators.required]]
    };

    // Add companyId field only for super-admin
    if (this.isSuperAdmin) {
      formControls.companyId = [null];
    }

    this.sapForm = this.fb.group(formControls);
  }

  populateForm(): void {
    if (this.sap) {
      const formValue: any = {
        name: this.sap.name || '',
        companyDB: this.sap.companyDB || '',
        userName: this.sap.userName || '',
        password: this.sap.password || '',
        sapUrl: this.sap.sapUrl || ''
      };

      // Add companyId only for super-admin
      if (this.isSuperAdmin) {
        formValue.companyId = this.sap.companyId || null;
      }

      this.sapForm.patchValue(formValue);
    }
  }

  resetForm(): void {
    // const resetValue: any = {
    //   name: 'Sap',
    //   companyDB: 'DOKHON_DEV',
    //   userName: 'manager',
    //   password: 'Tyconz@123',
    //   sapUrl: 'https://hb167-02.beon-it.com:50000/b1s/v1/'
    // };
    
    const resetValue: any = {
      name: 'Sap',
      companyDB: 'SBODEMOGB_NEW',
      userName: 'manager',
      password: 'manager',
      sapUrl: 'https://hb152.beon-it.com:50000/b1s/v1/'
    };

    // Add companyId only for super-admin
    if (this.isSuperAdmin) {
      resetValue.companyId = null;
    }

    this.sapForm.reset(resetValue);
  }

  onSave(): void {
    if (this.sapForm.valid) {
      const formValue = this.sapForm.value;
      
      const sapData: SapAuthSettings = {
        name: formValue.name,
        companyDB: formValue.companyDB,
        userName: formValue.userName,
        password: formValue.password,
        sapUrl: formValue.sapUrl,

      };

      // Set companyId based on role
      if (this.isSuperAdmin) {
        sapData.companyId = formValue.companyId || null;
      } else {
        // For admin, set companyId to null
        sapData.companyId = 0;
      }

      if (this.isEditMode && this.sap?.sapId) {
        sapData.sapId = this.sap.sapId;
      }

      this.save.emit(sapData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.sapForm.controls).forEach(key => {
        this.sapForm.get(key)?.markAsTouched();
      });
    }
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
    const field = this.sapForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'SAP Name',
      companyDB: 'Company DB',
      userName: 'User Name',
      password: 'Password',
      sapUrl: 'SAP URL',
      companyId: 'Company'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.sapForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

