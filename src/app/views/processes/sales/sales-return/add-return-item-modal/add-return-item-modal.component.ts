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

import { SalesReturnService } from '../../Services/sales-return.service';
import { AddReturnItemRequest, ReturnItem } from '../../Models/sales-return-model';
import { SalesService } from '../../Services/sales.service';

@Component({
  selector: 'app-add-return-item-modal',
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
  templateUrl: './add-return-item-modal.component.html',
  styleUrl: './add-return-item-modal.component.scss',
})
export class AddReturnItemModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() item: {item: ReturnItem,SaleId: number} | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  uomGroups: UoMGroup[] = [];
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private returnService: SalesReturnService,
    private saleService: SalesService,
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
      salesOrderItemId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      comment: ['']
    });
  }

  populateForm(): void {
    if (this.item) {
      const itemId = this.item.item.salesOrderItemId || 0;
      this.editForm.patchValue({
        salesOrderItemId : itemId,
        quantity: this.item.item.quantity || 0.01,
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
      salesOrderItemId: 0,
      quantity: 0.01,
      comment: ''
    });
  }

  onUpdate(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;
    const itemData: AddReturnItemRequest = {
       salesOrderItemId: formValue.salesOrderItemId,
      quantity: formValue.quantity,
      comment: formValue.comment
    };
     console.log("updating item data",itemData);
    this.returnService.addReturnItem(this.item?.SaleId || 0, itemData).subscribe({
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