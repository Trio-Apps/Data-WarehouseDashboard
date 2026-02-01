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
import { UoMGroup } from '../../barcodes/Models/item-barcode.model';
import { Sales, SalesItem, UpdateItemRequest } from '../Models/sales-model';
import { SalesService } from '../Services/sales.service';

@Component({
  selector: 'app-edit-item-modal',
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
  templateUrl: './edit-item-modal.component.html',
  styleUrl: './edit-item-modal.component.scss',
})
export class EditItemModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() item: SalesItem | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  uomGroups: UoMGroup[] = [];
  saving: boolean = false;
  loadingUomGroups: boolean = false;

  constructor(
    private fb: FormBuilder,
    private salesService: SalesService,
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
      saleOrderItemId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      uoMEntry: ['', [Validators.required]]
    });
  }

  populateForm(): void {
    if (this.item) {
      // استخدام salesOrderItemId  حسب ما هو متوفر
      const itemId = (this.item as any).salesOrderItemId || this.item.salesOrderItemId || 0;
      const currentUoMEntry = this.item.uoMEntry || 0;
      
      this.editForm.patchValue({
        saleOrderItemId: itemId,
        quantity: this.item.quantity || 0.01,
        uoMEntry: currentUoMEntry
      });

      // Load UoM groups for this item
      if (this.item.itemId) {
        this.loadUomGroups(this.item.itemId, currentUoMEntry);
      }
    }
  }

  loadUomGroups(itemId: number, selectedUoMEntry?: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];

    this.salesService.getUoMGroupByItemId(itemId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.uomGroups = res.data;
          // If selected UoM entry is provided, ensure it's set in the form
          if (selectedUoMEntry !== undefined) {
            const uomExists = this.uomGroups.some(uom => uom.uomEntry === selectedUoMEntry);
            if (uomExists) {
              this.editForm.patchValue({ uoMEntry: selectedUoMEntry });
            } else if (this.uomGroups.length > 0) {
              // If selected UoM doesn't exist in available groups, select first one
              this.editForm.patchValue({ uoMEntry: this.uomGroups[0].uomEntry });
            }
          }
        } else {
          this.uomGroups = [];
        }
        this.loadingUomGroups = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading UoM groups:', err);
        this.uomGroups = [];
        this.loadingUomGroups = false;
        this.cdr.detectChanges();
      }
    });
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm(): void {
    this.editForm.reset({
      saleOrderItemId: 0,
      quantity: 0.01,
      uoMEntry: ''
    });
    this.uomGroups = [];
  }

  onUpdate(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    const itemData: UpdateItemRequest = {
      SalesOrderItemId: formValue.saleOrderItemId,
      quantity: formValue.quantity,
      uoMEntry: formValue.uoMEntry
    };

    this.salesService.updateSalesItem(itemData).subscribe({
      next: (res: any) => {
        console.log('Item updated:', res);
        this.saving = false;
        this.toastr.success('Item updated successfully', 'Success');
        this.itemUpdated.emit();
        this.onClose();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating item:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error updating item. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }
}
