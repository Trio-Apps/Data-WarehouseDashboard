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
import { TransferredRequestItem } from '../../Models/transferred-request.model';
import { TransferredRequestService } from '../../Services/transferred-request.service';
import { TransferredStockService } from '../../Services/transferred-stock.service';
import { SearchItemModalComponent } from '../../../Item/search-item-modal/search-item-modal.component';
import { WarehouseItemLookup } from '../../../../Items/Services/items.service';

@Component({
  selector: 'app-add-transferred-stock-item',
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
  templateUrl: './add-transferred-stock-item.component.html',
  styleUrl: './add-transferred-stock-item.component.scss'
})
export class AddTransferredStockItemComponent implements OnInit {
  transferredRequestId = 0;
  transferredStockId = 0;
  warehouseId = 0;

  barcodeForm!: FormGroup;
  manualForm!: FormGroup;
  requestItems: TransferredRequestItem[] = [];
  uomGroups: UoMGroup[] = [];

  loading = false;
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
    private transferredStockService: TransferredStockService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.transferredRequestId = +(this.route.snapshot.paramMap.get('transferredRequestId') || 0);
    this.transferredStockId = +(this.route.snapshot.paramMap.get('transferredStockId') || 0);
    this.warehouseId = +(this.route.snapshot.paramMap.get('warehouseId') || 0);

    this.initializeForms();
   // this.loadRequestItems();
  }

  private initializeForms(): void {
    this.barcodeForm = this.fb.group({
      barCode: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.manualForm = this.fb.group({
      transferredRequestItemId: [0],
      itemId: [0, Validators.required],
      uoMEntry: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.min(0)]],
      vatPercent: [0, [Validators.min(0)]]
    });

    this.manualForm.get('itemId')?.valueChanges.subscribe((itemId) => {
      const selectedItemId = Number(itemId || 0);
      if (!selectedItemId) {
        this.uomGroups = [];
        this.manualForm.patchValue(
          { transferredRequestItemId: 0, uoMEntry: '', quantity: 1 },
          { emitEvent: false }
        );
        this.cdr.detectChanges();
        return;
      }

      const requestItem = this.findRequestItemByItemId(selectedItemId);
      this.manualForm.patchValue({
        transferredRequestItemId: Number(requestItem?.transferredRequestItemId || 0),
        quantity: Number(requestItem?.quantity || this.manualForm.get('quantity')?.value || 1)
      });

      this.loadUomGroups(selectedItemId);
    });
  }

  // private loadRequestItems(): void {
  //   if (this.transferredRequestId > 0) {
  //     this.fetchRequestItems();
  //     return;
  //   }

  //   if (this.transferredStockId > 0) {
  //     this.resolveRequestFromStock();
  //     return;
  //   }

  //   this.toastr.warning('Transferred request is missing.', 'Warning');
  //   this.requestItems = [];
  //   this.cdr.detectChanges();
  // }

  // private resolveRequestFromStock(): void {
  //   this.loading = true;

  //   this.transferredStockService.getTransferredStockById(this.transferredStockId).subscribe({
  //     next: (res: any) => {
  //       const stock = res?.data;
  //     //  this.transferredRequestId = Number(stock?.transferredRequestId || 0);
  //   //    this.warehouseId = Number(stock?.warehouseId || this.warehouseId || 0);

  //       if (this.transferredRequestId > 0) {
  //         this.fetchRequestItems();
  //         return;
  //       }

  //       this.loading = false;
  //       this.requestItems = [];
  //       this.toastr.warning('Parent transferred request was not found.', 'Warning');
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error('Error resolving transferred request from stock:', err);
  //       this.loading = false;
  //       this.requestItems = [];
  //       this.toastr.error('Failed to load transferred stock details.', 'Error');
  //       this.cdr.detectChanges();
  //     }
  //   });
  // }

  // private fetchRequestItems(): void {
  //   this.loading = true;

  //   this.transferredRequestService.getItemsByTransferredRequestId(this.transferredRequestId).subscribe({
  //     next: (res: any) => {
  //       const data = res?.data;
  //       if (Array.isArray(data)) {
  //         this.requestItems = data;
  //       } else if (Array.isArray(data?.data)) {
  //         this.requestItems = data.data;
  //       } else {
  //         this.requestItems = [];
  //       }

  //       this.loading = false;
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error('Error loading transferred request items:', err);
  //       this.loading = false;
  //       this.requestItems = [];
  //       this.toastr.error('Failed to load transferred request items. Please try again.', 'Error');
  //       this.cdr.detectChanges();
  //     }
  //   });
  // }

  
  private loadUomGroups(itemId: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];
    this.manualForm.patchValue({ uoMEntry: '' }, { emitEvent: false });

    this.transferredRequestService.getUoMGroupByItemId(itemId).subscribe({
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
      '/processes/transferred-request/transferred-stock',
      this.transferredRequestId || 0,
      this.transferredStockId
    ]);
  }

  onAddByBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.barcodeForm.markAllAsTouched();
      this.toastr.error('Please enter a valid barcode', 'Validation Error');
      return;
    }

    if (!this.transferredStockId) {
      this.toastr.error('Transferred stock ID is missing.', 'Error');
      return;
    }

    this.saving = true;
    const barcode = String(this.barcodeForm.value.barCode || '');

    this.transferredStockService
      .addTransferredStockItemByBarcode(this.transferredStockId, barcode)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Item added successfully by barcode', 'Success');
          this.onCancel();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error adding stock item by barcode:', err);
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

    if (!this.transferredStockId) {
      this.toastr.error('Transferred stock ID is missing.', 'Error');
      return;
    }

    this.saving = true;
    const formValue = this.manualForm.value;
    const transferredRequestItemId = Number(formValue.transferredRequestItemId || 0);

    if (this.transferredRequestId > 0 && !transferredRequestItemId) {
      this.saving = false;
      this.toastr.error(
        'Selected item is not found in transferred request items.',
        'Validation Error'
      );
      return;
    }

    const itemData = {
      uoMEntry: Number(formValue.uoMEntry),
      quantity: Number(formValue.quantity),
      UnitPrice: Number(formValue.unitPrice || 0),
      VatPercent: Number(formValue.vatPercent || 0),
      transferredStockId: this.transferredStockId,
      itemId: Number(formValue.itemId),
      transferredRequestItemId
    };

    this.transferredStockService
      .addTransferredStockItemManually(this.transferredStockId, itemData)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Item added successfully', 'Success');
          this.onCancel();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error adding stock item manually:', err);
          this.saving = false;
          const errorMessage = err?.error?.message || 'Error adding item. Please try again.';
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

  onOpenItemSearchModal(): void {
    this.showItemSearchModal = true;
  }

  onItemSearchModalVisibleChange(visible: boolean): void {
    this.showItemSearchModal = visible;
  }

  onItemSelected(item: WarehouseItemLookup): void {
    const selectedItemId = Number(item.itemId || 0);
    const requestItem = this.findRequestItemByItemId(selectedItemId);

    this.manualForm.patchValue({
      itemId: selectedItemId,
      transferredRequestItemId: Number(requestItem?.transferredRequestItemId || 0),
      quantity: Number(requestItem?.quantity || 1)
    });
    this.manualForm.get('itemId')?.markAsTouched();
    this.selectedItemDisplay = this.getItemDisplayLabel(item);
    this.showItemSearchModal = false;
    this.cdr.detectChanges();
  }

  onItemSelectionCleared(): void {
    this.manualForm.patchValue({
      itemId: 0,
      transferredRequestItemId: 0,
      uoMEntry: '',
      quantity: 1,
      unitPrice: 0,
      vatPercent: 0
    });
    this.manualForm.get('itemId')?.markAsTouched();
    this.selectedItemDisplay = '';
    this.uomGroups = [];
    this.showItemSearchModal = false;
    this.cdr.detectChanges();
  }

  private findRequestItemByItemId(itemId: number): TransferredRequestItem | undefined {
    return this.requestItems.find((item) => Number(item.itemId) === Number(itemId));
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
