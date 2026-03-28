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
import { ReturnItem, UpdateReturnItemRequest } from '../../Models/sales-return-model';
import { SalesReturnService } from '../../Services/sales-return.service';
import { UpdateGeneralItemRequest } from '../../../Models/general-order';

@Component({
  selector: 'app-edit-return-item-modal',
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
  templateUrl: './edit-return-item-modal.component.html',
  styleUrl: './edit-return-item-modal.component.scss',
})
export class EditReturnItemModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() item: ReturnItem | null = null;
  @Input() hasReference: boolean = true;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  uomGroups: UoMGroup[] = [];
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
      salesReturnOrderItemId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      uoMEntry: [0, Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatPercent: [0, [Validators.min(0)]],
      comment: ['']
    });
  }

  populateForm(): void {
    if (this.item) {
      const itemId = this.item.salesReturnOrderItemId || 0;
      this.editForm.patchValue({
        salesReturnOrderItemId: itemId,
        quantity: this.item.quantity || 0.01,
        uoMEntry: this.item.uoMEntry || 0,
        unitPrice: this.item.unitPrice || 0,
        vatPercent: this.item.vatPercent || 0,
        comment: this.item.comment || ''
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
      salesReturnOrderItemId: 0,
      quantity: 0.01,
      uoMEntry: 0,
      unitPrice: 0,
      vatPercent: 0,
      comment: ''
    });
  }

  get lineTotalBeforeVat(): number {
    const quantity = Number(this.editForm?.get('quantity')?.value) || 0;
    const unitPrice = Number(this.editForm?.get('unitPrice')?.value) || 0;
    return quantity * unitPrice;
  }

  get vatAmount(): number {
    const vatPercent = Number(this.editForm?.get('vatPercent')?.value) || 0;
    return (this.lineTotalBeforeVat * vatPercent) / 100;
  }

  get lineTotalAfterVat(): number {
    return this.lineTotalBeforeVat + this.vatAmount;
  }

  onUpdate(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    const returnItemId = formValue.salesReturnOrderItemId;
    const request$ = this.hasReference
      ? this.returnService.updateReturnItem(returnItemId, {
          salesReturnOrderItemId: returnItemId,
          quantity: Number(formValue.quantity),
          uoMEntry: Number(formValue.uoMEntry),
          UnitPrice: Number(formValue.unitPrice || 0),
          VatPercent: Number(formValue.vatPercent || 0),
          comment: formValue.comment
        } as UpdateReturnItemRequest)
      : this.returnService.updateReturnItemWithoutReference(returnItemId, {
          quantity: Number(formValue.quantity),
          uoMEntry: Number(formValue.uoMEntry),
          UnitPrice: Number(formValue.unitPrice || 0),
          VatPercent: Number(formValue.vatPercent || 0)
        } as UpdateGeneralItemRequest);

    request$.subscribe({
      next: (_res: any) => {
        this.saving = false;
        this.toastr.success('Item updated successfully', 'Success');
        this.itemUpdated.emit();
        this.onClose();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        const errorMessage = err.error?.message || 'Error updating item. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }
}
