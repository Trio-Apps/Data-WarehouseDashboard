import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PurchaseService } from '../Services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../barcodes/Models/item-barcode.model';
import { SearchItemModalComponent } from '../../Item/search-item-modal/search-item-modal.component';
import { WarehouseItemLookup } from '../../../Items/Services/items.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-add-item',
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
    SearchItemModalComponent,
    TranslatePipe
  ],
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss',
})
export class AddItemComponent implements OnInit {
  purchaseOrderId: number = 0;
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
    private router: Router,
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
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
    });

    // Listen to item selection changes
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

    this.purchaseService.getUoMGroupByItemId(itemId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.uomGroups = res.data;
          // Auto-select first UoM if available
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
    this.router.navigate(['/processes/purchases/purchase-items', this.purchaseOrderId]);
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.barcodeForm.markAllAsTouched();
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    this.saving = true;
    const barcode = this.barcodeForm.value.barCode;

    this.purchaseService.addItemByBarcode(this.purchaseOrderId, barcode).subscribe({
      next: (res: any) => {
        console.log('Item added by barcode:', res);
        this.saving = false;
        this.toastr.success('Item added successfully by barcode', 'Success');
        // العودة لصفحة عرض العناصر
        this.router.navigate(['/processes/purchases/purchase-items', this.purchaseOrderId]);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error adding item by barcode:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error adding item. Please try again.';
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

    this.saving = true;
    const formValue = this.manualForm.value;

    const itemData = {
      uoMEntry: formValue.uoMEntry,
      quantity: formValue.quantity,
      UnitPrice: formValue.unitPrice,
      purchaseOrderId: this.purchaseOrderId,
      itemId: formValue.itemId
    };

    this.purchaseService.addItemManually(this.purchaseOrderId, itemData).subscribe({
      next: (res: any) => {
        console.log('Item added manually:', res);
        this.saving = false;
        this.toastr.success('Item added successfully', 'Success');
        // العودة لصفحة عرض العناصر
        this.router.navigate(['/processes/purchases/purchase-items', this.purchaseOrderId]);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error adding item manually:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error adding item. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
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
