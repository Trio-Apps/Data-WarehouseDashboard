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
import { PurchaseService } from '../Services/purchase.service';
import { Purchase, Supplier } from '../Models/purchase.model';
import { ToastrService } from 'ngx-toastr';
import { SearchSupplierModalComponent } from '../search-supplier-modal/search-supplier-modal.component';
import { ReasonService } from '../../reasons/Services/reason.service';
import { ProcessTypeOption, ReasonDto } from '../../reasons/Models/reason.model';

@Component({
  selector: 'app-purchase-form',
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
    FormCheckLabelDirective,
    SearchSupplierModalComponent
  ],
  templateUrl: './purchase-form.component.html',
  styleUrl: './purchase-form.component.scss',
})
export class PurchaseFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  purchaseOrderId: number | null = null;
  warehouseId: number = 0;
  selectedSupplierDisplay: string = '';
  selectedReasonDisplay: string = '';
  showSupplierModal: boolean = false;
  reasons: ReasonDto[] = [];
  loadingReasons: boolean = false;
  showReasonSuggestions: boolean = false;
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private reasonService: ReasonService
  ) {}

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')! || null;

    this.isEditMode = !!this.purchaseOrderId;

    this.initializeForm();
    this.loadPurchaseReasons();

    if (this.isEditMode && this.purchaseOrderId) {
      this.loadPurchase();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      supplierId: ['', Validators.required],
      reasonId: [null],
      isDraft: [true]
    });
  }

  loadPurchaseReasons(): void {
    this.loadingReasons = true;

    this.reasonService.getProcessTypes().subscribe({
      next: (typesRes) => {
        const processTypes = this.extractProcessTypes(typesRes);
        const purchaseProcessType = this.resolvePurchaseProcessType(processTypes);

        this.reasonService.getReasonsByProcessType(purchaseProcessType).subscribe({
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

  loadPurchase(): void {
    if (!this.purchaseOrderId) return;

    this.loading = true;
    this.purchaseService.getPurchaseById(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        //console.log('getPurchaseById response:', res);
        if (res.data) {
          const purchase = res.data;
         // //console.log('Purchase data:', purchase);
          // Format dates for input type="date" (YYYY-MM-DD format)
          const postingDateStr = purchase.postingDate 
            ? new Date(purchase.postingDate).toISOString().split('T')[0] 
            : null;
          const dueDateStr = purchase.dueDate 
            ? new Date(purchase.dueDate).toISOString().split('T')[0] 
            : null;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: purchase.comment || '',
            supplierId: purchase.supplierId || null,
            reasonId: this.toNullableNumber(purchase.reasonId ?? purchase.ReasonId),
            isDraft: purchase.isDraft !== undefined ? purchase.isDraft : true
          });

          this.selectedSupplierDisplay =
            purchase.supplier?.supplierCode ||
            purchase.supplier?.supplierName ||
            purchase.supplierCode ||
            purchase.supplierName ||
            (purchase.supplierId ? `#${purchase.supplierId}` : '');

          this.updateSelectedReasonDisplay(
            this.toNullableNumber(purchase.reasonId ?? purchase.ReasonId),
            purchase.reasonName || purchase.reason || ''
          );
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase:', err);
        this.loading = false;
        this.toastr.error('Failed to load purchase. Please try again.', 'Error');
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
    this.selectedSupplierDisplay = supplier.supplierCode || supplier.supplierName || `#${supplier.supplierId}`;
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

  /**
   * Convert date to ISO string preserving the selected date
   * Material Datepicker returns dates in local time
   * We format it with local timezone to ensure backend receives correct date
   */
  /**
   * Format date to ISO string preserving the selected date
   * input type="date" returns string in YYYY-MM-DD format
   */
  private formatDateToISOString(date: string | Date): string {
    if (!date) return '';
    
    // If it's already a string (from input type="date"), use it directly
    if (typeof date === 'string') {
      return `${date}T00:00:00.000Z`;
    }
    
    // If it's a Date object, format it
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

    this.saving = true;
    const formValue = this.form.value;

    // Debug: Log the original dates
    //console.log('Original postingDate:', formValue.postingDate);
    //console.log('PostingDate getDate():', formValue.postingDate?.getDate());
    //console.log('DueDate getDate():', formValue.dueDate?.getDate());

    const formattedPostingDate = this.formatDateToISOString(formValue.postingDate);
    const formattedDueDate = this.formatDateToISOString(formValue.dueDate);

    //console.log('Formatted postingDate:', formattedPostingDate);
    //console.log('Formatted dueDate:', formattedDueDate);

    const purchase: Purchase = {
      purchaseOrderId: this.purchaseOrderId || undefined,
      postingDate: formattedPostingDate,
      dueDate: formattedDueDate,
      comment: formValue.comment,
      supplierId: formValue.supplierId,
      reasonId: this.toNullableNumber(formValue.reasonId),
      warehouseId: this.warehouseId,
      isDraft: formValue.isDraft,
       status : "ff",
    };

    const operation = this.isEditMode
      ? this.purchaseService.updatePurchase(purchase)
      : this.purchaseService.createPurchase(purchase);

    operation.subscribe({
      next: (res: any) => {
        //console.log('Purchase saved:', res);
        this.saving = false;

        const message = this.isEditMode ? 'Purchase updated successfully' : 'Purchase created successfully';
        this.toastr.success(message, 'Success');

        // If creating new purchase, navigate to items page
        //if (!this.isEditMode && res.data?.purchaseOrderId) {
          this.router.navigate(['/processes/purchases/purchase-items', res.data.purchaseOrderId]);
        // } else {
        //   // If editing, go back to purchases list
        //   this.router.navigate(['/processes/purchases', this.warehouseId]);
        // }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving purchase:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error saving purchase. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/processes/purchases', this.warehouseId]);
  }

  private extractProcessTypes(response: ProcessTypeOption[] | { data: ProcessTypeOption[] } | any): ProcessTypeOption[] {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private extractReasons(response: ReasonDto[] | { data: ReasonDto[] } | any): ReasonDto[] {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private resolvePurchaseProcessType(processTypes: ProcessTypeOption[]): string {
    const exactMatch = processTypes.find((x) => this.normalizeText(x.name) === 'purchase');
    if (exactMatch) {
      return exactMatch.name;
    }

    const fuzzyMatch = processTypes.find((x) => this.normalizeText(x.name).includes('purchase'));
    if (fuzzyMatch) {
      return fuzzyMatch.name;
    }

    return 'Purchase';
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
