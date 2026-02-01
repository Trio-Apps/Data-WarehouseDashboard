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
    FormCheckLabelDirective
  ],
  templateUrl: './purchase-form.component.html',
  styleUrl: './purchase-form.component.scss',
})
export class PurchaseFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  purchaseOrderId: number | null = null;
  warehouseId: number = 0;
  suppliers: Supplier[] = [];
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')! || null;

    this.isEditMode = !!this.purchaseOrderId;

    this.initializeForm();
    this.loadSuppliers();

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
      isDraft: [true]
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
            isDraft: purchase.isDraft !== undefined ? purchase.isDraft : true
          });
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
    //console.log('Original dueDate:', formValue.dueDate);
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
        if (!this.isEditMode && res.data?.purchaseOrderId) {
          this.router.navigate(['/processes/purchases/purchase-items', res.data.purchaseOrderId]);
        } else {
          // If editing, go back to purchases list
          this.router.navigate(['/processes/purchases', this.warehouseId]);
        }

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

  displaySupplierName(supplierId: number | null): string {
    const supplier = this.suppliers.find(s => s.supplierId === supplierId);
    return supplier ? supplier.supplierName : '';
  }
}
