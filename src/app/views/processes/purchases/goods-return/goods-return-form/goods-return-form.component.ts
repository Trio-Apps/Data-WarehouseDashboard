import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule,Location } from '@angular/common';
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
  returnOrder: Return | null = null;

  constructor(
    private fb: FormBuilder,
    private location: Location,
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
    this.configureFormForWithoutReference();

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
      supplierId: [''],
      isDraft: [true]
    });
  }

  private configureFormForWithoutReference(): void {
    if (this.receiptOrderId !== 0) {
      return;
    }

    this.form.get('supplierId')?.setValidators([Validators.required]);
    this.form.get('supplierId')?.updateValueAndValidity();
    this.loadSuppliers();
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

  private loadSuppliers(): void {
    this.loading = true;
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
          this.returnOrder = res.data;
          const postingDateStr = this.returnOrder?.postingDate
            ? new Date(this.returnOrder?.postingDate).toISOString().split('T')[0]
            : null;
          const dueDateStr = this.returnOrder?.dueDate
            ? new Date(this.returnOrder?.dueDate).toISOString().split('T')[0]
            : null;

          this.warehouseId = this.returnOrder?.warehouseId || 0;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: this.returnOrder?.comment || '',
            supplierId: this.returnOrder?.supplierId || null,
            isDraft: this.returnOrder?.isDraft !== undefined ? this.returnOrder?.isDraft : true
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
    this.saveReturn(false);
  }

  onSubmitWithDefaultLines(): void {
    this.saveReturn(true);
  }

  private saveReturn(useDefaultLines: boolean): void {
    if (this.form.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.form.value;

    const payloadBase = {
      postingDate: this.formatDateToISOString(formValue.postingDate),
      dueDate: this.formatDateToISOString(formValue.dueDate),
      comment: formValue.comment,
      isDraft: formValue.isDraft
    };

    const withoutReferenceData = {
      warehouseId: this.warehouseId,
      supplierId: +formValue.supplierId,
      ...payloadBase
    };

    const withReferenceData = {
      warehouseId: this.warehouseId,
      receiptPurchaseOrderId: this.receiptOrderId,
      ...payloadBase
    };

    const operation = this.isEditMode && this.goodsReturnId
      ? this.returnOrder?.receiptPurchaseOrderId === 0
        ? this.returnService.updateReturn(this.goodsReturnId, {
            goodsReturnOrderId: this.goodsReturnId,
            ...withoutReferenceData
          } as UpdateReturn)
        : this.returnService.updateReturn(this.goodsReturnId, {
            goodsReturnOrderId: this.goodsReturnId,
            ...withReferenceData
          } as UpdateReturn)
      : this.receiptOrderId === 0
      ? this.returnService.createReturnWithOutReference(withoutReferenceData as AddReturn)
      : useDefaultLines
      ? this.returnService.createReturnWithDefaultItems(withReferenceData as AddReturn)
      : this.returnService.createReturn(withReferenceData as AddReturn);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;
        const message = this.isEditMode ? 'Return order updated successfully' : 'Return order created successfully';
        this.toastr.success(message, 'Success');
        this.returnOrder = res.data;
        //const returnId = this.goodsReturnId || res?.data?.goodsReturnOrderId || res?.data?.returnOrderId;
        this.router.navigate(['/processes/purchases/goods-return-order', this.purchaseOrderId, this.returnOrder?.receiptPurchaseOrderId,this.returnOrder?.goodsReturnOrderId]);
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
       // this.location.back();
       if(this.isEditMode)
 this.router.navigate([
        '/processes/purchases/goods-return-order',0 ,this.receiptOrderId,this.goodsReturnId],);
        else{
          if(this.warehouseId)
          {
             this.router.navigate(['/processes/purchases/goods-return-orders',this.warehouseId],);
          return;
            }
           this.router.navigate([
        '/processes/purchases/goods-return-order',0 ,this.receiptOrderId,0],);
     
        }
    
    // if (this.goodsReturnId) {
    //   this.router.navigate(['/processes/purchases/goods-return-order', this.purchaseOrderId, this.receiptOrderId, this.goodsReturnId]);
    //   return;
    // }
    // if (this.receiptOrderId) {
    //   this.router.navigate(['/processes/purchases/receipt-order', this.purchaseOrderId, this.receiptOrderId]);
    //   return;
    // }
    // this.router.navigate(['/processes/purchases/goods-return-orders', this.warehouseId]);
  }
}
