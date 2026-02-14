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
import { PurchaseService } from '../../Services/purchase.service';
import { Item } from '../../Models/purchase.model';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../../barcodes/Models/item-barcode.model';
import { GoodsReturnService } from '../../Services/goods-return.service';

@Component({
  selector: 'app-add-goods-return-item',
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
  templateUrl: './add-goods-return-item.component.html',
  styleUrl: './add-goods-return-item.component.scss',
})
export class AddGoodsReturnItemComponent implements OnInit {
  goodsReturnId: number = 0;
  purchaseOrderId: number = 0;
  receiptOrderId: number = 0;
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
    private purchaseService: PurchaseService,
    private goodsReturnService: GoodsReturnService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.goodsReturnId = +this.route.snapshot.paramMap.get('goodsReturnId')!;
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptOrderId')!;
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
    if (!this.warehouseId) {
      this.items = [];
      this.toastr.error('Warehouse is missing. Please go back and open Add Item again.', 'Error');
      return;
    }

    this.loading = true;
    this.purchaseService.getItemsByWarehouse(this.warehouseId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.items = res.data.map((item: any) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            itemCode: item.itemCode
          }));
        } else {
          this.items = [];
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

    this.purchaseService.getUoMGroupByItemId(itemId).subscribe({
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
      '/processes/purchases/goods-return-order',
      this.purchaseOrderId,
      this.receiptOrderId,
      this.goodsReturnId
    ]);
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    this.saving = true;
    const barcode = this.barcodeForm.value.barCode;

    this.goodsReturnService.addReturnItemByBarcode(this.goodsReturnId, barcode).subscribe({
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
      itemId: formValue.itemId
    };

    this.goodsReturnService.addReturnItemManually(this.goodsReturnId, itemData).subscribe({
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
}
