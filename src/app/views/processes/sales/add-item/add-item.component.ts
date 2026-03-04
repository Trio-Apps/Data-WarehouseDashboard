import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  FormModule,
  CardModule,
  GridModule,
  UtilitiesModule,
  GutterDirective,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../barcodes/Models/item-barcode.model';
import { Item } from '../Models/sales-model';
import { SalesService } from '../Services/sales.service';

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
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    IconDirective
  ],
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss',
})
export class AddItemComponent implements OnInit {
  salesOrderId: number = 0;
  warehouseId: number = 0;

  barcodeForm!: FormGroup;
  manualForm!: FormGroup;
  items: Item[] = [];
  uomGroups: UoMGroup[] = [];
  loading: boolean = false;
  saving: boolean = false;
  loadingUomGroups: boolean = false;
  activeTab: 'barcode' | 'manual' = 'barcode';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private salesService: SalesService,

    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;

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

  loadItems(): void {
    if (!this.warehouseId) return;

    this.loading = true;
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

  loadUomGroups(itemId: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];
    this.manualForm.patchValue({ uoMEntry: '' });
 
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
    this.router.navigate(['/processes/sales/sales-items', this.salesOrderId]);
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    this.saving = true;
    const barcode = this.barcodeForm.value.barCode;

    this.salesService.addItemByBarcode(this.salesOrderId, barcode).subscribe({
      next: (res: any) => {
        console.log('Item added by barcode:', res);
        this.saving = false;
        this.toastr.success('Item added successfully by barcode', 'Success');
        // العودة لصفحة عرض العناصر
        this.router.navigate(['/processes/sales/sales-items', this.salesOrderId]);
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
      next: (res: any) => {
        console.log('Item added manually:', res);
        this.saving = false;
        this.toastr.success('Item added successfully', 'Success');
        // العودة لصفحة عرض العناصر
        this.router.navigate(['/processes/sales/sales-items', this.salesOrderId]);
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
