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
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../Services/receipt.service';
import { Receipt } from '../Models/receipt';

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
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    this.receiptId = +this.route.snapshot.paramMap.get('receiptId')! || null;

    this.isEditMode = !!this.receiptId;

    this.initializeForm();

    if (this.isEditMode && this.receiptId) {
      this.loadReceipt();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      isDraft: [true]
    });
  }

  loadReceipt(): void {
    if (!this.receiptId) return;

    this.loading = true;
    this.receiptService.getReceiptByPurchaseId(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          const receipt = res.data;
          // Format dates for input type="date" (YYYY-MM-DD format)
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
            isDraft: receipt.isDraft !== undefined ? receipt.isDraft : false
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
      status:""
    };

    const operation = this.isEditMode
      ? this.receiptService.updateReceipt(this.receiptId!, receiptData)
      : this.receiptService.createReceipt(receiptData);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;

        const message = this.isEditMode ? 'Receipt updated successfully' : 'Receipt created successfully';
        this.toastr.success(message, 'Success');

        // العودة لصفحة receipt order
        this.router.navigate(['/processes/receipt-order', this.purchaseOrderId]);

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
    this.router.navigate(['/processes/receipt-order', this.purchaseOrderId]);
  }
}
