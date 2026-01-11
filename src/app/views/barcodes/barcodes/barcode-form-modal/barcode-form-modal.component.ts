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
import { BarCodeSetting } from '../../Models/barcode-setting.model';
import { SapAuthService } from '../../../settings/Auth/Services/sap-auth.service';
import { Sap } from '../../../settings/Auth/Models/sap';

@Component({
  selector: 'app-barcode-form-modal',
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
  templateUrl: './barcode-form-modal.component.html',
  styleUrl: './barcode-form-modal.component.scss'
})
export class BarCodeFormModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() barcode: BarCodeSetting | null = null;
  @Input() isEditMode: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<BarCodeSetting>();
  @Output() cancel = new EventEmitter<void>();

  barcodeForm!: FormGroup;
  loading: boolean = false;
  sapsList: Sap[] = [];

  constructor(
    private fb: FormBuilder,
    private sapAuthService: SapAuthService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.getSaps();
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.barcode && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  initForm(): void {
    this.barcodeForm = this.fb.group({
      totalLength: [0, [Validators.required, Validators.min(1)]],
      startsWith: ['', [Validators.required]],
      sapStartPosition: [0, [Validators.required, Validators.min(0)]],
      sapLength: [0, [Validators.required, Validators.min(1)]],
      quantityStartPosition: [0, [Validators.required, Validators.min(0)]],
      quantityLength: [0, [Validators.required, Validators.min(1)]],
      ignoreLastDigit: [false],
      defaultUom: ['', [Validators.required]]
        });
  }

  populateForm(): void {
    if (this.barcode) {
      this.barcodeForm.patchValue({
        totalLength: this.barcode.totalLength || 0,
        startsWith: this.barcode.startsWith || '',
        sapStartPosition: this.barcode.sapStartPosition || 0,
        sapLength: this.barcode.sapLength || 0,
        quantityStartPosition: this.barcode.quantityStartPosition || 0,
        quantityLength: this.barcode.quantityLength || 0,
        ignoreLastDigit: this.barcode.ignoreLastDigit || false,
        defaultUom: this.barcode.defaultUom || ''
      });
    }
  }

  resetForm(): void {
    this.barcodeForm.reset({
      totalLength: 0,
      startsWith: '',
      sapStartPosition: 0,
      sapLength: 0,
      quantityStartPosition: 0,
      quantityLength: 0,
      ignoreLastDigit: false,
      defaultUom: '',
      sapId: 0
    });
  }

  getSaps(): void {
    this.sapAuthService.getAllSap().subscribe({
      next: (response: any) => {
        console.log('SAPs Response:', response);
        
        // معالجة الـ response - قد يكون array أو object
        if (Array.isArray(response)) {
          this.sapsList = response;
        } else if (response.data && Array.isArray(response.data)) {
          this.sapsList = response.data;
        } else if (response.data && !Array.isArray(response.data)) {
          this.sapsList = [response.data];
        } else {
          this.sapsList = [response];
        }
      },
      error: (error) => {
        console.error('Error fetching SAPs:', error);
        this.sapsList = [];
      }
    });
  }

  onSave(): void {
    if (this.barcodeForm.valid) {
      const formValue = this.barcodeForm.value;
      
      const barcodeData: BarCodeSetting = {
        totalLength: formValue.totalLength,
        startsWith: formValue.startsWith,
        sapStartPosition: formValue.sapStartPosition,
        sapLength: formValue.sapLength,
        quantityStartPosition: formValue.quantityStartPosition,
        quantityLength: formValue.quantityLength,
        ignoreLastDigit: formValue.ignoreLastDigit,
        defaultUom: formValue.defaultUom
      };

      if (this.isEditMode && this.barcode?.barCodeSettingId) {
        barcodeData.barCodeSettingId = this.barcode.barCodeSettingId;
      }

      this.save.emit(barcodeData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.barcodeForm.controls).forEach(key => {
        this.barcodeForm.get(key)?.markAsTouched();
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
    const field = this.barcodeForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} must be greater than ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      totalLength: 'Total Length',
      startsWith: 'Starts With',
      sapStartPosition: 'SAP Start Position',
      sapLength: 'SAP Length',
      quantityStartPosition: 'Quantity Start Position',
      quantityLength: 'Quantity Length',
      ignoreLastDigit: 'Ignore Last Digit',
      defaultUom: 'Default UOM'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.barcodeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

