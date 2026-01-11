import { Component, EventEmitter, Input, OnInit, OnChanges, Output } from '@angular/core';
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
  GridModule,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import { Role } from '../../Models/role.model';

@Component({
  selector: 'app-role-form-modal',
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
    GridModule,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective
  ],
  templateUrl: './role-form-modal.component.html',
  styleUrl: './role-form-modal.component.scss'
})
export class RoleFormModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() role: Role | null = null;
  @Input() isEditMode: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<Role>();
  @Output() cancel = new EventEmitter<void>();

  roleForm!: FormGroup;
  availablePermissions: string[] = [
    'Users.View',
    'Users.Create',
    'Users.Edit',
    'Users.Delete',
    'Roles.View',
    'Roles.Create',
    'Roles.Edit',
    'Roles.Delete',
    'Items.View',
    'Items.Create',
    'Items.Edit',
    'Items.Delete',
    'Inquiries.View',
    'Dashboard.View',
    'Settings.View',
    'Settings.Edit'
  ];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.role && this.isEditMode) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]],
      // description: [''],
      // isActive: [true],
      // permissions: [[]]
    });
  }

  populateForm(): void {
    if (this.role) {
      this.roleForm.patchValue({
        roleName: this.role.roleName || '',
        // description: this.role.description || '',
        // isActive: this.role.isActive !== undefined ? this.role.isActive : true,
        // permissions: this.role.permissions || []
      });
    }
  }

  resetForm(): void {
    this.roleForm.reset({
      roleName: '',
      // description: '',
      // isActive: true,
      // permissions: []
    });
  }

  onSave(): void {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      
      const roleData: Role = {
        roleName: formValue.roleName,
        // description: formValue.description,
        // isActive: formValue.isActive,
        // permissions: formValue.permissions || []
      };

      if (this.isEditMode && this.role?.id) {
        roleData.id = this.role.id;
      }

      this.save.emit(roleData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
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

  togglePermission(permission: string): void {
    const permissions = this.roleForm.get('permissions')?.value || [];
    const index = permissions.indexOf(permission);
    
    if (index > -1) {
      permissions.splice(index, 1);
    } else {
      permissions.push(permission);
    }
    
    this.roleForm.patchValue({ permissions });
  }

  isPermissionSelected(permission: string): boolean {
    const permissions = this.roleForm.get('permissions')?.value || [];
    return permissions.includes(permission);
  }

  getFieldError(fieldName: string): string {
    const field = this.roleForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      roleName: 'Role Name',
      description: 'Description'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.roleForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

