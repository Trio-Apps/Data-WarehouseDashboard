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
import { PurchaseService } from '../Services/purchase.service';
import { PurchaseItem, UpdateItemRequest } from '../Models/purchase.model';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../barcodes/Models/item-barcode.model';
import { ItemPriceWithUomResponse, ItemsService } from '../../../Items/Services/items.service';

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
  @Input() item: PurchaseItem | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  uomGroups: UoMGroup[] = [];
  saving: boolean = false;
  loadingUomGroups: boolean = false;
  loadingItemPrices: boolean = false;
  itemPrices: ItemPriceWithUomResponse[] = [];
  filteredItemPrices: ItemPriceWithUomResponse[] = [];
  showUomSuggestions: boolean = false;
  showUnitPriceSuggestions: boolean = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private itemsService: ItemsService,
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
      uoMEntry: ['', [Validators.required]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatPercent: [0, [Validators.min(0)]]
    });

    this.editForm.get('uoMEntry')?.valueChanges.subscribe(() => {
      this.updateFilteredItemPrices();
    });
  }

  populateForm(): void {
    if (this.item) {
      // ط§ط³طھط®ط¯ط§ظ… purchaseItemId ط£ظˆ purchaseOrderItemId ط­ط³ط¨ ظ…ط§ ظ‡ظˆ ظ…طھظˆظپط±
      const itemId = (this.item as any).purchaseOrderItemId || this.item.purchaseItemId || 0;
      const currentUoMEntry = this.item.uoMEntry || 0;
      
      this.editForm.patchValue({
        purchaseOrderItemId: itemId,
        quantity: this.item.quantity || 0.01,
        uoMEntry: currentUoMEntry,
        unitPrice: this.item.unitPrice || 0,
        vatPercent: (this.item as any).vatPercent || 0
      });

      // Load UoM groups for this item
      if (this.item.itemId) {
        this.loadUomGroups(this.item.itemId, currentUoMEntry);
        this.loadItemPrices(this.item.itemId);
      }
    }
  }

  loadUomGroups(itemId: number, selectedUoMEntry?: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];

    this.purchaseService.getUoMGroupByItemId(itemId).subscribe({
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
        this.showUomSuggestions = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading UoM groups:', err);
        this.uomGroups = [];
        this.loadingUomGroups = false;
        this.showUomSuggestions = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadItemPrices(itemId: number): void {
    this.loadingItemPrices = true;
    this.itemPrices = [];
    this.filteredItemPrices = [];
    this.showUnitPriceSuggestions = false;

    this.itemsService.getItemPricesWithUoms(itemId).subscribe({
      next: (prices: ItemPriceWithUomResponse[]) => {
        this.itemPrices = Array.isArray(prices) ? prices : [];
        this.updateFilteredItemPrices();
        this.loadingItemPrices = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading item prices with UoMs:', err);
        this.itemPrices = [];
        this.filteredItemPrices = [];
        this.loadingItemPrices = false;
        this.cdr.detectChanges();
      }
    });
  }

  get selectedUomDisplay(): string {
    const selectedUomEntry = Number(this.editForm?.get('uoMEntry')?.value);
    const selectedUom = this.uomGroups.find((uom) => uom.uomEntry === selectedUomEntry);

    if (!selectedUom) {
      return '';
    }

    return `${selectedUom.uomCode} (Entry: ${selectedUom.uomEntry}, Base Qty: ${selectedUom.baseQty})`;
  }

  onUomFocus(): void {
    this.showUomSuggestions = this.uomGroups.length > 0;
  }

  onUomBlur(): void {
    setTimeout(() => {
      this.showUomSuggestions = false;
      this.cdr.detectChanges();
    }, 150);
  }

  onSelectUom(uom: UoMGroup): void {
    this.editForm.patchValue({ uoMEntry: uom.uomEntry });
    this.editForm.get('uoMEntry')?.markAsTouched();
    this.showUomSuggestions = false;
  }

  onUnitPriceFocus(): void {
    this.showUnitPriceSuggestions = this.filteredItemPrices.length > 0;
  }

  onUnitPriceBlur(): void {
    setTimeout(() => {
      this.showUnitPriceSuggestions = false;
      this.cdr.detectChanges();
    }, 150);
  }

  onSelectUnitPriceSuggestion(price: number | null): void {
    this.editForm.patchValue({ unitPrice: price ?? 0 });
    this.editForm.get('unitPrice')?.markAsTouched();
    this.showUnitPriceSuggestions = false;
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

  private updateFilteredItemPrices(): void {
    const selectedUomEntry = Number(this.editForm?.get('uoMEntry')?.value);

    if (!selectedUomEntry) {
      this.filteredItemPrices = [...this.itemPrices];
      return;
    }

    const sameUomPrices = this.itemPrices.filter((price) => price.uoMEntry === selectedUomEntry);
    this.filteredItemPrices = sameUomPrices.length > 0 ? sameUomPrices : [...this.itemPrices];
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
      uoMEntry: '',
      unitPrice: 0,
      vatPercent: 0
    });
    this.uomGroups = [];
    this.itemPrices = [];
    this.filteredItemPrices = [];
    this.showUomSuggestions = false;
    this.showUnitPriceSuggestions = false;
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
      uoMEntry: formValue.uoMEntry,
      UnitPrice: formValue.unitPrice,
      VatPercent: Number(formValue.vatPercent || 0)
    };

console.log("update Form",itemData);
    this.purchaseService.updatePurchaseItem(itemData.purchaseOrderItemId, itemData).subscribe({
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
