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
import { PurchaseService } from '../Services/purchase.service';
import { Item } from '../Models/purchase.model';
import { ToastrService } from 'ngx-toastr';

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
  @Input() purchaseOrderId: number = 0;
  @Input() warehouseId: number = 0;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemAdded = new EventEmitter<void>();

  barcodeForm!: FormGroup;
  manualForm!: FormGroup;
  items: Item[] = [];
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
 //   console.log("gggggggggggg");
    this.initializeForms();
    this.loadItems();
  }

  initializeForms(): void {
    this.barcodeForm = this.fb.group({
      barCode: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.manualForm = this.fb.group({
      itemId: ['', Validators.required],
      uoMEntry: [-1, [Validators.required, Validators.min(-1)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
    });
  }

  loadItems(): void {
    console.log("warehouse",this.warehouseId);
    if (!this.warehouseId) return;

    //this.loading = true;
    this.purchaseService.getItemsByWarehouse(this.warehouseId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.items = res.data.map((item: any) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            itemCode: item.itemCode
          }));
        }

        console.log(this.items);
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

  resetForms(): void {
    this.barcodeForm.reset({
      barCode: ''
    });
    this.manualForm.reset({
      itemId: '',
      uoMEntry: -1,
      quantity: 1,
      purchaseOrderId: 3
    });
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
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
      purchaseOrderId: this.purchaseOrderId,
      itemId: formValue.itemId
    };

    this.purchaseService.addItemManually(this.purchaseOrderId, itemData).subscribe({
      next: (res: any) => {
        console.log('Item added manually:', res);
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
}
