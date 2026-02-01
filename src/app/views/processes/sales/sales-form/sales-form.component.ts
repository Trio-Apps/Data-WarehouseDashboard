import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Customer, Sales } from '../Models/sales-model';
import { SalesService } from '../Services/sales.service';
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

@Component({
  selector: 'app-sales-form',
      imports: [
        FormModule,
        CardModule,
        ButtonModule,
        GridModule,
        GutterDirective,
        FormCheckComponent,
        FormCheckInputDirective,
        FormCheckLabelDirective,
        ReactiveFormsModule
      ],
  templateUrl: './sales-form.component.html',
  styleUrl: './sales-form.component.scss',
})
export class SalesFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  salesOrderId: number | null = null;
  warehouseId: number = 0;
  customers: Customer[] = [];
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private salesService: SalesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;
    this.salesOrderId = +this.route.snapshot.paramMap.get('salesOrderId')! || null;

    this.isEditMode = !!this.salesOrderId;

    this.initializeForm();
    this.loadCustomers();

    if (this.isEditMode && this.salesOrderId) {
      this.loadSales();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      customerId: ['', Validators.required],
      isDraft: [true]
    });
  }

  loadCustomers(): void {
    this.loading = true;
    this.salesService.getCustomer().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.customers = res.data.map((c: any) => ({
            customerId: c.customerId,
            customerName: c.customerName,
            customerCode: c.customerCode
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

  loadSales(): void {
    if (!this.salesOrderId) return;

    this.loading = true;
    this.salesService.getSalesById(this.salesOrderId).subscribe({
      next: (res: any) => {
        //console.log('getSalesById response:', res);
        if (res.data) {
          const sales = res.data;
         // //console.log('sales data:', sales);
          // Format dates for input type="date" (YYYY-MM-DD format)
          const postingDateStr = sales.postingDate 
            ? new Date(sales.postingDate).toISOString().split('T')[0] 
            : null;
          const dueDateStr = sales.dueDate 
            ? new Date(sales.dueDate).toISOString().split('T')[0] 
            : null;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: sales.comment || '',
            customerId: sales.customerId || null,
            isDraft: sales.isDraft !== undefined ? sales.isDraft : true
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading sales:', err);
        this.loading = false;
        this.toastr.error('Failed to load sales. Please try again.', 'Error');
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

    const sales: Sales = {
      salesOrderId: this.salesOrderId || undefined,
      postingDate: formattedPostingDate,
      dueDate: formattedDueDate,
      comment: formValue.comment,
      customerId: formValue.customerId,
      warehouseId: this.warehouseId,
      isDraft: formValue.isDraft,
       status : "ff",
    };

    const operation = this.isEditMode
      ? this.salesService.updateSales(sales)
      : this.salesService.createSales(sales);

    operation.subscribe({
      next: (res: any) => {
        //console.log('sales saved:', res);
        this.saving = false;

        const message = this.isEditMode ? 'sales updated successfully' : 'sales created successfully';
        this.toastr.success(message, 'Success');

        // If creating new sales, navigate to items page
      
        this.router.navigate(['/processes/sales/sales-items', this.salesOrderId]);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving sales:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error saving sales. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/processes/sales/sales-items', this.salesOrderId]);
  }

  displayCustomerName(customerId: number | null): string {
    const customer = this.customers.find(s => s.customerId === customerId );
    return customer ? customer.customerName  : '';
  }
}
