import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import {
  ButtonModule,
  FormModule,
  CardModule,
  GridModule,
  UtilitiesModule,
  GutterDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SalesService } from '../../Services/sales.service';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../../barcodes/Models/item-barcode.model';
import { SalesReturnService } from '../../Services/sales-return.service';
import { SearchItemModalComponent } from '../../../Item/search-item-modal/search-item-modal.component';
import { WarehouseItemLookup } from '../../../../Items/Services/items.service';

@Component({
  selector: 'app-add-sales-return-item',
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
  templateUrl: './add-sales-return-item.component.html',
  styleUrl: './add-sales-return-item.component.scss',
})
export class AddSalesReturnItemComponent implements OnInit {
  salesReturnId: number = 0;
  salesOrderId: number = 0;
  warehouseId: number = 0;

  barcodeForm!: FormGroup;
  manualForm!: FormGroup;
  uomGroups: UoMGroup[] = [];
  saving: boolean = false;
  loadingUomGroups: boolean = false;
  activeTab: 'barcode' | 'manual' = 'barcode';
  showItemSearchModal: boolean = false;
  selectedItemDisplay: string = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private location: Location,
    private salesService: SalesService,
    private salesReturnService: SalesReturnService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesReturnId = +this.route.snapshot.paramMap.get('salesReturnId')!;
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;

    this.initializeForms();
  }

  initializeForms(): void {
    this.barcodeForm = this.fb.group({
      barCode: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.manualForm = this.fb.group({
      itemId: ['', Validators.required],
      uoMEntry: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatPercent: [0, [Validators.min(0)]],
    });

    this.manualForm.get('itemId')?.valueChanges.subscribe((itemId) => {
      if (itemId) {
        this.loadUomGroups(itemId);
      } else {
        this.uomGroups = [];
        this.manualForm.patchValue({ uoMEntry: '' });
      }
    });
  }

  onOpenItemSearchModal(): void {
    if (!this.warehouseId) {
      this.toastr.warning('Warehouse is missing. Please go back and open Add Item again.', 'Warning');
      return;
    }

    this.showItemSearchModal = true;
  }

  onItemSearchModalVisibleChange(visible: boolean): void {
    this.showItemSearchModal = visible;
  }

  onItemSelected(item: WarehouseItemLookup): void {
    this.manualForm.patchValue({ itemId: item.itemId });
    this.manualForm.get('itemId')?.markAsTouched();
    this.selectedItemDisplay = this.getItemDisplayLabel(item);
    this.showItemSearchModal = false;
    this.cdr.detectChanges();
  }

  onItemSelectionCleared(): void {
    this.manualForm.patchValue({ itemId: '' });
    this.manualForm.get('itemId')?.markAsTouched();
    this.selectedItemDisplay = '';
    this.uomGroups = [];
    this.manualForm.patchValue({ uoMEntry: '' });
    this.showItemSearchModal = false;
    this.cdr.detectChanges();
  }

  loadUomGroups(itemId: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];
    this.manualForm.patchValue({ uoMEntry: '' });

    this.salesService.getUoMGroupByItemId(itemId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.uomGroups = res.data;
          if (this.uomGroups.length > 0) {
            this.manualForm.patchValue({ uoMEntry: this.uomGroups[0].uomEntry });
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
    this.location.back();
  }

  private getItemDisplayLabel(item: WarehouseItemLookup): string {
    const code = item.itemCode?.trim() || '';
    const name = item.itemName?.trim() || '';

    if (code && name) {
      return `${name} (${code})`;
    }

    return name || code || `#${item.itemId}`;
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    this.saving = true;
    const barcode = this.barcodeForm.value.barCode;

    this.salesReturnService.addReturnItemByBarcode(this.salesReturnId, barcode).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Item added successfully by barcode', 'Success');
        this.onCancel();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error adding return item by barcode:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error adding item. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddManually(): void {
    if (this.manualForm.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.manualForm.value;

    const itemData = {
      uoMEntry: formValue.uoMEntry,
      quantity: formValue.quantity,
      UnitPrice: formValue.unitPrice,
      VatPercent: Number(formValue.vatPercent || 0),
      itemId: formValue.itemId
    };

    this.salesReturnService.addReturnItemManually(this.salesReturnId, itemData).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Item added successfully', 'Success');
        this.onCancel();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error adding return item manually:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error adding item. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  get lineTotalBeforeVat(): number {
    const quantity = Number(this.manualForm?.get('quantity')?.value) || 0;
    const unitPrice = Number(this.manualForm?.get('unitPrice')?.value) || 0;
    return quantity * unitPrice;
  }

  get vatAmount(): number {
    const vatPercent = Number(this.manualForm?.get('vatPercent')?.value) || 0;
    return (this.lineTotalBeforeVat * vatPercent) / 100;
  }

  get lineTotalAfterVat(): number {
    return this.lineTotalBeforeVat + this.vatAmount;
  }
}
