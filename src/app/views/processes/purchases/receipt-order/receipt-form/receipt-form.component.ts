import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormModule,
  CardModule,
  ButtonModule,
  GridModule,
  GutterDirective,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PurchaseService } from '../../Services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../../Services/receipt.service';
import { Receipt } from '../../Models/receipt';
import { Supplier } from '../../Models/purchase.model';

@Component({
  selector: 'app-receipt-form',
  imports: [
    CommonModule,
    FormModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    GridModule,
    GutterDirective,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective
  ],
  templateUrl: './receipt-form.component.html',
  styleUrl: './receipt-form.component.scss',
})
export class ReceiptFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  receiptId: number | null = null;
  purchaseOrderId: number = 0;
  warehouseId: number = 0;
  suppliers: Supplier[] = [];
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private receiptService: ReceiptService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.purchaseOrderId = +(this.route.snapshot.paramMap.get('purchaseOrderId') || 0);
    this.receiptId = +(this.route.snapshot.paramMap.get('receiptId') || 0);
    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

    this.isEditMode = !!this.receiptId;

    this.initializeForm();
    this.configureFormForWithoutReference();

    if (this.isEditMode && this.receiptId) {
      this.loadReceipt();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      isDraft: [true],
      supplierId: [''],
      warehouseId: [null]
    });
  }

  private configureFormForWithoutReference(): void {
    if (this.purchaseOrderId !== 0) {
      return;
    }

    this.form.get('supplierId')?.setValidators([Validators.required]);
    this.form.get('warehouseId')?.setValidators([Validators.required, Validators.min(1)]);
    this.form.patchValue({
      warehouseId: this.warehouseId > 0 ? this.warehouseId : null
    });
    this.form.get('supplierId')?.updateValueAndValidity();
    this.form.get('warehouseId')?.updateValueAndValidity();
    this.loadSuppliers();
  }

  private loadSuppliers(): void {
    this.purchaseService.getSuppliers().subscribe({
      next: (res: any) => {
        const rawSuppliers = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];

        this.suppliers = rawSuppliers
          .map((s: any) => ({
            supplierId: s.supplierId ?? s.id ?? s.SupplierId,
            supplierName: s.supplierName ?? s.name ?? s.SupplierName ?? '',
            supplierCode: s.supplierCode ?? s.code ?? s.SupplierCode ?? ''
          }))
          .filter((s: Supplier) => !!s.supplierId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.toastr.error('Failed to load suppliers. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  loadReceipt(): void {
    if (!this.receiptId) return;

    this.loading = true;
    this.receiptService.getReceiptById(this.receiptId).subscribe({
      next: (res: any) => {
        if (res.data) {
          const receipt = res.data;
          const postingDateStr = receipt.postingDate
            ? new Date(receipt.postingDate).toISOString().split('T')[0]
            : null;
          const dueDateStr = receipt.dueDate
            ? new Date(receipt.dueDate).toISOString().split('T')[0]
            : null;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: receipt.comment || '',
            isDraft: receipt.isDraft !== undefined ? receipt.isDraft : false,
            supplierId: receipt.supplierId || null,
            warehouseId: receipt.warehouseId || (this.warehouseId > 0 ? this.warehouseId : null)
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading receipt:', err);
        this.loading = false;
        this.toastr.error('Failed to load receipt. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private formatDateToISOString(date: string | Date): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return `${date}T00:00:00.000Z`;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  onSubmit(): void {
    this.saveReceipt(false);
  }

  onSubmitWithDefaultLines(): void {
    this.saveReceipt(true);
  }

  private saveReceipt(useDefaultLines: boolean): void {
    if (this.form.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.form.value;

    const formattedPostingDate = this.formatDateToISOString(formValue.postingDate);
    const formattedDueDate = this.formatDateToISOString(formValue.dueDate);

    const receiptData: Receipt = {
      receiptPurchaseOrderId: this.receiptId || undefined,
      purchaseOrderId: this.purchaseOrderId,
      postingDate: formattedPostingDate,
      dueDate: formattedDueDate,
      comment: formValue.comment,
      isDraft: formValue.isDraft,
      status: ''
    };

    const withoutReferenceData = {
      receiptPurchaseOrderId: this.receiptId,
      postingDate: formattedPostingDate,
      dueDate: formattedDueDate,
      comment: formValue.comment,
      isDraft: formValue.isDraft,
      warehouseId: this.warehouseId,
      supplierId: +formValue.supplierId
    };

    const operation = this.isEditMode
      ? this.purchaseOrderId === 0
        ? this.receiptService.updateReceipt(this.receiptId!, withoutReferenceData)
        : this.receiptService.updateReceipt(this.receiptId!, receiptData)
      : this.purchaseOrderId === 0
      ? this.receiptService.createReceiptWithoutReference(withoutReferenceData)
      : useDefaultLines
      ? this.receiptService.createReceiptWithDefaultItems(receiptData)
      : this.receiptService.createReceipt(receiptData);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;
        const message = this.isEditMode ? 'Receipt updated successfully' : 'Receipt created successfully';
        this.toastr.success(message, 'Success');

        const savedReceiptId = res?.data?.receiptPurchaseOrderId || this.receiptId || 0;
        this.router.navigate(['/processes/purchases/receipt-order', this.purchaseOrderId, savedReceiptId]);

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving receipt:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error saving receipt. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    if (this.purchaseOrderId === 0) {
      this.router.navigate(['/processes/purchases/receipt-orders', this.warehouseId || 0]);
      return;
    }

    if (this.receiptId == 0) {
      this.router.navigate(['/processes/purchases/receipt-order', this.purchaseOrderId, 0]);
      return;
    }

    this.router.navigate(['/processes/purchases/receipt-order', this.purchaseOrderId, this.receiptId]);
  }
}
