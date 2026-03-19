import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalModule,
  ButtonModule,
  FormModule,
  GridModule,
  TableModule
} from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { SalesService } from '../Services/sales.service';
import { Customer } from '../Models/sales-model';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-search-customer-modal',
  imports: [
    CommonModule,
    ModalModule,
    ButtonModule,
    FormModule,
    GridModule,
    TableModule,
    TranslatePipe
  ],
  templateUrl: './search-customer-modal.component.html',
  styleUrl: './search-customer-modal.component.scss',
})
export class SearchCustomerModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() customerSelected = new EventEmitter<Customer>();
  @Output() clearSelected = new EventEmitter<void>();

  customerModalLoading: boolean = false;
  customerModalCode: string = '';
  customerModalName: string = '';
  customerModalCustomers: Customer[] = [];
  customerModalCurrentPage: number = 1;
  customerModalItemsPerPage: number = 10;
  customerModalTotalPages: number = 0;
  customerModalTotalItems: number = 0;
  customerModalHasNext: boolean = false;
  customerModalHasPrevious: boolean = false;
  Math = Math;

  constructor(
    private salesService: SalesService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnChanges(): void {
    if (this.visible) {
      this.loadCustomers(1);
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
  }

  onSearch(): void {
    this.loadCustomers(1);
  }

  loadCustomers(page: number = this.customerModalCurrentPage): void {
    const safePage = page < 1 ? 1 : page;

    this.customerModalLoading = true;
    this.cdr.detectChanges();

    this.salesService.getCustomersPaged(
      safePage,
      this.customerModalItemsPerPage,
      this.customerModalCode || undefined,
      this.customerModalName || undefined
    ).subscribe({
      next: (res: any) => {
        const data = res?.data ?? {};
        const rawCustomers = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        this.customerModalCustomers = rawCustomers
          .map((c: any) => this.mapCustomer(c))
          .filter((c: Customer) => !!c.customerId);

        const totalRecords = +(data?.totalRecords ?? data?.totalCount ?? data?.totalItems ?? 0);
        const pageSize = +(data?.pageSize ?? this.customerModalItemsPerPage);
        const totalPagesFromApi = +(data?.totalPages ?? 0);

        this.customerModalCurrentPage = safePage;
        this.customerModalItemsPerPage = pageSize > 0 ? pageSize : this.customerModalItemsPerPage;
        this.customerModalTotalItems = totalRecords > 0 ? totalRecords : 0;
        this.customerModalTotalPages = totalPagesFromApi > 0
          ? totalPagesFromApi
          : (this.customerModalTotalItems > 0
            ? Math.ceil(this.customerModalTotalItems / this.customerModalItemsPerPage)
            : (this.customerModalCustomers.length > 0 ? 1 : 0));

        this.customerModalHasNext = typeof data?.hasNext === 'boolean'
          ? data.hasNext
          : this.customerModalCurrentPage < this.customerModalTotalPages;
        this.customerModalHasPrevious = typeof data?.hasPrevious === 'boolean'
          ? data.hasPrevious
          : this.customerModalCurrentPage > 1;

        this.customerModalLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading paged customers:', err);
        this.customerModalLoading = false;
        this.customerModalCustomers = [];
        this.customerModalTotalItems = 0;
        this.customerModalTotalPages = 0;
        this.customerModalHasNext = false;
        this.customerModalHasPrevious = false;
        this.toastr.error('Failed to load customers. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    let targetPage = page;
    if (targetPage < 1) {
      targetPage = 1;
    }
    if (this.customerModalTotalPages > 0 && targetPage > this.customerModalTotalPages) {
      targetPage = this.customerModalTotalPages;
    }

    if (targetPage !== this.customerModalCurrentPage) {
      this.loadCustomers(targetPage);
    }
  }

  onNextPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.customerModalHasNext) {
      this.onPageChange(this.customerModalCurrentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.customerModalHasPrevious) {
      this.onPageChange(this.customerModalCurrentPage - 1, event);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    if (this.customerModalTotalPages <= 0) {
      return pages;
    }

    const maxVisible = 5;
    let start = Math.max(1, this.customerModalCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.customerModalTotalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSelectCustomer(customer: Customer): void {
    this.customerSelected.emit(customer);
    this.onVisibleChange(false);
  }

  onClearSelection(): void {
    this.clearSelected.emit();
    this.onVisibleChange(false);
  }

  private mapCustomer(c: any): Customer {
    return {
      customerId: c.customerId ?? c.id ?? c.CustomerId,
      customerName: c.customerName ?? c.name ?? c.CustomerName ?? '',
      customerCode: c.customerCode ?? c.code ?? c.CustomerCode ?? ''
    };
  }
}
