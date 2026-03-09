import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../../barcodes/Models/item-barcode.model';
import {
  QuantityAdjustmentStockItem,
  UpdateQuantityAdjustmentStockItemRequest
} from '../../Models/quantity-adjustment-stock.model';
import { QuantityAdjustmentStockService } from '../../Services/quantity-adjustment-stock.service';
import { ItemBarcodeService } from '../../../barcodes/Services/item-barcode.service';




@Component({
  selector: 'app-edit-quantity-adjustment-stock-item-modal',
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
  templateUrl: './edit-quantity-adjustment-stock-item-modal.component.html',
  styleUrl: './edit-quantity-adjustment-stock-item-modal.component.scss'
})
export class EditQuantityAdjustmentStockItemModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() item: QuantityAdjustmentStockItem | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  uomGroups: UoMGroup[] = [];
  saving = false;
  loadingUomGroups = false;

  constructor(
    private fb: FormBuilder,
    private quantityAdjustmentStockService: QuantityAdjustmentStockService,
    private itemBarcodeService: ItemBarcodeService,
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

  private initializeForm(): void {
    this.editForm = this.fb.group({
      quantityAdjustmentStockItemId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      uoMEntry: ['', Validators.required],
      unitPrice: [0, [Validators.min(0)]]
    });
  }

  private populateForm(): void {
    if (!this.item) {
      return;
    }

    const itemId = this.item.quantityAdjustmentStockItemId || 0;
    const currentUoMEntry = this.item.uoMEntry || 0;

    this.editForm.patchValue({
      quantityAdjustmentStockItemId: itemId,
      quantity: this.item.quantity || 0.01,
      uoMEntry: currentUoMEntry,
      unitPrice: this.item.unitPrice ?? 0
    });

    if (this.item.itemId) {
      this.loadUomGroups(this.item.itemId, currentUoMEntry);
    }
  }

  private loadUomGroups(itemId: number, selectedUoMEntry?: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];

    this.itemBarcodeService.getUoMGroupByItemId(itemId).subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.uomGroups = res.data;

          if (selectedUoMEntry !== undefined) {
            const exists = this.uomGroups.some((uom) => uom.uomEntry === selectedUoMEntry);
            if (exists) {
              this.editForm.patchValue({ uoMEntry: selectedUoMEntry });
            } else if (this.uomGroups.length > 0) {
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

  private resetForm(): void {
    this.editForm.reset({
      quantityAdjustmentStockItemId: 0,
      quantity: 0.01,
      uoMEntry: '',
      unitPrice: 0
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
    const quantityAdjustmentStockItemId = Number(formValue.quantityAdjustmentStockItemId);

    const unitPriceValue = formValue.unitPrice;
    const itemData: UpdateQuantityAdjustmentStockItemRequest = {
      quantityAdjustmentStockItemId,
      quantity: Number(formValue.quantity),
      uoMEntry: Number(formValue.uoMEntry),
      unitPrice:
        unitPriceValue === null || unitPriceValue === undefined || unitPriceValue === ''
          ? undefined
          : Number(unitPriceValue)
    };

    this.quantityAdjustmentStockService
      .updateQuantityAdjustmentStockItem(quantityAdjustmentStockItemId, itemData)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Item updated successfully', 'Success');
          this.itemUpdated.emit();
          this.onClose();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating quantity adjustment stock item:', err);
          this.saving = false;
          const errorMessage = err?.error?.message || 'Error updating item. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
  }
}
