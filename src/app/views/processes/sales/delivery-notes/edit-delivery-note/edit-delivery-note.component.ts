import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DeliveryNote, UpdateDeliveryNote } from '../../Models/delivery-note-model';
import { DeliveryNoteService } from '../../Services/delivery-note.service';


@Component({
  selector: 'app-edit-delivery-note',
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
  templateUrl: './edit-delivery-note.component.html',
  styleUrl: './edit-delivery-note.component.scss',
})
export class EditDeliveryNoteComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() item: DeliveryNote | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  editForm!: FormGroup;
  
  saving: boolean = false;
  loadingUomGroups: boolean = false;

  constructor(
    private fb: FormBuilder,

    private returnService: DeliveryNoteService,
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
      deliveryNoteOrderId: [0, Validators.required],
      comment: [''],
      isDraft: [true]
    });
  }

  populateForm(): void {
    if (this.item) {
      const itemId = this.item.deliveryNoteOrderId;
      this.editForm.patchValue({
        deliveryNoteOrderId: itemId,
        comment: this.item.comment || '',
        isDraft: this.item.isDraft
      });
    }
  }

 
  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm(): void {
    this.editForm.reset({
      deliveryNoteOrderId: 0,
      comment: '',
      isDraft: true
    });
  
  }

  onUpdate(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.saving = true;
    const formValue = this.editForm.value;

    const itemData: UpdateDeliveryNote = {
      deliveryNoteOrderId: formValue.deliveryNoteOrderId,
      comment: formValue.comment,
      isDraft: formValue.isDraft  
    };
     console.log("updating item data",itemData);
    this.returnService.updateDeliveryNote(itemData.deliveryNoteOrderId, itemData).subscribe({
      next: (res: any) => {
        console.log('Receipt item updated:', res);
        this.saving = false;
        this.toastr.success('Item updated successfully', 'Success');
        this.itemUpdated.emit();
        this.onClose();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating receipt item:', err);
        this.saving = false;
        const errorMessage = err.error?.message || 'Error updating item. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.cdr.detectChanges();
      }
    });
  }
}


