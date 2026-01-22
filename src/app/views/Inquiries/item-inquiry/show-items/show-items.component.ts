import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  TableModule,
  CardModule,
  ButtonModule,
  FormModule,
  
  GridModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { InquiryService } from '../../Services/inquiry.service';
import { Item } from '../../Models/item.model';

@Component({
  selector: 'app-show-items',
  imports: [
    CommonModule,
    ReactiveFormsModule,

    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconDirective
  ],
  templateUrl: './show-items.component.html',
  styleUrl: './show-items.component.scss',
})
export class ShowItemsComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  items: Item[] = [];
  filteredItems: Item[] = [];
  warehouseId: number | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  itemName:string = '';
  itemCode:string = '';
  // Expose Math to template
  Math = Math;

  // Subscriptions
  private queryParamsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private inquiryService: InquiryService,
      private cdr: ChangeDetectorRef   // 👈 مهم


  ) {
    this.form = this.fb.group({
      itemName1: [''],
      itemName2: ['']
    });
  }

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;

    // Read pagination from URL query params
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 10;

      this.currentPage = page >= 1 ? page : 1;
      this.itemsPerPage = pageSize >= 1 ? pageSize : 10;

      this.loadItems();
    });

    
     

  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadItems(): void {
    if (this.warehouseId) {
       

      const skip = (this.currentPage);
            this.inquiryService.getItemsByWarehouseIdWithItemCodeAndName(this.warehouseId,this.itemCode,this.itemName, skip, this.itemsPerPage).subscribe({
        next: (res: any) => {
          console.log(res);

          // Extract data from response
          if (res.data) {
            this.items = res.data.data.map((e: any) => ({
              itemId: e.itemId,
              itemName: e.itemName,
              itemCode: e.itemCode,
              inStock: e.inStock,
              warehouseCode: e.warehouseCode,
              salesPrice: e.salesPrice,
              purchasePrice: e.purchasePrice,
              updateDate: e.updateDate
            }));

            this.filteredItems = this.items;
            this.loading = false


            // Get pagination info from backend
            this.currentPage = res.data.pageNumber || this.currentPage;
            this.itemsPerPage = res.data.pageSize || this.itemsPerPage;
            this.totalPages = res.data.totalPages || 0;
            this.totalItems = res.data.totalRecords || 0;
            this.hasNext = res.data.hasNext || false;
            this.hasPrevious = res.data.hasPrevious || false;
             this.cdr.detectChanges(); // ✅

            // console.log('Pagination Info:', {
            //   currentPage: this.currentPage,
            //   itemsPerPage: this.itemsPerPage,
            //   totalPages: this.totalPages,
            //   totalItems: this.totalItems,
            //   hasNext: this.hasNext,
            //   hasPrevious: this.hasPrevious
            // });

          }


        },
        error: (err) => {
          console.error('Error loading items:', err);
          this.loading = false;
          this.items = [];
          this.filteredItems = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.hasNext = false;
          this.hasPrevious = false;
        }
      });
    }
  }

  // generateSampleData(): Item[] {
  //   // Sample data for demonstration
  //   return Array.from({ length: 25 }, (_, i) => ({
  //     warehouseId: this.warehouseId || 1,
  //     warehouseName: `Warehouse ${this.warehouseId || 1}`,
  //     itemId: i + 1,
  //     itemName: `Item ${i + 1}`,
  //     quantity: Math.floor(Math.random() * 100),
  //     price: Math.floor(Math.random() * 1000)
  //   } as any));
  // }

  get paginatedItems(): Item[] {
    // Items are already paginated from server
         
    return this.filteredItems;
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
     this.loading = true;
     this.cdr.detectChanges(); // ✅

    // Validate page number
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;

    if (page !== this.currentPage) {
      // Update URL with new page - this will trigger queryParams subscription and loadItems
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: page, pageSize: this.itemsPerPage },
        queryParamsHandling: 'merge'
      });
    }
  }

  onNextPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasNext) {
      this.onPageChange(this.currentPage + 1, event);
    }
  }

  onPreviousPage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.hasPrevious) {
      this.onPageChange(this.currentPage - 1, event);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
   // console.log(start,end);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
   // this.cdr.detectChanges(); // ✅

    return pages;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      this.cdr.detectChanges(); // ✅

      const formValue = this.form.value;
      this.itemCode=formValue.itemName1;
      this.itemName=formValue.itemName2;

      this.loadItems();
      console.log('Form submitted:', formValue);
      // Add your submit logic here
    }
  }

  onDetails(itemId: number): void {
    this.router.navigate(['/processes/item-barcodes', itemId]);
  }
}
