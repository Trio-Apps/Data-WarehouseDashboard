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
import { AddDeliveryNote, DeliveryNote, UpdateDeliveryNote } from '../../Models/delivery-note-model';
import { DeliveryNoteService } from '../../Services/delivery-note.service';
import { SearchCustomerModalComponent } from '../../search-customer-modal/search-customer-modal.component';


@Component({
  selector: 'app-delivery-note-form',
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
  templateUrl: './delivery-note-form.component.html',
  styleUrl: './delivery-note-form.component.scss',
})
export class DeliveryNoteFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  deliveryNoteId: number | null = null;
  salesOrderId: number = 0;
  warehouseId: number = 0;
  customers: Customer[] = [];
  selectedCustomerDisplay: string = '';
  showCustomerModal: boolean = false;
  loading: boolean = false;
  saving: boolean = false;
  returnOrder: DeliveryNote | null = null;

  constructor(
    private fb: FormBuilder,
    private returnService: DeliveryNoteService,
    private salesService: SalesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')!;
    this.deliveryNoteId = +this.route.snapshot.paramMap.get('deliveryNoteId')! || null;
    this.isEditMode = !!this.deliveryNoteId;
    this.warehouseId = +(this.route.snapshot.queryParamMap.get('warehouseId') || 0);

    this.initializeForm();
    this.configureFormForWithoutReference();

    if (this.isEditMode && this.deliveryNoteId) {
      this.loadDeliveryNote();
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
        this.syncSelectedCustomerDisplay();
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.warning('Unable to detect warehouse automatically', 'Warning');
      }
    });
  }

  loadDeliveryNote(): void {
    if (!this.deliveryNoteId) return;

    this.loading = true;
    this.returnService.getDeliveryNoteById(this.deliveryNoteId).subscribe({
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
          this.syncSelectedCustomerDisplay();

          if (!this.returnOrder?.salesOrderId) {
            this.form.get('customerId')?.setValidators([Validators.required]);
            this.form.get('customerId')?.updateValueAndValidity();
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading delivery note order:', err);
        this.loading = false;
        this.toastr.error('Failed to load delivery note order. Please try again.', 'Error');
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
    this.saveDeliveryNote(false);
  }

  onSubmitWithDefaultLines(): void {
    this.saveDeliveryNote(true);
  }

  private saveDeliveryNote(useDefaultLines: boolean): void {
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

    const operation = this.isEditMode && this.deliveryNoteId
      ? this.returnOrder?.salesOrderId === 0
        ? this.returnService.updateDeliveryNote(this.deliveryNoteId, {
            deliveryNoteOrderId: this.deliveryNoteId,
            ...withoutReferenceData
          } as UpdateDeliveryNote)
        : this.returnService.updateDeliveryNote(this.deliveryNoteId, {
            deliveryNoteOrderId: this.deliveryNoteId,
            ...withReferenceData
          } as UpdateDeliveryNote)
      : this.salesOrderId === 0
      ? this.returnService.createDeliveryNoteWithOutReference(withoutReferenceData as AddDeliveryNote)
      : useDefaultLines
      ? this.returnService.createDeliveryNoteWithDefaultItems(withReferenceData as AddDeliveryNote)
      : this.returnService.createDeliveryNote(withReferenceData as AddDeliveryNote);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;
        const message = this.isEditMode ? 'DeliveryNote order updated successfully' : 'DeliveryNote order created successfully';
        this.toastr.success(message, 'Success');
        this.returnOrder = res.data;
        this.router.navigate(
          ['/processes/sales/delivery-note-order', this.returnOrder?.salesOrderId || this.salesOrderId || 0, this.returnOrder?.deliveryNoteOrderId],
          { queryParams: { warehouseId: this.warehouseId || this.returnOrder?.warehouseId || 0 } }
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving delivery note order:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error saving delivery note order. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.deliveryNoteId) {
      this.router.navigate(
        ['/processes/sales/delivery-note-order', this.salesOrderId || 0, this.deliveryNoteId],
        { queryParams: { warehouseId: this.warehouseId || 0 } }
      );
      return;
    }

    if (this.salesOrderId) {
      this.router.navigate(['/processes/sales/delivery-note-order', this.salesOrderId]);
      return;
    }

    if (this.warehouseId) {
      this.router.navigate(['/processes/sales/delivery-note-orders', this.warehouseId]);
      return;
    }

    this.router.navigate(['/inquiries/show-outbound-processes', this.warehouseId || 0]);
  }
}
