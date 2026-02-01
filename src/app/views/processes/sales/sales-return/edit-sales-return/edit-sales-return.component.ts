import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalModule,
  ButtonModule,
  FormModule,
  CardModule,
  UtilitiesModule,
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../../barcodes/Models/item-barcode.model';
import { Return, UpdateReturn } from '../../Models/sales-return-model';
import { Sales } from '../../Models/sales-model';
import { SalesReturnService } from '../../Services/sales-return.service';


@Component({
  selector: 'app-edit-sales-return',
 imports: [
    CommonModule,
    ModalModule,
    ButtonModule,
    FormModule,
    CardModule,
    UtilitiesModule,
    GridModule,
    GutterDirective,
    ReactiveFormsModule
  ],
  templateUrl: './edit-sales-return.component.html',
  styleUrl: './edit-sales-return.component.scss',
})
export class EditSalesReturnComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() item: Return | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  
  saving: boolean = false;
  loadingUomGroups: boolean = false;

  constructor(
    private fb: FormBuilder,

    private returnService: SalesReturnService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.item && this.visible) {
      this.initializeForm();
      this.populateForm();
    }
  }

  initializeForm(): void {
    this.editForm = this.fb.group({
      salesReturnOrderId: [0, Validators.required],
      comment: [''],
      isDraft: [true]
    });
  }

  populateForm(): void {
    if (this.item) {
      const itemId = this.item.salesReturnOrderId;
      this.editForm.patchValue({
        salesReturnOrderId: itemId,
        comment: this.item.comment || '',
        isDraft: this.item.isDraft
      });
    }
  }

 
  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm(): void {
    this.editForm.reset({
      salesReturnOrderId: 0,
      comment: '',
      isDraft: true
    });
  
  }

  onUpdate(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    const itemData: UpdateReturn = {
      salesReturnOrderId: formValue.salesReturnOrderId,
      comment: formValue.comment,
      isDraft: formValue.isDraft  
    };
     console.log("updating item data",itemData);
    this.returnService.updateReturn(itemData.salesReturnOrderId, itemData).subscribe({
      next: (res: any) => {
        console.log('Receipt item updated:', res);
        this.saving = false;
        this.toastr.success('Item updated successfully', 'Success');
        this.itemUpdated.emit();
        this.onClose();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating receipt item:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error updating item. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }
}

