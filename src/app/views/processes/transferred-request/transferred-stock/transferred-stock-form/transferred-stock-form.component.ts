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
import { TransferredStockService } from '../../Services/transferred-stock.service';
import { TransferredRequestService } from '../../Services/transferred-request.service';
import {
  AddTransferredStock,
  AddTransferredStockWithoutRef,
  TransferredStock,
  UpdateTransferredStock
} from '../../Models/transferred-stock.model';
import { DestinationWarehouse } from '../../Models/transferred-request.model';
import { SearchDestinationWarehouseModalComponent } from '../../search-destination-warehouse-modal/search-destination-warehouse-modal.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { ReasonService } from '../../../reasons/Services/reason.service';
import { ReasonDto } from '../../../reasons/Models/reason.model';

@Component({
  selector: 'app-transferred-stock-form',
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
    SearchDestinationWarehouseModalComponent,
    TranslatePipe
  ],
  templateUrl: './transferred-stock-form.component.html',
  styleUrl: './transferred-stock-form.component.scss'
})
export class TransferredStockFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  transferredStockId: number | null = null;
  transferredRequestId = 0;
  warehouseId = 0;
  selectedDestinationWarehouseDisplay = '';
  showDestinationWarehouseModal = false;
  reasons: ReasonDto[] = [];
  loadingReasons = false;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private transferredStockService: TransferredStockService,
    private transferredRequestService: TransferredRequestService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private reasonService: ReasonService
  ) {}

  ngOnInit(): void {
    this.warehouseId = +(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.transferredRequestId = +(this.route.snapshot.paramMap.get('transferredRequestId') || 0);
    this.transferredStockId = +(this.route.snapshot.paramMap.get('transferredStockId') || 0) || null;
    this.isEditMode = !!this.transferredStockId;

    this.initializeForm();
    this.loadReasons();

    if (this.isEditMode && this.transferredStockId) {
      this.loadTransferredStock();
      return;
    }

    if (this.transferredRequestId > 0) {
      this.loadTransferredRequestDefaults();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      postingDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      comment: [''],
      reasonId: [null],
      distinationWarehouseId: ['', Validators.required],
      isDraft: [true]
    });
  }

  loadTransferredStock(): void {
    if (!this.transferredStockId) {
      return;
    }

    this.loading = true;
    this.transferredStockService.getTransferredStockById(this.transferredStockId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const stock = res.data as TransferredStock;
          const postingDateStr = stock.postingDate ? new Date(stock.postingDate).toISOString().split('T')[0] : null;
          const dueDateStr = stock.dueDate ? new Date(stock.dueDate).toISOString().split('T')[0] : null;

          this.transferredRequestId = Number(stock.transferredRequestId || 0);
          this.warehouseId = Number(stock.warehouseId || this.warehouseId || 0);

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: stock.comment || '',
            reasonId: stock.reasonId || (stock as any).ReasonId || null,
            distinationWarehouseId: stock.distinationWarehouseId || null,
            isDraft: stock.isDraft !== undefined ? stock.isDraft : true
          });

          this.selectedDestinationWarehouseDisplay =
            stock.distinationWarehouseName ||
            (stock.distinationWarehouseId ? `#${stock.distinationWarehouseId}` : '');
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading transferred stock:', err);
        this.loading = false;
        this.toastr.error('Failed to load transferred stock. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private loadTransferredRequestDefaults(): void {
    if (!this.transferredRequestId) {
      return;
    }

    this.loading = true;
    this.transferredRequestService.getTransferredRequestById(this.transferredRequestId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const request = res.data;
          const postingDateStr = request.postingDate ? new Date(request.postingDate).toISOString().split('T')[0] : null;
          const dueDateStr = request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : null;

          this.warehouseId = Number(request.warehouseId || this.warehouseId || 0);

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: request.comment || '',
            reasonId: request.reasonId || request.ReasonId || null,
            distinationWarehouseId: request.distinationWarehouseId || null,
            isDraft: false
          });

          this.selectedDestinationWarehouseDisplay =
            request.distinationWarehouseName ||
            (request.distinationWarehouseId ? `#${request.distinationWarehouseId}` : '');
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading transferred request defaults:', err);
        this.loading = false;
        this.toastr.error('Failed to load transferred request. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onOpenDestinationWarehouseModal(): void {
    this.showDestinationWarehouseModal = true;
  }

  onDestinationWarehouseModalVisibleChange(visible: boolean): void {
    this.showDestinationWarehouseModal = visible;
  }

  onDestinationWarehouseSelected(warehouse: DestinationWarehouse): void {
    this.form.patchValue({ distinationWarehouseId: warehouse.warehouseId });
    this.selectedDestinationWarehouseDisplay =
      warehouse.warehouseCode || warehouse.warehouseName || `#${warehouse.warehouseId}`;
    this.showDestinationWarehouseModal = false;
    this.cdr.detectChanges();
  }

  onDestinationWarehouseCleared(): void {
    this.form.patchValue({ distinationWarehouseId: '' });
    this.selectedDestinationWarehouseDisplay = '';
    this.showDestinationWarehouseModal = false;
    this.cdr.detectChanges();
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

  private loadReasons(): void {
    this.loadingReasons = true;

    this.reasonService.getReasonsByProcessType('TransferredStock').subscribe({
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
  onSubmit(): void {
    if (this.form.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.form.value;
    const postingDate = this.formatDateToISOString(formValue.postingDate);
    const dueDate = this.formatDateToISOString(formValue.dueDate);

    const createRequest: AddTransferredStockWithoutRef = {
      postingDate,
      dueDate,
      comment: formValue.comment,
      reasonId: Number(formValue.reasonId) || null,
      isDraft: formValue.isDraft,
      warehouseId: this.warehouseId,
      distinationWarehouseId: +formValue.distinationWarehouseId
    };

    const createRequestWithReference: AddTransferredStock = {
      ...createRequest,
      transferredRequestId: this.transferredRequestId
    };

    const updateRequest: UpdateTransferredStock = {
      transferredStockId: this.transferredStockId || 0,
      postingDate,
      dueDate,
      comment: formValue.comment,
      reasonId: Number(formValue.reasonId) || null,
      distinationWarehouseId: +formValue.distinationWarehouseId,
      isDraft: formValue.isDraft
    };

    const operation = this.isEditMode
      ? this.transferredStockService.updateTransferredStock(updateRequest)
      : this.transferredRequestId > 0
      ? this.transferredStockService.createTransferredStockWithDefaultItems(
          this.transferredRequestId,
          createRequestWithReference
        )
      : this.transferredStockService.createTransferredStockWithoutReference(createRequest);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;

        const message = this.isEditMode
          ? 'Transferred stock updated successfully'
          : 'Transferred stock created successfully';
        this.toastr.success(message, 'Success');

        const savedStockId =
          Number(res?.data?.transferredStockId || res?.data?.id || this.transferredStockId || 0);
        const savedTransferredRequestId =
          Number(res?.data?.transferredRequestId || this.transferredRequestId || 0);

        if (savedStockId > 0) {
          this.router.navigate([
            '/processes/transferred-request/transferred-stock',
            savedTransferredRequestId,
            savedStockId
          ]);
        } else {
          this.router.navigate(['/processes/transferred-request/transferred-stock-orders', this.warehouseId]);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving transferred stock:', err);
        this.saving = false;
        const errorMessage = err?.error?.message || 'Error saving transferred stock. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    if (this.transferredRequestId === 0) {
      this.router.navigate(['/processes/transferred-request/transferred-stock-orders', this.warehouseId || 0]);
      return;
    }

    if (!this.transferredStockId) {
      this.router.navigate([
        '/processes/transferred-request/transferred-stock',
        this.transferredRequestId,
        0
      ]);
      return;
    }

    this.router.navigate([
      '/processes/transferred-request/transferred-stock',
      this.transferredRequestId,
      this.transferredStockId
    ]);
  }
}



