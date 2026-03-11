import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule, CardModule, TableModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../pages/Services/auth.service';
import { ProcessSettingApprovalDto } from '../Models/approval-model';
import { ApprovalService } from '../Services/approval.service';

@Component({
  selector: 'app-process-setting',
  imports: [CommonModule, CardModule, TableModule, ButtonModule, IconDirective],
  templateUrl: './process-setting.component.html',
  styleUrl: './process-setting.component.scss',
})
export class ProcessSettingComponent implements OnInit {
  processSettings: ProcessSettingApprovalDto[] = [];
  loading: boolean = true;
  canViewApprovalSteps: boolean = false;

  constructor(
    private approvalService: ApprovalService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this.canViewApprovalSteps = this.authService.hasPermission('ApprovalSteps.Get');
  }

  ngOnInit(): void {
    if (!this.canViewApprovalSteps) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadProcessSettings();
  }

  loadProcessSettings(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.approvalService.getProcessSettings().subscribe({
      next: (res) => {
        this.processSettings = this.extractSettings(res).sort((a, b) => a.processType.localeCompare(b.processType));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading process settings:', err);
        this.processSettings = [];
        this.loading = false;
        this.toastr.error('Failed to load process settings.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onViewDetails(setting: ProcessSettingApprovalDto): void {
    this.router.navigate(['/processes/approval-process/approval-steps', setting.processSettingApprovalId]);
  }

  private extractSettings(
    response: ProcessSettingApprovalDto[] | { data: ProcessSettingApprovalDto[] } | any
  ): ProcessSettingApprovalDto[] {
    const payload = response?.data?.data ?? response?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  }

}
