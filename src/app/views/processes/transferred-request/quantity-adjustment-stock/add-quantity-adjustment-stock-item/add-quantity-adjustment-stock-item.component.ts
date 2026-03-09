import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  FormModule,
  CardModule,
  GridModule,
  UtilitiesModule,
  GutterDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../../barcodes/Models/item-barcode.model';
import { QuantityAdjustmentStockService } from '../../Services/quantity-adjustment-stock.service';
import { SearchItemModalComponent } from '../../../Item/search-item-modal/search-item-modal.component';
import { WarehouseItemLookup } from '../../../../Items/Services/items.service';
import { ItemBarcodeService } from '../../../barcodes/Services/item-barcode.service';

@Component({
  selector: 'app-add-quantity-adjustment-stock-item',
  imports: [
    CommonModule,
    ButtonModule,
    FormModule,
    CardModule,
    GridModule,
    UtilitiesModule,
    ReactiveFormsModule,
    GutterDirective,
    IconDirective,
    SearchItemModalComponent
  ],
  templateUrl: './add-quantity-adjustment-stock-item.component.html',
  styleUrl: './add-quantity-adjustment-stock-item.component.scss'
})
export class AddQuantityAdjustmentStockItemComponent implements OnInit {
  quantityAdjustmentStockId = 0;
  warehouseId = 0;

  barcodeForm!: FormGroup;
  manualForm!: FormGroup;
  uomGroups: UoMGroup[] = [];

  saving = false;
  loadingUomGroups = false;
  activeTab: 'barcode' | 'manual' = 'barcode';
  showItemSearchModal = false;
  selectedItemDisplay = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private itemBarcodeService: ItemBarcodeService,
    private quantityAdjustmentStockService: QuantityAdjustmentStockService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.quantityAdjustmentStockId = +(this.route.snapshot.paramMap.get('quantityAdjustmentStockId') || 0);
    this.warehouseId = +(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.initializeForms();
  }

  private initializeForms(): void {
    this.barcodeForm = this.fb.group({
      barCode: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.manualForm = this.fb.group({
      itemId: [0, Validators.required],
      uoMEntry: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [null, [Validators.min(0)]]
    });

    this.manualForm.get('itemId')?.valueChanges.subscribe((itemId) => {
      const selectedItemId = Number(itemId || 0);
      if (!selectedItemId) {
        this.uomGroups = [];
        this.manualForm.patchValue({ uoMEntry: '', quantity: 1 }, { emitEvent: false });
        this.cdr.detectChanges();
        return;
      }

      this.loadUomGroups(selectedItemId);
    });
  }

  private loadUomGroups(itemId: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];
    this.manualForm.patchValue({ uoMEntry: '' }, { emitEvent: false });

    this.itemBarcodeService.getUoMGroupByItemId(itemId).subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.uomGroups = res.data;
          if (this.uomGroups.length > 0) {
            this.manualForm.patchValue({ uoMEntry: this.uomGroups[0].uomEntry }, { emitEvent: false });
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

  onCancel(): void {
    this.router.navigate([
      '/processes/quantity-adjustment-stock/quantity-adjustment-stock',
      this.quantityAdjustmentStockId
    ]);
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.barcodeForm.markAllAsTouched();
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    if (!this.quantityAdjustmentStockId) {
      this.toastr.error('Quantity adjustment stock ID is missing.', 'Error');
      return;
    }

    this.saving = true;
    const barcode = String(this.barcodeForm.value.barCode || '');

    this.quantityAdjustmentStockService
      .addQuantityAdjustmentStockItemByBarcode(this.quantityAdjustmentStockId, barcode)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Item added successfully by barcode', 'Success');
          this.onCancel();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error adding quantity adjustment item by barcode:', err);
          this.saving = false;
          const errorMessage = err?.error?.message || 'Error adding item. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
  }

  onAddManually(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    if (!this.quantityAdjustmentStockId) {
      this.toastr.error('Quantity adjustment stock ID is missing.', 'Error');
      return;
    }

    this.saving = true;
    const formValue = this.manualForm.value;
    const unitPriceValue = formValue.unitPrice;

    const itemData = {
      uoMEntry: Number(formValue.uoMEntry),
      quantity: Number(formValue.quantity),
      unitPrice:
        unitPriceValue === null || unitPriceValue === undefined || unitPriceValue === ''
          ? undefined
          : Number(unitPriceValue),
      itemId: Number(formValue.itemId),
      quantityAdjustmentStockId: this.quantityAdjustmentStockId
    };

    this.quantityAdjustmentStockService
      .addQuantityAdjustmentStockItemManually(this.quantityAdjustmentStockId, itemData)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Item added successfully', 'Success');
          this.onCancel();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error adding quantity adjustment item manually:', err);
          this.saving = false;
          const errorMessage = err?.error?.message || 'Error adding item. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
  }

  onOpenItemSearchModal(): void {
    this.showItemSearchModal = true;
  }

  onItemSearchModalVisibleChange(visible: boolean): void {
    this.showItemSearchModal = visible;
  }

  onItemSelected(item: WarehouseItemLookup): void {
    const selectedItemId = Number(item.itemId || 0);

    this.manualForm.patchValue({
      itemId: selectedItemId
    });
    this.manualForm.get('itemId')?.markAsTouched();
    this.selectedItemDisplay = this.getItemDisplayLabel(item);
    this.showItemSearchModal = false;
    this.cdr.detectChanges();
  }

  onItemSelectionCleared(): void {
    this.manualForm.patchValue({
      itemId: 0,
      uoMEntry: '',
      quantity: 1,
      unitPrice: null
    });
    this.manualForm.get('itemId')?.markAsTouched();
    this.selectedItemDisplay = '';
    this.uomGroups = [];
    this.showItemSearchModal = false;
    this.cdr.detectChanges();
  }

  private getItemDisplayLabel(item: WarehouseItemLookup): string {
    const code = item.itemCode?.trim() || '';
    const name = item.itemName?.trim() || '';
    if (code && name) {
      return `${name} (${code})`;
    }
    return name || code || `#${item.itemId}`;
  }
}
