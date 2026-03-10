import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ButtonModule,
  CardModule,
  FormModule,
  GridModule,
  TableModule
} from '@coreui/angular';
import { InquiryService } from '../../Services/inquiry.service';
import { InWarehouseReportItem } from '../../Models/report.model';

@Component({
  selector: 'app-in-warehouse-report',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    TableModule
  ],
  templateUrl: './in-warehouse-report.component.html',
  styleUrl: './in-warehouse-report.component.scss'
})
export class InWarehouseReportComponent implements OnInit {
  form!: FormGroup;
  warehouseId: number | null = null;
  rows: InWarehouseReportItem[] = [];
  loading = false;
  errorMessage = '';

  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 0;
  totalItems = 0;
  hasNext = false;
  hasPrevious = false;
  Math = Math;
  readonly pageSizeOptions = [10, 20, 50, 100];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private inquiryService: InquiryService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      itemCodeOrName: [''],
      showItemsWithNoQuantityInStock: [false]
    });
  }

  ngOnInit(): void {
    const rawWarehouseId = Number(this.route.snapshot.paramMap.get('warehouseId'));
    if (!Number.isFinite(rawWarehouseId) || rawWarehouseId <= 0) {
      this.errorMessage = 'Invalid warehouse id';
      return;
    }

    this.warehouseId = rawWarehouseId;
    this.loadReport();
  }

  loadReport(): void {
    if (!this.warehouseId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.form.value;

    this.inquiryService
      .getInWarehouseReport({
        warehouseId: this.warehouseId,
        pageNumber: this.currentPage,
        pageSize: this.itemsPerPage,
        itemCodeOrName: (formValue.itemCodeOrName || '').trim() || undefined,
        showItemsWithNoQuantityInStock: !!formValue.showItemsWithNoQuantityInStock
      })
      .subscribe({
        next: (res) => {
          const paged = res?.data;
          this.rows = paged?.data ?? [];

          this.currentPage = Number(paged?.pageNumber ?? this.currentPage);
          this.itemsPerPage = Number(paged?.pageSize ?? this.itemsPerPage);
          this.totalItems = Number(paged?.totalRecords ?? 0);
          if (this.totalItems <= 0 && this.rows.length > 0) {
            this.totalItems = this.rows.length;
          }

          const totalPagesFromApi = Number(paged?.totalPages ?? 0);
          this.totalPages =
            totalPagesFromApi > 0
              ? totalPagesFromApi
              : (this.itemsPerPage > 0 ? Math.ceil(this.totalItems / this.itemsPerPage) : 0);
          if (this.totalPages <= 0 && this.rows.length > 0) {
            this.totalPages = 1;
          }

          this.hasPrevious = typeof paged?.hasPrevious === 'boolean'
            ? paged.hasPrevious
            : this.currentPage > 1;

          this.hasNext = typeof paged?.hasNext === 'boolean'
            ? paged.hasNext
            : this.currentPage < this.totalPages;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.rows = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.hasNext = false;
          this.hasPrevious = false;
          this.loading = false;
          this.errorMessage = err?.error?.message || 'Failed to load in-warehouse report';
          this.cdr.detectChanges();
        }
      });
  }

  onSubmit(): void {
    this.currentPage = 1;
    this.loadReport();
  }

  onReset(): void {
    this.form.reset({
      itemCodeOrName: '',
      showItemsWithNoQuantityInStock: false
    });
    this.currentPage = 1;
    this.loadReport();
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const maxPage = this.totalPages > 0 ? this.totalPages : 1;
    if (page < 1 || page > maxPage || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadReport();
  }

  onPageSizeChange(value: string): void {
    const newSize = Number(value);
    if (!Number.isFinite(newSize) || newSize <= 0 || newSize === this.itemsPerPage) {
      return;
    }

    this.itemsPerPage = newSize;
    this.currentPage = 1;
    this.loadReport();
  }

  onNextPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasNext) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  onPreviousPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasPrevious) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPage = this.totalPages > 0 ? this.totalPages : (this.rows.length > 0 ? 1 : 0);
    if (maxPage <= 0) {
      return pages;
    }

    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(maxPage, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
