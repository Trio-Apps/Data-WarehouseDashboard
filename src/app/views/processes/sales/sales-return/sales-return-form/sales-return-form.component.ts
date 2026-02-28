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
import { Customer } from '../../Models/sales-model';
import { SalesService } from '../../Services/sales.service';
import { AddReturn, Return, UpdateReturn } from '../../Models/sales-return-model';
import { SalesReturnService } from '../../Services/sales-return.service';

@Component({
  selector: 'app-sales-return-form',
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
  templateUrl: './sales-return-form.component.html',
  styleUrl: './sales-return-form.component.scss',
})
export class SalesReturnFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  salesReturnId: number | null = null;
  salesOrderId: number = 0;
  warehouseId: number = 0;
  customers: Customer[] = [];
  loading: boolean = false;
  saving: boolean = false;
  returnOrder: Return | null = null;

  constructor(
    private fb: FormBuilder,
    private returnService: SalesReturnService,
    private salesService: SalesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.salesReturnId = +this.route.snapshot.paramMap.get('salesReturnId')! || null;
    this.isEditMode = !!this.salesReturnId;
    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

    this.initializeForm();
    this.configureFormForWithoutReference();

    if (this.isEditMode && this.salesReturnId) {
      this.loadReturn();
    } else {
      this.loadWarehouseFromSales();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      customerId: [''],
      isDraft: [true]
    });
  }

  private configureFormForWithoutReference(): void {
    if (this.salesOrderId !== 0) {
      return;
    }

    this.form.get('customerId')?.setValidators([Validators.required]);
    this.form.get('customerId')?.updateValueAndValidity();
    this.loadCustomers();
  }

  private loadWarehouseFromSales(): void {
    if (!this.salesOrderId) {
      return;
    }
    this.salesService.getSalesById(this.salesOrderId).subscribe({
      next: (res: any) => {
        if (res.data?.warehouseId) {
          this.warehouseId = res.data.warehouseId;
        }
        if (res.data?.customerId && !this.form.get('customerId')?.value) {
          this.form.patchValue({ customerId: res.data.customerId });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.warning('Unable to detect warehouse automatically', 'Warning');
      }
    });
  }

  private loadCustomers(): void {
    this.loading = true;
    this.salesService.getCustomer().subscribe({
      next: (res: any) => {
        const rawCustomers = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];

        this.customers = rawCustomers
          .map((c: any) => ({
            customerId: c.customerId ?? c.id ?? c.CustomerId,
            customerName: c.customerName ?? c.name ?? c.CustomerName ?? '',
            customerCode: c.customerCode ?? c.code ?? c.CustomerCode ?? ''
          }))
          .filter((c: Customer) => !!c.customerId);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.loading = false;
        this.toastr.error('Failed to load customers. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  loadReturn(): void {
    if (!this.salesReturnId) return;

    this.loading = true;
    this.returnService.getReturnById(this.salesReturnId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.returnOrder = res.data;
          const postingDateStr = this.returnOrder?.postingDate
            ? new Date(this.returnOrder?.postingDate).toISOString().split('T')[0]
            : null;
          const dueDateStr = this.returnOrder?.dueDate
            ? new Date(this.returnOrder?.dueDate).toISOString().split('T')[0]
            : null;

          this.warehouseId = this.returnOrder?.warehouseId || this.warehouseId;
          this.salesOrderId = this.salesOrderId || this.returnOrder?.salesOrderId || 0;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: this.returnOrder?.comment || '',
            customerId: this.returnOrder?.customerId || null,
            isDraft: this.returnOrder?.isDraft !== undefined ? this.returnOrder?.isDraft : true
          });

          if (!this.returnOrder?.salesOrderId) {
            this.form.get('customerId')?.setValidators([Validators.required]);
            this.form.get('customerId')?.updateValueAndValidity();
            this.loadCustomers();
          }
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
      customerId: +formValue.customerId,
      ...payloadBase
    };

    const withReferenceData = {
      warehouseId: this.warehouseId,
      salesOrderId: this.salesOrderId,
      ...payloadBase
    };

    const operation = this.isEditMode && this.salesReturnId
      ? this.returnOrder?.salesOrderId === 0
        ? this.returnService.updateReturn(this.salesReturnId, {
            salesReturnOrderId: this.salesReturnId,
            ...withoutReferenceData
          } as UpdateReturn)
        : this.returnService.updateReturn(this.salesReturnId, {
            salesReturnOrderId: this.salesReturnId,
            ...withReferenceData
          } as UpdateReturn)
      : this.salesOrderId === 0
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
        this.router.navigate(
          ['/processes/sales/sales-return-order', this.returnOrder?.salesOrderId || this.salesOrderId || 0, this.returnOrder?.salesReturnOrderId],
          { queryParams: { warehouseId: this.warehouseId || this.returnOrder?.warehouseId || 0 } }
        );
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
    if (this.isEditMode && this.salesReturnId) {
      this.router.navigate(
        ['/processes/sales/sales-return-order', this.salesOrderId || 0, this.salesReturnId],
        { queryParams: { warehouseId: this.warehouseId || 0 } }
      );
      return;
    }

    if (this.salesOrderId) {
      this.router.navigate(['/processes/sales/sales-return-order', this.salesOrderId]);
      return;
    }

    if (this.warehouseId) {
      this.router.navigate(['/processes/sales/sales-return-orders', this.warehouseId]);
      return;
    }

    this.router.navigate(['/inquiries/show-processes', this.warehouseId || 0]);
  }
}
