import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective, CardBodyComponent, CardComponent, CardHeaderComponent, FormModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, of, timeout } from 'rxjs';
import { StockCountingService } from '../Services/stock-counting.service';

@Component({
  selector: 'app-stock-counting-order-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    FormModule,
    IconDirective
  ],
  templateUrl: './stock-counting-order-form.component.html',
  styleUrl: './stock-counting-order-form.component.scss'
})
export class StockCountingOrderFormComponent implements OnInit {
  warehouseId = 0;
  countStockId = 0;
  saving = false;
  loading = false;
  private loadToken = 0;

  form = this.fb.group({
    postingDate: ['', Validators.required],
    comment: [''],
    mode: ['Counting', Validators.required],
    isDraft: [true]
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private stockService: StockCountingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId') || 0);
    this.countStockId = Number(this.route.snapshot.paramMap.get('countStockId') || 0);

    if (!this.form.value.postingDate) {
      this.form.patchValue({ postingDate: this.toDateInputValue(new Date()) });
    }

    if (this.countStockId) {
      this.loadOrder();
    }
  }

  isEditMode(): boolean {
    return this.countStockId > 0;
  }

  onBack(): void {
    this.router.navigate(['/processes/stock-counting/orders', this.warehouseId]);
  }

  onSave(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fill required fields.', 'Validation');
      return;
    }

    this.saving = true;

    if (this.isEditMode()) {
      const payload = {
        countStockId: this.countStockId,
        postingDate: this.formatDateToISOString(this.form.value.postingDate as string),
        comment: String(this.form.value.comment || ''),
        mode: (this.form.value.mode as 'Counting' | 'Posting') || 'Counting'
      };

      this.stockService.updateOrder(this.countStockId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toastr.success('Order updated successfully.', 'Success');
          this.onBack();
        },
        error: (err) => {
          this.saving = false;
          this.toastr.error(this.extractError(err, 'Failed to update order.'), 'Error');
        }
      });
      return;
    }

    const payload = {
      isDraft: Boolean(this.form.value.isDraft),
      postingDate: this.formatDateToISOString(this.form.value.postingDate as string),
      comment: String(this.form.value.comment || ''),
      mode: (this.form.value.mode as 'Counting' | 'Posting') || 'Counting',
      warehouseId: this.warehouseId
    };

    this.stockService.createOrder(payload).subscribe({
      next: (res) => {
        this.saving = false;
        const createdId = Number(res?.data?.countStockId || 0);
        this.toastr.success('Order created successfully.', 'Success');

        if (createdId) {
          this.router.navigate(['/processes/stock-counting/order-items', this.warehouseId, createdId]);
        } else {
          this.onBack();
        }
      },
      error: (err) => {
        this.saving = false;
        this.toastr.error(this.extractError(err, 'Failed to create order.'), 'Error');
      }
    });
  }

  private loadOrder(): void {
    if (!this.countStockId) {
      this.runUiUpdate(() => {
        this.loading = false;
      });
      return;
    }

    const currentLoadToken = ++this.loadToken;
    this.runUiUpdate(() => {
      this.loading = true;
    });

    const failSafe = setTimeout(() => {
      if (currentLoadToken !== this.loadToken || !this.loading) {
        return;
      }
      this.runUiUpdate(() => {
        if (currentLoadToken !== this.loadToken || !this.loading) {
          return;
        }
        this.loading = false;
        this.toastr.error('Loading order is taking too long. Please check API health.', 'Error');
      });
    }, 20000);

    this.stockService.getOrderById(this.countStockId)
      .pipe(
        timeout(10000),
        catchError((err) => of({ __loadError: err })),
        finalize(() => {
          clearTimeout(failSafe);
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }
            this.loading = false;
          });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }

            if (res?.__loadError) {
              const fallback = this.isTimeoutError(res.__loadError)
                ? 'Loading order timed out. Please try again.'
                : 'Failed to load order.';
              this.toastr.error(this.extractError(res.__loadError, fallback), 'Error');
              return;
            }

            const order = this.pickData<any>(res);
            this.form.patchValue({
              postingDate: this.toDateInputValue(order?.postingDate),
              comment: order?.comment || '',
              mode: order?.mode || 'Counting',
              isDraft: String(order?.status || '').toLowerCase() === 'draft'
            });
          });
        },
        error: (err) => {
          this.runUiUpdate(() => {
            if (currentLoadToken !== this.loadToken) {
              return;
            }
            const fallback = this.isTimeoutError(err)
              ? 'Loading order timed out. Please try again.'
              : 'Failed to load order.';
            this.toastr.error(this.extractError(err, fallback), 'Error');
          });
        }
      });
  }

  private pickData<T>(res: any): T {
    if (res?.data?.data?.data) return res.data.data.data as T;
    if (res?.data?.data) return res.data.data as T;
    if (res?.data) return res.data as T;
    if (res?.Data?.Data?.Data) return res.Data.Data.Data as T;
    if (res?.Data?.Data) return res.Data.Data as T;
    if (res?.Data) return res.Data as T;
    return res as T;
  }

  private toDateInputValue(value: any): string {
    const date = new Date(value || new Date());
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatDateToISOString(date: string): string {
    return `${date}T00:00:00`;
  }

  private extractError(err: any, fallback: string): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    if (err?.message) return err.message;
    return fallback;
  }

  private isTimeoutError(err: any): boolean {
    return String(err?.name || '').toLowerCase() === 'timeouterror';
  }

  private runUiUpdate(action: () => void): void {
    setTimeout(() => {
      action();
      this.cdr.detectChanges();
    });
  }
}
