import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormModule,
  CardModule,
  ButtonModule,
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
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
    this.purchaseService.getItemsbyPurchaseId(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          const purchase = res.data;
          this.form.patchValue({
            postingDate: new Date(purchase.postingDate),
            dueDate: new Date(purchase.dueDate),
            comment: purchase.comment,
            supplierId: purchase.supplierId,
            isDraft: purchase.isDraft
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.form.value;

    const purchase: Purchase = {
      purchaseOrderId: this.purchaseOrderId || undefined,
      postingDate: formValue.postingDate.toISOString(),
      dueDate: formValue.dueDate.toISOString(),
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
        console.log('Purchase saved:', res);
        this.saving = false;

        const message = this.isEditMode ? 'Purchase updated successfully' : 'Purchase created successfully';
        this.toastr.success(message, 'Success');

        // If creating new purchase, navigate to items page
        if (!this.isEditMode && res.data?.purchaseOrderId) {
          this.router.navigate(['/processes/purchase-items', res.data.purchaseOrderId]);
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
