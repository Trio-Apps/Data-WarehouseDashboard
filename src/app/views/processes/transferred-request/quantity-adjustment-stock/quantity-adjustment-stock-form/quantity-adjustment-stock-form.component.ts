import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormModule,
  CardModule,
  ButtonModule,
  GridModule,
  GutterDirective,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { QuantityAdjustmentStockService } from '../../Services/quantity-adjustment-stock.service';
import {
  AddQuantityAdjustmentStock,
  QuantityAdjustmentStock,
  UpdateQuantityAdjustmentStock
} from '../../Models/quantity-adjustment-stock.model';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { ReasonService } from '../../../reasons/Services/reason.service';
import { ReasonDto } from '../../../reasons/Models/reason.model';

@Component({
  selector: 'app-quantity-adjustment-stock-form',
  imports: [
    CommonModule,
    FormModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    GridModule,
    GutterDirective,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    TranslatePipe
  ],
  templateUrl: './quantity-adjustment-stock-form.component.html',
  styleUrl: './quantity-adjustment-stock-form.component.scss'
})
export class QuantityAdjustmentStockFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  quantityAdjustmentStockId: number | null = null;
  warehouseId = 0;
  reasons: ReasonDto[] = [];
  loadingReasons = false;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private quantityAdjustmentStockService: QuantityAdjustmentStockService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private reasonService: ReasonService
  ) {}

  ngOnInit(): void {
    this.warehouseId = +(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.quantityAdjustmentStockId =
      +(this.route.snapshot.paramMap.get('quantityAdjustmentStockId') || 0) || null;
    this.isEditMode = !!this.quantityAdjustmentStockId;

    this.initializeForm();
    this.loadReasons();

    if (this.isEditMode && this.quantityAdjustmentStockId) {
      this.loadQuantityAdjustmentStock();
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      reasonId: [null],
      isDraft: [true]
    });
  }

  private loadReasons(): void {
    this.loadingReasons = true;

    this.reasonService.getReasonsByProcessType('QuantityAdjustmentStock').subscribe({
      next: (res) => {
        const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
        this.reasons = Array.isArray(payload) ? payload : [];
        this.loadingReasons = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading reasons:', err);
        this.reasons = [];
        this.loadingReasons = false;
        this.cdr.detectChanges();
      }
    });
  }
  private loadQuantityAdjustmentStock(): void {
    if (!this.quantityAdjustmentStockId) {
      return;
    }

    this.loading = true;
    this.quantityAdjustmentStockService.getQuantityAdjustmentStockByIdWithWarehouse(this.quantityAdjustmentStockId).subscribe({
      next: (res: any) => {
        console.log("quantity",res);
        if (res?.data) {
          const stock = res.data as QuantityAdjustmentStock;
          const postingDateStr = stock.postingDate
            ? new Date(stock.postingDate).toISOString().split('T')[0]
            : null;
          const dueDateStr = stock.dueDate ? new Date(stock.dueDate).toISOString().split('T')[0] : null;

          this.warehouseId = Number(stock.warehouseId || this.warehouseId || 0);

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: stock.comment || '',
            reasonId: stock.reasonId || (stock as any).ReasonId || null,
            isDraft: stock.isDraft !== undefined ? stock.isDraft : true
          });
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading quantity adjustment stock:', err);
        this.loading = false;
        this.toastr.error('Failed to load quantity adjustment stock. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private formatDateToISOString(date: string | Date): string {
    if (!date) {
      return '';
    }

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

    if (!this.warehouseId) {
      this.toastr.error('Warehouse ID is missing.', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.form.value;

    const createRequest: AddQuantityAdjustmentStock = {
      postingDate: this.formatDateToISOString(formValue.postingDate),
      dueDate: this.formatDateToISOString(formValue.dueDate),
      comment: formValue.comment,
      reasonId: Number(formValue.reasonId) || null,
      isDraft: !!formValue.isDraft,
      warehouseId: this.warehouseId
    };

    const updateRequest: UpdateQuantityAdjustmentStock = {
      quantityAdjustmentStockId: this.quantityAdjustmentStockId || 0,
      postingDate: createRequest.postingDate,
      dueDate: createRequest.dueDate,
      comment: createRequest.comment,
      isDraft: createRequest.isDraft
    };

    const operation = this.isEditMode
      ? this.quantityAdjustmentStockService.updateQuantityAdjustmentStock(
          this.quantityAdjustmentStockId!,
          updateRequest
        )
      : this.quantityAdjustmentStockService.createQuantityAdjustmentStock(createRequest);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;

        const message = this.isEditMode
          ? 'Quantity adjustment stock updated successfully'
          : 'Quantity adjustment stock created successfully';
        this.toastr.success(message, 'Success');

        const savedStockId = Number(
          res?.data?.quantityAdjustmentStockId || res?.data?.id || this.quantityAdjustmentStockId || 0
        );

        if (savedStockId > 0) {
          this.router.navigate(['/processes/quantity-adjustment-stock/quantity-adjustment-stock', savedStockId]);
        } else {
          this.router.navigate([
            '/processes/quantity-adjustment-stock/quantity-adjustment-stock-orders',
            this.warehouseId
          ]);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving quantity adjustment stock:', err);
        this.saving = false;
        const errorMessage = err?.error?.message || 'Error saving quantity adjustment stock. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    if (!this.quantityAdjustmentStockId) {
      this.router.navigate(['/processes/quantity-adjustment-stock/quantity-adjustment-stock-orders', this.warehouseId || 0]);
      return;
    }

    this.router.navigate([
      '/processes/quantity-adjustment-stock/quantity-adjustment-stock',
      this.quantityAdjustmentStockId
    ]);
  }
}

