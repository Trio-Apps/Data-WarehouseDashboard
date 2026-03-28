import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule,Location } from '@angular/common';
import {
  ButtonModule,
  CardModule,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormModule,
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { PurchaseService } from '../../Services/purchase.service';
import { GoodsReturnService } from '../../Services/goods-return.service';
import { AddReturn, Return, UpdateReturn } from '../../Models/retrun-model';
import { Supplier } from '../../Models/purchase.model';
import { SearchSupplierModalComponent } from '../../search-supplier-modal/search-supplier-modal.component';
import { ReasonService } from '../../../reasons/Services/reason.service';
import { ProcessTypeOption, ReasonDto } from '../../../reasons/Models/reason.model';

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
    TranslatePipe,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    SearchSupplierModalComponent
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
  showSupplierModal: boolean = false;
  selectedSupplierDisplay: string = '';
  selectedReasonDisplay: string = '';
  reasons: ReasonDto[] = [];
  loadingReasons: boolean = false;
  showReasonSuggestions: boolean = false;
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
    private toastr: ToastrService,
    private reasonService: ReasonService
  ) {}

  ngOnInit(): void {
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptId')!;
    this.goodsReturnId = +this.route.snapshot.paramMap.get('goodsReturnId')! || null;
    this.isEditMode = !!this.goodsReturnId;
    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

    this.initializeForm();
    this.loadReasons();
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
      reasonId: [null],
      isDraft: [true]
    });
  }

  private loadReasons(): void {
    this.loadingReasons = true;

    this.reasonService.getProcessTypes().subscribe({
      next: (typesRes) => {
        const processTypes = this.extractProcessTypes(typesRes);
        const processType = this.resolveProcessType(
          processTypes,
          ['goodsreturn', 'goodsreturnorder'],
          'GoodsReturn'
        );

        this.reasonService.getReasonsByProcessType(processType).subscribe({
          next: (reasonsRes) => {
            this.reasons = this.extractReasons(reasonsRes);
            this.loadingReasons = false;
            const selectedReasonId = this.toNullableNumber(this.form?.get('reasonId')?.value);
            this.updateSelectedReasonDisplay(selectedReasonId);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading reasons:', err);
            this.reasons = [];
            this.loadingReasons = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error loading process types:', err);
        this.reasons = [];
        this.loadingReasons = false;
        this.cdr.detectChanges();
      }
    });
  }

  private configureFormForWithoutReference(): void {
    if (this.receiptOrderId !== 0) {
      return;
    }

    this.form.get('supplierId')?.setValidators([Validators.required]);
    this.form.get('supplierId')?.updateValueAndValidity();
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
          this.selectedSupplierDisplay =
            res.data?.supplier?.supplierCode ||
            res.data?.supplier?.supplierName ||
            res.data?.supplierCode ||
            res.data?.supplierName ||
            `#${res.data.supplierId}`;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.warning('Unable to detect warehouse automatically', 'Warning');
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
            reasonId: this.toNullableNumber(this.returnOrder?.reasonId ?? (this.returnOrder as any)?.ReasonId),
            isDraft: this.returnOrder?.isDraft !== undefined ? this.returnOrder?.isDraft : true
          });

          if (this.returnOrder?.supplierId) {
            this.selectedSupplierDisplay =
              this.returnOrder?.supplierCode ||
              this.returnOrder?.supplierName ||
              `#${this.returnOrder.supplierId}`;
          }

          this.updateSelectedReasonDisplay(
            this.toNullableNumber(this.returnOrder?.reasonId ?? (this.returnOrder as any)?.ReasonId),
            this.returnOrder?.reason || ''
          );
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

  onOpenSupplierModal(): void {
    this.showSupplierModal = true;
  }

  onSupplierModalVisibleChange(visible: boolean): void {
    this.showSupplierModal = visible;
  }

  onSupplierSelected(supplier: Supplier): void {
    this.form.patchValue({ supplierId: supplier.supplierId });
    this.selectedSupplierDisplay =
      supplier.supplierCode || supplier.supplierName || `#${supplier.supplierId}`;
    this.showSupplierModal = false;
    this.cdr.detectChanges();
  }

  onSupplierCleared(): void {
    this.form.patchValue({ supplierId: '' });
    this.selectedSupplierDisplay = '';
    this.showSupplierModal = false;
    this.cdr.detectChanges();
  }

  get selectedReason(): ReasonDto | null {
    const selectedReasonId = this.toNullableNumber(this.form?.get('reasonId')?.value);
    if (!selectedReasonId) {
      return null;
    }

    return this.reasons.find((reason) => reason.reasonId === selectedReasonId) || null;
  }

  onReasonFocus(): void {
    this.showReasonSuggestions = this.reasons.length > 0;
  }

  onReasonBlur(): void {
    setTimeout(() => {
      this.showReasonSuggestions = false;
      this.cdr.detectChanges();
    }, 150);
  }

  onSelectReason(reason: ReasonDto): void {
    this.form.patchValue({ reasonId: reason.reasonId });
    this.form.get('reasonId')?.markAsTouched();
    this.selectedReasonDisplay = reason.name;
    this.showReasonSuggestions = false;
  }

  onClearReason(): void {
    this.form.patchValue({ reasonId: null });
    this.form.get('reasonId')?.markAsTouched();
    this.selectedReasonDisplay = '';
    this.showReasonSuggestions = false;
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
      reasonId: this.toNullableNumber(formValue.reasonId),
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
        const responseData = res?.data ?? {};
        this.returnOrder = responseData;

        const savedReturnId = Number(
          responseData?.goodsReturnOrderId ??
          responseData?.returnOrderId ??
          responseData?.returnReceiptOrderId ??
          this.goodsReturnId ??
          0
        );

        const targetPurchaseOrderId = Number(responseData?.purchaseOrderId ?? this.purchaseOrderId ?? 0);
        const targetReceiptId = Number(
          responseData?.receiptPurchaseOrderId ??
          this.receiptOrderId ??
          0
        );

        if (savedReturnId > 0) {
          this.router.navigate([
            '/processes/purchases/goods-return-order',
            targetPurchaseOrderId > 0 ? targetPurchaseOrderId : 0,
            targetReceiptId > 0 ? targetReceiptId : 0,
            savedReturnId
          ]);
        } else {
          this.toastr.warning('Return saved but failed to resolve return id. Redirected to returns list.', 'Warning');
          this.router.navigate(['/processes/purchases/goods-return-orders', this.warehouseId || 0]);
        }

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

  private extractProcessTypes(response: ProcessTypeOption[] | { data: ProcessTypeOption[] } | any): ProcessTypeOption[] {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private extractReasons(response: ReasonDto[] | { data: ReasonDto[] } | any): ReasonDto[] {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private resolveProcessType(
    processTypes: ProcessTypeOption[],
    keywords: string[],
    fallback: string
  ): string {
    const normalizedKeywords = keywords.map((x) => this.normalizeText(x));
    const exactMatch = processTypes.find((x) => normalizedKeywords.includes(this.normalizeText(x.name)));
    if (exactMatch) {
      return exactMatch.name;
    }

    const fuzzyMatch = processTypes.find((x) => {
      const normalizedName = this.normalizeText(x.name);
      return normalizedKeywords.some((keyword) => normalizedName.includes(keyword));
    });

    if (fuzzyMatch) {
      return fuzzyMatch.name;
    }

    return fallback;
  }

  private normalizeText(value: unknown): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private toNullableNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private updateSelectedReasonDisplay(reasonId: number | null, fallbackName: string = ''): void {
    if (!reasonId) {
      this.selectedReasonDisplay = '';
      return;
    }

    const selectedReason = this.reasons.find((reason) => reason.reasonId === reasonId);
    this.selectedReasonDisplay = selectedReason?.name || fallbackName || `#${reasonId}`;
  }
}
