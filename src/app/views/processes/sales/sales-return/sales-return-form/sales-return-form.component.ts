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
import { DeliveryNoteService } from '../../Services/delivery-note.service';
import { SearchCustomerModalComponent } from '../../search-customer-modal/search-customer-modal.component';

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
    FormCheckLabelDirective,
    SearchCustomerModalComponent
  ],
  templateUrl: './sales-return-form.component.html',
  styleUrl: './sales-return-form.component.scss',
})
export class SalesReturnFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  salesReturnId: number | null = null;
  salesOrderId: number = 0;
  deliveryNoteOrderId: number = 0;
  warehouseId: number = 0;
  customers: Customer[] = [];
  selectedCustomerDisplay: string = '';
  showCustomerModal: boolean = false;
  loading: boolean = false;
  saving: boolean = false;
  returnOrder: Return | null = null;

  constructor(
    private fb: FormBuilder,
    private returnService: SalesReturnService,
    private salesService: SalesService,
    private deliveryNoteService: DeliveryNoteService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.salesReturnId = +this.route.snapshot.paramMap.get('salesReturnId')! || null;
    this.deliveryNoteOrderId = +(this.route.snapshot.queryParamMap.get('deliveryNoteOrderId') || 0);
    this.isEditMode = !!this.salesReturnId;
    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

    this.initializeForm();
    this.configureFormForWithoutReference();

    if (this.isEditMode && this.salesReturnId) {
      this.loadReturn();
    } else {
      this.loadWarehouseFromReference();
    }
  }

  get hasSalesOrderReference(): boolean {
    return this.salesOrderId > 0;
  }

  get hasDeliveryNoteReference(): boolean {
    return this.deliveryNoteOrderId > 0;
  }

  get hasAnyReference(): boolean {
    return this.hasSalesOrderReference || this.hasDeliveryNoteReference;
  }

  get requiresManualCustomerSelection(): boolean {
    if (this.isEditMode) {
      return !this.returnOrder?.salesOrderId && !this.returnOrder?.deliveryNoteOrderId;
    }

    return !this.hasAnyReference;
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
    if (this.salesOrderId !== 0 || this.deliveryNoteOrderId !== 0) {
      return;
    }

    this.form.get('customerId')?.setValidators([Validators.required]);
    this.form.get('customerId')?.updateValueAndValidity();
  }

  private loadWarehouseFromReference(): void {
    if (this.deliveryNoteOrderId) {
      this.deliveryNoteService.getDeliveryNoteById(this.deliveryNoteOrderId).subscribe({
        next: (res: any) => {
          this.applyReferenceData(res?.data);
        },
        error: () => {
          this.toastr.warning('Unable to detect warehouse automatically', 'Warning');
        }
      });
      return;
    }

    if (this.salesOrderId) {
      this.salesService.getSalesById(this.salesOrderId).subscribe({
        next: (res: any) => {
          this.applyReferenceData(res?.data);
        },
        error: () => {
          this.toastr.warning('Unable to detect warehouse automatically', 'Warning');
        }
      });
    }
  }

  private applyReferenceData(referenceData: any): void {
    if (!referenceData) {
      return;
    }

    if (referenceData.warehouseId) {
      this.warehouseId = referenceData.warehouseId;
    }
    if (referenceData.customerId && !this.form.get('customerId')?.value) {
      this.form.patchValue({ customerId: referenceData.customerId });
    }
    if (referenceData.deliveryNoteOrderId && !this.deliveryNoteOrderId) {
      this.deliveryNoteOrderId = +referenceData.deliveryNoteOrderId;
    }

    this.syncSelectedCustomerDisplay();
    this.cdr.detectChanges();
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
          this.deliveryNoteOrderId = this.deliveryNoteOrderId || this.returnOrder?.deliveryNoteOrderId || 0;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: this.returnOrder?.comment || '',
            customerId: this.returnOrder?.customerId || null,
            isDraft: this.returnOrder?.isDraft !== undefined ? this.returnOrder?.isDraft : true
          });
          this.syncSelectedCustomerDisplay();

          if (!this.returnOrder?.salesOrderId && !this.returnOrder?.deliveryNoteOrderId) {
            this.form.get('customerId')?.setValidators([Validators.required]);
            this.form.get('customerId')?.updateValueAndValidity();
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

  onOpenCustomerModal(): void {
    this.showCustomerModal = true;
  }

  onCustomerModalVisibleChange(visible: boolean): void {
    this.showCustomerModal = visible;
  }

  onSelectCustomer(customer: Customer): void {
    this.form.patchValue({ customerId: customer.customerId });
    this.selectedCustomerDisplay = customer.customerCode || customer.customerName || `#${customer.customerId}`;
    this.showCustomerModal = false;

    if (!this.customers.some(c => c.customerId === customer.customerId)) {
      this.customers = [...this.customers, customer];
    }

    this.form.get('customerId')?.markAsTouched();
    this.cdr.detectChanges();
  }

  onClearCustomer(): void {
    this.form.patchValue({ customerId: '' });
    this.selectedCustomerDisplay = '';
    this.form.get('customerId')?.markAsTouched();
    this.cdr.detectChanges();
  }

  private syncSelectedCustomerDisplay(): void {
    const customerIdValue = this.form.get('customerId')?.value;
    const customerId = customerIdValue ? +customerIdValue : null;

    if (!customerId) {
      this.selectedCustomerDisplay = '';
      return;
    }

    const selectedCustomer = this.customers.find(c => c.customerId === customerId);
    this.selectedCustomerDisplay = selectedCustomer
      ? (selectedCustomer.customerCode || selectedCustomer.customerName || `#${customerId}`)
      : `#${customerId}`;
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

    const withReferenceData = this.deliveryNoteOrderId
      ? {
          warehouseId: this.warehouseId,
          deliveryNoteOrderId: this.deliveryNoteOrderId,
          salesOrderId: this.salesOrderId || undefined,
          ...payloadBase
        }
      : {
          warehouseId: this.warehouseId,
          salesOrderId: this.salesOrderId,
          ...payloadBase
        };

    const hasReference = Boolean(
      (this.returnOrder?.salesOrderId || 0) > 0 ||
      (this.returnOrder?.deliveryNoteOrderId || 0) > 0
    );

    const hasReferenceForCreate = Boolean(this.salesOrderId || this.deliveryNoteOrderId);

    const operation = this.isEditMode && this.salesReturnId
      ? !hasReference
        ? this.returnService.updateReturn(this.salesReturnId, {
            salesReturnOrderId: this.salesReturnId,
            ...withoutReferenceData
          } as UpdateReturn)
        : this.returnService.updateReturn(this.salesReturnId, {
            salesReturnOrderId: this.salesReturnId,
            ...withReferenceData
          } as UpdateReturn)
      : !hasReferenceForCreate
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
        const referenceDeliveryNoteOrderId =
          this.returnOrder?.deliveryNoteOrderId || this.deliveryNoteOrderId || 0;

        this.router.navigate(
          ['/processes/sales/sales-return-order', this.returnOrder?.salesOrderId || this.salesOrderId || 0, this.returnOrder?.salesReturnOrderId],
          {
            queryParams: {
              warehouseId: this.warehouseId || this.returnOrder?.warehouseId || 0,
              deliveryNoteOrderId: referenceDeliveryNoteOrderId || undefined
            }
          }
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
    const queryParams = {
      warehouseId: this.warehouseId || 0,
      deliveryNoteOrderId: this.deliveryNoteOrderId || undefined
    };

    if (this.isEditMode && this.salesReturnId) {
      this.router.navigate(
        ['/processes/sales/sales-return-order', this.salesOrderId || 0, this.salesReturnId],
        { queryParams }
      );
      return;
    }

    if (this.deliveryNoteOrderId) {
      this.router.navigate(
        ['/processes/sales/delivery-note-order', 0, this.deliveryNoteOrderId],
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

    this.router.navigate(['/inquiries/show-outbound-processes', this.warehouseId || 0]);
  }
}
