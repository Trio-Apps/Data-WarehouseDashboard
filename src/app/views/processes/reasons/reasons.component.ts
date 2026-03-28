import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonModule,
  CardModule,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormModule,
  GridModule,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  TableModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AddReasonDto, ProcessTypeOption, ReasonDto, UpdateReasonDto } from './Models/reason.model';
import { ReasonService } from './Services/reason.service';
import { AuthService } from '../../pages/Services/auth.service';

@Component({
  selector: 'app-reasons',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective
  ],
  templateUrl: './reasons.component.html',
  styleUrl: './reasons.component.scss'
})
export class ReasonsComponent implements OnInit, OnDestroy {
  processTypes: ProcessTypeOption[] = [];
  reasons: ReasonDto[] = [];
  selectedProcessType: ProcessTypeOption | null = null;
  selectedReason: ReasonDto | null = null;

  loadingProcessTypes = true;
  loadingReasons = false;
  showReasonModal = false;
  isEditMode = false;
  modalLoading = false;
  detailsProcessTypeParam: string | null = null;
  canViewReasons = false;
  canCreateReasons = false;
  canEditReasons = false;
  canDeleteReasons = false;

  form!: FormGroup;

  private routeSub?: Subscription;

  constructor(
    private reasonService: ReasonService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private authService: AuthService
  ) {
    this.checkPermissions();
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    if (!this.canViewReasons) {
      this.loadingProcessTypes = false;
      this.loadingReasons = false;
      this.processTypes = [];
      this.reasons = [];
      this.cdr.detectChanges();
      return;
    }

    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.detailsProcessTypeParam = params.get('processType');
      this.loadProcessTypes();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get isDetailsView(): boolean {
    return !!this.detailsProcessTypeParam;
  }

  private checkPermissions(): void {
    this.canViewReasons = this.authService.hasPermission('Reason.Get');
    this.canCreateReasons = this.authService.hasPermission('Reason.Create');
    this.canEditReasons = this.authService.hasPermission('Reason.Edit');
    this.canDeleteReasons = this.authService.hasPermission('Reason.Delete');
  }

  loadProcessTypes(): void {
    if (!this.canViewReasons) {
      this.loadingProcessTypes = false;
      this.processTypes = [];
      this.selectedProcessType = null;
      this.reasons = [];
      this.cdr.detectChanges();
      return;
    }

    this.loadingProcessTypes = true;
    this.cdr.detectChanges();

    this.reasonService.getProcessTypes().subscribe({
      next: (res) => {
        this.processTypes = this.extractProcessTypes(res).sort((a, b) => a.name.localeCompare(b.name));
        this.loadingProcessTypes = false;

        if (this.detailsProcessTypeParam) {
          const match = this.processTypes.find(
            (x) => x.name.toLowerCase() === this.detailsProcessTypeParam!.toLowerCase()
          );

          if (!match) {
            this.selectedProcessType = null;
            this.reasons = [];
            this.toastr.error(`Invalid process type: ${this.detailsProcessTypeParam}`, 'Error');
          } else {
            this.selectedProcessType = match;
            this.loadReasonsByProcessType(match.name);
          }
        } else {
          this.selectedProcessType = null;
          this.reasons = [];
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading process types:', err);
        this.processTypes = [];
        this.loadingProcessTypes = false;
        this.selectedProcessType = null;
        this.reasons = [];
        this.toastr.error('Failed to load process types.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onViewDetails(processType: ProcessTypeOption): void {
    this.router.navigate(['/processes/reasons', processType.name]);
  }

  onBackToProcessTypes(): void {
    this.router.navigate(['/processes/reasons']);
  }

  loadReasonsByProcessType(processTypeName: string): void {
    if (!this.canViewReasons) {
      this.loadingReasons = false;
      this.reasons = [];
      this.cdr.detectChanges();
      return;
    }

    this.loadingReasons = true;
    this.cdr.detectChanges();

    this.reasonService.getReasonsByProcessType(processTypeName).subscribe({
      next: (res) => {
        this.reasons = this.extractReasons(res);
        this.loadingReasons = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading reasons:', err);
        this.reasons = [];
        this.loadingReasons = false;
        this.toastr.error('Failed to load reasons.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddReason(): void {
    if (!this.canCreateReasons) {
      this.toastr.error('You do not have permission to add reasons.', 'Permission');
      return;
    }

    if (!this.selectedProcessType) {
      return;
    }

    this.selectedReason = null;
    this.isEditMode = false;
    this.form.reset({ name: '', isActive: true });
    this.showReasonModal = true;
  }

  onEditReason(reason: ReasonDto): void {
    if (!this.canEditReasons) {
      this.toastr.error('You do not have permission to edit reasons.', 'Permission');
      return;
    }

    this.selectedReason = { ...reason };
    this.isEditMode = true;
    this.form.patchValue({
      name: reason.name,
      isActive: reason.isActive ?? true
    });
    this.showReasonModal = true;
  }

  onSaveReason(): void {
    if (!this.canCreateReasons && !this.canEditReasons) {
      this.toastr.error('You do not have permission to save reasons.', 'Permission');
      return;
    }

    if (!this.selectedProcessType) {
      this.toastr.error('No process type selected.', 'Error');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = (this.form.value.name || '').trim();
    const isActive = !!this.form.value.isActive;

    const payload: AddReasonDto = {
      name,
      processType: this.selectedProcessType.id,
      isActive
    };

    this.modalLoading = true;
    this.cdr.detectChanges();

    if (this.isEditMode && this.selectedReason?.reasonId) {
      if (!this.canEditReasons) {
        this.toastr.error('You do not have permission to edit reasons.', 'Permission');
        return;
      }

      const updatePayload: UpdateReasonDto = { ...payload };
      this.reasonService.updateReason(this.selectedReason.reasonId, updatePayload).subscribe({
        next: () => {
          this.toastr.success('Reason updated successfully.', 'Success');
          this.afterReasonSaved();
        },
        error: (err) => {
          console.error('Error updating reason:', err);
          this.modalLoading = false;
          const message = err?.error?.message || 'Failed to update reason.';
          this.toastr.error(message, 'Error');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    if (!this.canCreateReasons) {
      this.toastr.error('You do not have permission to add reasons.', 'Permission');
      return;
    }

    this.reasonService.addReason(payload).subscribe({
      next: () => {
        this.toastr.success('Reason added successfully.', 'Success');
        this.afterReasonSaved();
      },
      error: (err) => {
        console.error('Error adding reason:', err);
        this.modalLoading = false;
        const message = err?.error?.message || 'Failed to add reason.';
        this.toastr.error(message, 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onDeleteReason(reason: ReasonDto): void {
    if (!this.canDeleteReasons) {
      this.toastr.error('You do not have permission to delete reasons.', 'Permission');
      return;
    }

    if (!confirm(`Are you sure you want to delete reason "${reason.name}"?`)) {
      return;
    }

    this.reasonService.deleteReason(reason.reasonId).subscribe({
      next: () => {
        this.toastr.success('Reason deleted successfully.', 'Success');
        if (this.selectedProcessType) {
          this.loadReasonsByProcessType(this.selectedProcessType.name);
        }
      },
      error: (err) => {
        console.error('Error deleting reason:', err);
        const message = err?.error?.message || 'Failed to delete reason.';
        this.toastr.error(message, 'Error');
      }
    });
  }

  onCloseModal(): void {
    this.showReasonModal = false;
    this.selectedReason = null;
    this.isEditMode = false;
    this.modalLoading = false;
    this.form.reset({ name: '', isActive: true });
  }

  onModalVisibleChange(visible: boolean): void {
    this.showReasonModal = visible;
    if (!visible) {
      this.onCloseModal();
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private afterReasonSaved(): void {
    this.modalLoading = false;
    this.showReasonModal = false;
    this.selectedReason = null;
    this.isEditMode = false;
    this.form.reset({ name: '', isActive: true });

    if (this.selectedProcessType) {
      this.loadReasonsByProcessType(this.selectedProcessType.name);
    }
  }

  private extractProcessTypes(response: ProcessTypeOption[] | { data: ProcessTypeOption[] } | any): ProcessTypeOption[] {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private extractReasons(response: ReasonDto[] | { data: ReasonDto[] } | any): ReasonDto[] {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  }
}
