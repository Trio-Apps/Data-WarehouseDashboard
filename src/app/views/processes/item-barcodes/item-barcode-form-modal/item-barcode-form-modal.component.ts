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
import { ItemBarcode, UoMGroup } from '../../barcodes/Models/item-barcode.model';
import { ItemBarcodeService } from '../../barcodes/Services/item-barcode.service';

@Component({
  selector: 'app-item-barcode-form-modal',
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
  templateUrl: './item-barcode-form-modal.component.html',
  styleUrl: './item-barcode-form-modal.component.scss'
})
export class ItemBarcodeFormModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() barcode: ItemBarcode | null = null;
  @Input() itemId: number | null = null;
  @Input() isEditMode: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ItemBarcode>();
  @Output() cancel = new EventEmitter<void>();

  barcodeForm!: FormGroup;
  loading: boolean = false;
  uomGroups: UoMGroup[] = [];
  loadingUomGroups: boolean = false;

  constructor(
    private fb: FormBuilder,
    private itemBarcodeService: ItemBarcodeService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
  }

  ngOnChanges(): void {
    if (this.visible && this.itemId) {
      this.loadUomGroups();
      if (this.barcode && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  loadUomGroups(): void {
    if (!this.itemId) return;

    this.loadingUomGroups = true;
    this.itemBarcodeService.getUoMGroupByItemId(this.itemId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.uomGroups = res.data;
        } else {
          this.uomGroups = [];
        }
        this.loadingUomGroups = false;
      },
      error: (err) => {
        console.error('Error loading UoM groups:', err);
        this.uomGroups = [];
        this.loadingUomGroups = false;
      }
    });
  }

  initForm(): void {
    this.barcodeForm = this.fb.group({
      barcode: ['', [Validators.required, Validators.minLength(1)]],
      uoMEntry: ['', [Validators.required]],
      freeText: ['', [Validators.required, Validators.minLength(1)]],
   //   type: ['', [Validators.required]]
    });
  }

  populateForm(): void {
    if (this.barcode) {
      this.barcodeForm.patchValue({
        barcode: this.barcode.barCode || '',
        uoMEntry: this.barcode.uoMEntry || '',
        freeText: this.barcode.freeText || '',
       // type: this.barcode.barCodeType || ''
      });
    }
  }

  resetForm(): void {
    this.barcodeForm.reset({
      barcode: '',
      uoMEntry: '',
      freeText: '',
     // type: ''
    });
  }

  onSave(): void {
    if (this.barcodeForm.valid && this.itemId) {
      const formValue = this.barcodeForm.value;
      
      const barcodeData: ItemBarcode = {
        barCode: formValue.barcode,
        uoMEntry: formValue.uoMEntry,
        freeText: formValue.freeText,
      
       // barCodeType: formValue.type
      };

      if (this.isEditMode && this.barcode?.itemBarCodeId) {
        barcodeData.itemBarCodeId = this.barcode.itemBarCodeId;
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
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      barcode: 'Barcode',
      uoMEntry: 'UoM Entry',
      freeText: 'Free Text',
      //type: 'Type',
      isDefault: 'Is Default'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.barcodeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

