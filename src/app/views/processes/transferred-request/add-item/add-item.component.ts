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
import { UoMGroup } from '../../barcodes/Models/item-barcode.model';
import { TransferredRequestService } from '../Services/transferred-request.service';
import { SearchItemModalComponent } from '../../Item/search-item-modal/search-item-modal.component';
import { WarehouseItemLookup } from '../../../Items/Services/items.service';

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
    SearchItemModalComponent
  ],
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss'
})
export class AddItemComponent implements OnInit {
  transferredRequestId = 0;
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
    private transferredRequestService: TransferredRequestService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.transferredRequestId = +this.route.snapshot.paramMap.get('transferredRequestId')!;
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
      unitPrice: [0, [Validators.min(0)]],
      vatPercent: [0, [Validators.min(0)]]
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

    this.transferredRequestService.getUoMGroupByItemId(itemId).subscribe({
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
    this.router.navigate([
      '/processes/transferred-request/transferred-request-items',
      this.transferredRequestId
    ]);
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.barcodeForm.markAllAsTouched();
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    this.saving = true;
    const barcode = this.barcodeForm.value.barCode;

    this.transferredRequestService.addItemByBarcode(this.transferredRequestId, barcode).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Item added successfully by barcode', 'Success');
        this.router.navigate([
          '/processes/transferred-request/transferred-request-items',
          this.transferredRequestId
        ]);
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
      VatPercent: Number(formValue.vatPercent || 0),
      transferredRequestId: this.transferredRequestId,
      itemId: formValue.itemId
    };

    
    this.transferredRequestService.addItemManually(this.transferredRequestId, itemData).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Item added successfully', 'Success');
        this.router.navigate([
          '/processes/transferred-request/transferred-request-items',
          this.transferredRequestId
        ]);
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

  private getItemDisplayLabel(item: WarehouseItemLookup): string {
    const code = item.itemCode?.trim() || '';
    const name = item.itemName?.trim() || '';

    if (code && name) {
      return `${name} (${code})`;
    }

    return name || code || `#${item.itemId}`;
  }
}
