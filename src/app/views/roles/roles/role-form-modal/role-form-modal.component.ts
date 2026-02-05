import { Component, EventEmitter, Input, OnInit, OnChanges, Output, ChangeDetectorRef } from '@angular/core';
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
import { Permission, PermissionForRole, Role, RoleFormPayload } from '../../Models/role.model';
import { RolesService } from '../../Services/roles.service';

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
  @Output() save = new EventEmitter<RoleFormPayload>();
  @Output() cancel = new EventEmitter<void>();

  roleForm!: FormGroup;
  availablePermissions: PermissionForRole[] = [];
  permissionsLoading: boolean = false;

  constructor(private cdr: ChangeDetectorRef,
private fb: FormBuilder, private rolesService: RolesService) {
    this.initForm();
  }

  ngOnInit(): void {
    // Initialize form
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.role && this.isEditMode) {
        this.populateForm();
        this.loadRolePermissions(this.role.id);
      } else {
        this.resetForm();
        this.loadAllPermissions();
      }
    }
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]],
      permissionIds: [[]]
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
      permissionIds: []
      // description: '',
      // isActive: true,
      // permissions: []
    });
  }

  onSave(): void {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      
      const roleData: RoleFormPayload = {
        roleName: formValue.roleName,
        permissionIds: formValue.permissionIds || []
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

  togglePermission(permissionId: number): void {
    const permissionIds = this.roleForm.get('permissionIds')?.value || [];
    const index = permissionIds.indexOf(permissionId);
    
    if (index > -1) {
      permissionIds.splice(index, 1);
    } else {
      permissionIds.push(permissionId);
    }
    
    this.roleForm.patchValue({ permissionIds });
  }

  isPermissionSelected(permissionId: number): boolean {
    const permissionIds = this.roleForm.get('permissionIds')?.value || [];
    return permissionIds.includes(permissionId);
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

  private loadAllPermissions(): void {
    this.permissionsLoading = true;
    this.rolesService.getPermissions().subscribe({
      next: (res) => {
         
        const permissions = res.data || [];
        this.availablePermissions = permissions.map((p: Permission) => ({
          permissionId: p.permissionId,
          key: p.key,
          name: p.name,
          group: p.group,
          description: p.description,
          isSelected: false
        }));
     
        this.permissionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.availablePermissions = [];
        this.permissionsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadRolePermissions(roleId?: number): void {
    if (!roleId) {
      this.availablePermissions = [];
      return;
    }

    this.permissionsLoading = true;
    this.rolesService.getRoleWithInAndUnactivePermissions(roleId).subscribe({
      next: (res) => {
        const permissions = res.data || [];
        this.availablePermissions = permissions;
        const selectedIds = permissions.filter(p => p.isSelected).map(p => p.permissionId);
        this.roleForm.patchValue({ permissionIds: selectedIds });
        this.permissionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.availablePermissions = [];
        this.permissionsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
