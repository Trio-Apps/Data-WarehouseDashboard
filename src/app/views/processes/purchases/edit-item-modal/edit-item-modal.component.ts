import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalModule,
  ButtonModule,
  FormModule,
  CardModule,
  UtilitiesModule
} from '@coreui/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PurchaseService } from '../Services/purchase.service';
import { PurchaseItem, UpdateItemRequest } from '../Models/purchase.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-item-modal',
  imports: [
    CommonModule,
    ModalModule,
    ButtonModule,
    FormModule,
    CardModule,
    UtilitiesModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './edit-item-modal.component.html',
  styleUrl: './edit-item-modal.component.scss',
})
export class EditItemModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() item: PurchaseItem | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
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
      purchaseOrderItemId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      uoMEntry: [0, [Validators.required]]
    });
  }

  populateForm(): void {
    if (this.item) {
      // استخدام purchaseItemId أو purchaseOrderItemId حسب ما هو متوفر
      const itemId = (this.item as any).purchaseOrderItemId || this.item.purchaseItemId || 0;
      this.editForm.patchValue({
        purchaseOrderItemId: itemId,
        quantity: this.item.quantity || 0.01,
        uoMEntry: this.item.uoMEntry || 0
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
      purchaseOrderItemId: 0,
      quantity: 0.01,
      uoMEntry: 0
    });
  }

  onUpdate(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    const itemData: UpdateItemRequest = {
      purchaseOrderItemId: formValue.purchaseOrderItemId,
      quantity: formValue.quantity,
      uoMEntry: formValue.uoMEntry
    };

    this.purchaseService.updatePurchaseItem(itemData).subscribe({
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
