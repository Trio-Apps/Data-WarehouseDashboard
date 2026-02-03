import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalComponent,
  ModalBodyComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ButtonModule,
  FormModule,
  GridModule
} from '@coreui/angular';
import { Role } from '../../../roles/Models/role.model';
import { AddApprovalStepDto, ApprovalStepDto, UpdateApprovalStepDto } from '../Models/approval-model';

@Component({
  selector: 'app-approval-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ButtonModule,
    FormModule,
    GridModule
  ],
  templateUrl: './approval-form.component.html',
  styleUrl: './approval-form.component.scss',
})
export class ApprovalFormComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() step: ApprovalStepDto | null = null;
  @Input() isEditMode: boolean = false;
  @Input() roles: Role[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<AddApprovalStepDto | UpdateApprovalStepDto>();
  @Output() cancel = new EventEmitter<void>();

  approvalForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.step && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  initForm(): void {
    this.approvalForm = this.fb.group({
      stepName: ['', [Validators.required, Validators.maxLength(100)]],
      stepOrder: [1, [Validators.required, Validators.min(1)]],
      roleId: ['', [Validators.required]]
    });
  }

  populateForm(): void {
    if (this.step) {
      this.approvalForm.patchValue({
        stepName: this.step.stepName || '',
        stepOrder: this.step.stepOrder ?? 1,
        roleId: this.step.roleId || ''
      });
    }
  }

  resetForm(): void {
    this.approvalForm.reset({
      stepName: '',
      stepOrder: 1,
      roleId: ''
    });
  }

  onSave(): void {
    if (this.approvalForm.valid) {
      const formValue = this.approvalForm.value;

      if (this.isEditMode && this.step?.approvalStepId) {
        const updateData: UpdateApprovalStepDto = {
          approvalStepId: this.step.approvalStepId,
          stepName: formValue.stepName,
          stepOrder: formValue.stepOrder,
          roleId: formValue.roleId
        };
        this.save.emit(updateData);
      } else {
        const addData: AddApprovalStepDto = {
          stepName: formValue.stepName,
          stepOrder: formValue.stepOrder,
          roleId: formValue.roleId
        };
        this.save.emit(addData);
      }
    } else {
      Object.keys(this.approvalForm.controls).forEach(key => {
        this.approvalForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.visibleChange.emit(false);
    this.cancel.emit();
    this.resetForm();
  }

  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
    if (!visible) {
      this.resetForm();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.approvalForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['maxlength']) {
        return `${this.getFieldLabel(fieldName)} must be at most ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      stepName: 'Step Name',
      stepOrder: 'Step Order',
      roleId: 'Role'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.approvalForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
