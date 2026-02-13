import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  CardModule,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormModule,
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PurchaseService } from '../../Services/purchase.service';
import { GoodsReturnService } from '../../Services/goods-return.service';
import { AddReturn, Return, UpdateReturn } from '../../Models/retrun-model';
import { Supplier } from '../../Models/purchase.model';

@Component({
  selector: 'app-goods-return-form',
  standalone: true,
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
  templateUrl: './goods-return-form.component.html',
  styleUrl: './goods-return-form.component.scss',
})
export class GoodsReturnFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  goodsReturnId: number | null = null;
  purchaseOrderId: number = 0;
  receiptOrderId: number = 0;
  warehouseId: number = 0;
  suppliers: Supplier[] = [];
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private returnService: GoodsReturnService,
    private purchaseService: PurchaseService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptId')!;
    this.goodsReturnId = +this.route.snapshot.paramMap.get('goodsReturnId')! || null;
    this.isEditMode = !!this.goodsReturnId;
    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

    this.initializeForm();
    this.loadSuppliers();

    if (this.isEditMode && this.goodsReturnId) {
      this.loadReturn();
    } else {
      this.loadWarehouseFromPurchase();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      supplierId: ['', Validators.required],
      isDraft: [true]
    });
  }

  private loadWarehouseFromPurchase(): void {
    if (!this.purchaseOrderId) {
      return;
    }
    this.purchaseService.getPurchaseById(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data?.warehouseId) {
          this.warehouseId = res.data.warehouseId;
        }
        if (res.data?.supplierId && !this.form.get('supplierId')?.value) {
          this.form.patchValue({ supplierId: res.data.supplierId });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.warning('Unable to detect warehouse automatically', 'Warning');
      }
    });
  }

  loadSuppliers(): void {
    this.loading = true;
    this.purchaseService.getSuppliers().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.suppliers = res.data.map((s: any) => ({
            supplierId: s.supplierId,
            supplierName: s.supplierName,
            supplierCode: s.supplierCode
          }));
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.loading = false;
        this.toastr.error('Failed to load suppliers. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  loadReturn(): void {
    if (!this.goodsReturnId) return;

    this.loading = true;
    this.returnService.getReturnById(this.goodsReturnId).subscribe({
      next: (res: any) => {
        if (res.data) {
          const returnOrder: Return = res.data;
          const postingDateStr = returnOrder.postingDate
            ? new Date(returnOrder.postingDate).toISOString().split('T')[0]
            : null;
          const dueDateStr = returnOrder.dueDate
            ? new Date(returnOrder.dueDate).toISOString().split('T')[0]
            : null;

          this.warehouseId = returnOrder.warehouseId || 0;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: returnOrder.comment || '',
            supplierId: returnOrder.supplierId || null,
            isDraft: returnOrder.isDraft !== undefined ? returnOrder.isDraft : true
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading return order:', err);
        this.loading = false;
        this.toastr.error('Failed to load return order. Please try again.', 'Error');
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
    if (this.form.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    // if (!this.warehouseId) {
    //   this.toastr.error('Warehouse is required to create return order', 'Validation Error');
    //   return;
    // }

    this.saving = true;
    const formValue = this.form.value;

    const payloadBase = {
      postingDate: this.formatDateToISOString(formValue.postingDate),
      dueDate: this.formatDateToISOString(formValue.dueDate),
      comment: formValue.comment,
      supplierId: +formValue.supplierId,
      isDraft: formValue.isDraft
    };

    const operation = this.isEditMode && this.goodsReturnId
      ? this.returnService.updateReturn(this.goodsReturnId, {
          goodsReturnOrderId: this.goodsReturnId,
          ...payloadBase
        } as UpdateReturn)
      : this.returnService.createReturn({
         warehouseId: this.warehouseId,
          ...payloadBase
        } as AddReturn);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;
        const message = this.isEditMode ? 'Return order updated successfully' : 'Return order created successfully';
        this.toastr.success(message, 'Success');

        const returnId = this.goodsReturnId || res?.data?.goodsReturnOrderId || res?.data?.returnOrderId;
        this.router.navigate(['/processes/purchases/goods-return-order', this.purchaseOrderId, this.receiptOrderId, returnId]);
        console.log("goods", res);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving return order:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error saving return order. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    if (this.goodsReturnId) {
      this.router.navigate(['/processes/purchases/goods-return-order', this.purchaseOrderId, this.receiptOrderId, this.goodsReturnId]);
      return;
    }
    if (this.receiptOrderId) {
      this.router.navigate(['/processes/purchases/receipt-order', this.purchaseOrderId, this.receiptOrderId]);
      return;
    }
    this.router.navigate(['/processes/purchases/goods-return-orders', this.warehouseId]);
  }
}
