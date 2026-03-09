import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalModule,
  ButtonModule,
  FormModule,
  CardModule,
  UtilitiesModule,
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UoMGroup } from '../../barcodes/Models/item-barcode.model';
import {
  TransferredRequestItem,
  UpdateTransferredRequestItem
} from '../Models/transferred-request.model';
import { TransferredRequestService } from '../Services/transferred-request.service';

@Component({
  selector: 'app-edit-item-modal',
  imports: [
    CommonModule,
    ModalModule,
    ButtonModule,
    FormModule,
    CardModule,
    UtilitiesModule,
    GridModule,
    GutterDirective,
    ReactiveFormsModule
  ],
  templateUrl: './edit-item-modal.component.html',
  styleUrl: './edit-item-modal.component.scss'
})
export class EditItemModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() item: TransferredRequestItem | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  uomGroups: UoMGroup[] = [];
  saving = false;
  loadingUomGroups = false;

  constructor(
    private fb: FormBuilder,
    private transferredRequestService: TransferredRequestService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.item && this.visible) {
      this.initializeForm();
      this.populateForm();
    }
  }

  initializeForm(): void {
    this.editForm = this.fb.group({
      transferredRequestItemId: [0, Validators.required],
      quantity: [0.01, [Validators.required, Validators.min(0.01)]],
      uoMEntry: ['', Validators.required],
      unitPrice: [0, [Validators.min(0)]]
    });
  }

  populateForm(): void {
    if (!this.item) {
      return;
    }

    const itemId = this.item.transferredRequestItemId || 0;
    const currentUoMEntry = this.item.uoMEntry || 0;

    this.editForm.patchValue({
      transferredRequestItemId: itemId,
      quantity: this.item.quantity || 0.01,
      uoMEntry: currentUoMEntry,
      unitPrice: this.item.unitPrice || 0
    });

    if (this.item.itemId) {
      this.loadUomGroups(this.item.itemId, currentUoMEntry);
    }
  }

  loadUomGroups(itemId: number, selectedUoMEntry?: number): void {
    this.loadingUomGroups = true;
    this.uomGroups = [];

    this.transferredRequestService.getUoMGroupByItemId(itemId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.uomGroups = res.data;

          if (selectedUoMEntry !== undefined) {
            const exists = this.uomGroups.some((uom) => uom.uomEntry === selectedUoMEntry);
            if (exists) {
              this.editForm.patchValue({ uoMEntry: selectedUoMEntry });
            } else if (this.uomGroups.length > 0) {
              this.editForm.patchValue({ uoMEntry: this.uomGroups[0].uomEntry });
            }
          }
        } else {
          this.uomGroups = [];
        }

        this.loadingUomGroups = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading UoM groups:', err);
        this.uomGroups = [];
        this.loadingUomGroups = false;
        this.cdr.detectChanges();
      }
    });
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm(): void {
    this.editForm.reset({
      transferredRequestItemId: 0,
      quantity: 0.01,
      uoMEntry: '',
      unitPrice: 0
    });
    this.uomGroups = [];
  }

  onUpdate(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    const itemData: UpdateTransferredRequestItem = {
      transferredRequestItemId: formValue.transferredRequestItemId,
      quantity: formValue.quantity,
      uoMEntry: formValue.uoMEntry,
      UnitPrice: formValue.unitPrice
    };

    this.transferredRequestService
      .updateTransferredRequestItem(itemData.transferredRequestItemId, itemData)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Item updated successfully', 'Success');
          this.itemUpdated.emit();
          this.onClose();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating item:', err);
          this.saving = false;
          const errorMessage = err.error?.message || 'Error updating item. Please try again.';
          this.toastr.error(errorMessage, 'Error');
          this.cdr.detectChanges();
        }
      });
  }
}
