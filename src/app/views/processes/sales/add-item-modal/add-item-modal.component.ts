
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
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { SalesService } from '../Services/sales.service';
import { Item } from '../Models/sales-model';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../barcodes/Models/item-barcode.model';

@Component({
  selector: 'app-add-item-modal',
  imports: [
    CommonModule,
    ModalModule,
    ButtonModule,
    FormModule,
    CardModule,
    UtilitiesModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule
  ],
  templateUrl: './add-item-modal.component.html',
  styleUrl: './add-item-modal.component.scss',
})
export class AddItemModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() salesOrderId: number = 0;
  @Input() warehouseId: number = 0;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemAdded = new EventEmitter<void>();

  barcodeForm!: FormGroup;
  manualForm!: FormGroup;
  items: Item[] = [];
  uomGroups: UoMGroup[] = [];
  loading: boolean = false;
  saving: boolean = false;
  loadingUomGroups: boolean = false;

  constructor(
    private fb: FormBuilder,
    private salesService: SalesService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadItems();
  }

  initializeForms(): void {
    this.barcodeForm = this.fb.group({
      barCode: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.manualForm = this.fb.group({
      itemId: ['', Validators.required],
      uoMEntry: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
    });
    this.setUomEntryDisabledState();

    // Listen to item selection changes
    this.manualForm.get('itemId')?.valueChanges.subscribe((itemId) => {
      if (itemId) {
        this.loadUomGroups(itemId);
      } else {
        this.uomGroups = [];
        this.manualForm.patchValue({ uoMEntry: '' });
        this.setUomEntryDisabledState();
      }
    });
  }

  loadItems(): void {
    if (!this.warehouseId) return;

    this.salesService.getItemForSalesByWarehouse(this.warehouseId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.items = res.data.map((item: any) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            itemCode: item.itemCode
          }));
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading items:', err);
        this.loading = false;
        this.toastr.error('Failed to load items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForms();
  }

  loadUomGroups(itemId: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];
    this.manualForm.patchValue({ uoMEntry: '' });
    this.setUomEntryDisabledState();

    this.salesService.getUoMGroupByItemId(itemId).subscribe({
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
        this.setUomEntryDisabledState();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading UoM groups:', err);
        this.uomGroups = [];
        this.loadingUomGroups = false;
        this.setUomEntryDisabledState();
        this.cdr.detectChanges();
      }
    });
  }

  resetForms(): void {
    this.barcodeForm.reset({
      barCode: ''
    });
    this.manualForm.reset({
      itemId: '',
      uoMEntry: '',
      quantity: 1
    });
    this.uomGroups = [];
    this.setUomEntryDisabledState();
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    this.saving = true;
    const barcode = this.barcodeForm.value.barCode;

    this.salesService.addItemByBarcode(this.salesOrderId, barcode).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Item added successfully by barcode', 'Success');
        this.itemAdded.emit();
        this.onClose();
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
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.manualForm.value;

    const itemData = {
      uoMEntry: formValue.uoMEntry,
      quantity: formValue.quantity,
      salesOrderId: this.salesOrderId,
      itemId: formValue.itemId
    };

    this.salesService.addItemManually(this.salesOrderId, itemData).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Item added successfully', 'Success');
        this.itemAdded.emit();
        this.onClose();
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

  displayItemName(itemId: number | null): string {
    const item = this.items.find(i => i.itemId === itemId);
    return item ? `${item.itemName} (${item.itemCode})` : '';
  }

  private setUomEntryDisabledState(): void {
    const uomControl = this.manualForm.get('uoMEntry');
    const hasItem = !!this.manualForm.get('itemId')?.value;
    const shouldDisable = this.loadingUomGroups || !hasItem;

    if (shouldDisable) {
      uomControl?.disable({ emitEvent: false });
      return;
    }

    uomControl?.enable({ emitEvent: false });
  }
}
