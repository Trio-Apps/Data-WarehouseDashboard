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
import { DynamicBarCode, AddDynamicBarCode, UpdateDynamicBarCode } from '../Models/dynamic-barcode.model';

@Component({
  selector: 'app-dynamic-barcode-form-modal',
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
  templateUrl: './dynamic-barcode-form-modal.component.html',
  styleUrl: './dynamic-barcode-form-modal.component.scss'
})
export class DynamicBarcodeFormModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() dynamicBarcode: DynamicBarCode | null = null;
  @Input() itemBarCodeId: number | null = null;
  @Input() isEditMode: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<AddDynamicBarCode | UpdateDynamicBarCode>();
  @Output() cancel = new EventEmitter<void>();

  dynamicBarcodeForm!: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.dynamicBarcode && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  initForm(): void {
    this.dynamicBarcodeForm = this.fb.group({
      barCode: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  populateForm(): void {
    if (this.dynamicBarcode) {
      this.dynamicBarcodeForm.patchValue({
        barCode: this.dynamicBarcode.barCode || ''
      });
    }
  }

  resetForm(): void {
    this.dynamicBarcodeForm.reset({
      barCode: ''
    });
  }

  onSave(): void {
    if (this.dynamicBarcodeForm.valid && this.itemBarCodeId) {
      const formValue = this.dynamicBarcodeForm.value;
      
      if (this.isEditMode && this.dynamicBarcode?.dynamicBarCodeId) {
        // Update mode - use UpdateDynamicBarCode
        const updateData: UpdateDynamicBarCode = {
          dynamicBarCodeId: this.dynamicBarcode.dynamicBarCodeId,
          barCode: formValue.barCode
        };
        this.save.emit(updateData);
      } else {
        // Add mode - use AddDynamicBarCode
        const addData: AddDynamicBarCode = {
          barCode: formValue.barCode
        };
        this.save.emit(addData);
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.dynamicBarcodeForm.controls).forEach(key => {
        this.dynamicBarcodeForm.get(key)?.markAsTouched();
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
    const field = this.dynamicBarcodeForm.get(fieldName);
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
      barCode: 'Barcode'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.dynamicBarcodeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

