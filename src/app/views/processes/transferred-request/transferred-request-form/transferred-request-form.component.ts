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
import { TransferredRequestService } from '../Services/transferred-request.service';
import {
  AddTransferredRequest,
  DestinationWarehouse,
  UpdateTransferredRequest
} from '../Models/transferred-request.model';
import { SearchDestinationWarehouseModalComponent } from '../search-destination-warehouse-modal/search-destination-warehouse-modal.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { ReasonService } from '../../reasons/Services/reason.service';
import { ReasonDto } from '../../reasons/Models/reason.model';

@Component({
  selector: 'app-transferred-request-form',
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
  templateUrl: './transferred-request-form.component.html',
  styleUrl: './transferred-request-form.component.scss'
})
export class TransferredRequestFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  transferredRequestId: number | null = null;
  warehouseId = 0;
  selectedDestinationWarehouseDisplay = '';
  showDestinationWarehouseModal = false;
  reasons: ReasonDto[] = [];
  loadingReasons = false;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private transferredRequestService: TransferredRequestService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private reasonService: ReasonService
  ) {}

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;
    this.transferredRequestId = +this.route.snapshot.paramMap.get('transferredRequestId')! || null;

    this.isEditMode = !!this.transferredRequestId;

    this.initializeForm();
    this.loadReasons();

    if (this.isEditMode && this.transferredRequestId) {
      this.loadTransferredRequest();
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

  loadTransferredRequest(): void {
    if (!this.transferredRequestId) {
      return;
    }

    this.loading = true;
    this.transferredRequestService.getTransferredRequestById(this.transferredRequestId).subscribe({
      next: (res: any) => {
        if (res.data) {
          const request = res.data;
          const postingDateStr = request.postingDate ? new Date(request.postingDate).toISOString().split('T')[0] : null;
          const dueDateStr = request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : null;

          this.form.patchValue({
            postingDate: postingDateStr,
            dueDate: dueDateStr,
            comment: request.comment || '',
            reasonId: request.reasonId || request.ReasonId || null,
            distinationWarehouseId: request.distinationWarehouseId || null,
            isDraft: request.isDraft !== undefined ? request.isDraft : true
          });

          this.selectedDestinationWarehouseDisplay =
            request.distinationWarehouseName ||
            request.destinationWarehouseName ||
            (request.distinationWarehouseId ? `#${request.distinationWarehouseId}` : '');
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading transferred request:', err);
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.form.value;

    const postingDate = this.formatDateToISOString(formValue.postingDate);
    const dueDate = this.formatDateToISOString(formValue.dueDate);

    const createRequest: AddTransferredRequest = {
      postingDate,
      dueDate,
      comment: formValue.comment,
      reasonId: Number(formValue.reasonId) || null,
      isDraft: formValue.isDraft,
      warehouseId: this.warehouseId,
      distinationWarehouseId: +formValue.distinationWarehouseId
    };

    const updateRequest: UpdateTransferredRequest = {
      transferredRequestId: this.transferredRequestId || 0,
      postingDate,
      dueDate,
      comment: formValue.comment,
      reasonId: Number(formValue.reasonId) || null,
      distinationWarehouseId: +formValue.distinationWarehouseId,
      isDraft: formValue.isDraft
    };

    const operation = this.isEditMode
      ? this.transferredRequestService.updateTransferredRequest(updateRequest)
      : this.transferredRequestService.createTransferredRequest(createRequest);

    operation.subscribe({
      next: (res: any) => {
        this.saving = false;

        const message = this.isEditMode
          ? 'Transferred request updated successfully'
          : 'Transferred request created successfully';
        this.toastr.success(message, 'Success');

        const savedId =
          res?.data?.transferredRequestId ||
          res?.data?.TransferredRequestId ||
          this.transferredRequestId ||
          0;

        this.router.navigate(['/processes/transferred-request/transferred-request-items', savedId]);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error saving transferred request:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error saving transferred request. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  private loadReasons(): void {
    this.loadingReasons = true;

    this.reasonService.getReasonsByProcessType('TransferredRequest').subscribe({
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
  onCancel(): void {
    this.router.navigate(['/processes/transferred-request', this.warehouseId]);
  }
}



