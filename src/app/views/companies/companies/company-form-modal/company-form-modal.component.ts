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
  GridModule,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import { Company } from '../../Models/company.model';

@Component({
  selector: 'app-company-form-modal',
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
  templateUrl: './company-form-modal.component.html',
  styleUrl: './company-form-modal.component.scss'
})
export class CompanyFormModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() company: Company | null = null;
  @Input() isEditMode: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<Company>();
  @Output() cancel = new EventEmitter<void>();

  companyForm!: FormGroup;
  loading: boolean = false;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.company && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  initForm(): void {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      isActive: [true]
    });
  }

  populateForm(): void {
    if (this.company) {
      this.companyForm.patchValue({
        name: this.company.name || '',
        isActive: this.company.isActive !== undefined ? this.company.isActive : true
      });
    }
  }

  resetForm(): void {
    this.companyForm.reset({
      name: '',
      isActive: true
    });
  }

  onSave(): void {
    if (this.companyForm.valid) {
      const formValue = this.companyForm.value;
      
      const companyData: Company = {
        name: formValue.name,
        isActive: formValue.isActive
      };

      if (this.isEditMode && this.company?.companyId) {
        companyData.companyId = this.company.companyId;
      }

      this.save.emit(companyData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.companyForm.controls).forEach(key => {
        this.companyForm.get(key)?.markAsTouched();
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
    const field = this.companyForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Company Name',
      isActive: 'Is Active'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

