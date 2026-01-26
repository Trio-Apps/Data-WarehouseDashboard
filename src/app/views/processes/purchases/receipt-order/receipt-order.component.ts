import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import {
  TableModule,
  CardModule,
  ButtonModule,
  FormModule,
  GridModule,
  UtilitiesModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { PurchaseService } from '../Services/purchase.service';
import { EditReceiptItemModalComponent } from '../edit-receipt-item-modal/edit-receipt-item-modal.component';
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../Services/receipt.service';
import { Receipt, ReceiptItem } from '../Models/receipt';

@Component({
  selector: 'app-receipt-order',
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    UtilitiesModule,
    IconDirective,
    DatePipe,
    EditReceiptItemModalComponent
  ],
  templateUrl: './receipt-order.component.html',
  styleUrl: './receipt-order.component.scss',
})
export class ReceiptOrderComponent implements OnInit {
  purchaseOrderId: number = 0;
  receipt: Receipt | null = null;
  receiptItems: ReceiptItem[] = [];
  loading: boolean = true;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  selectedItem: ReceiptItem | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private receiptService: ReceiptService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    if (this.purchaseOrderId) {
      this.loadReceipt();
    }

    // إعادة تحميل البيانات عند العودة من صفحة أخرى
    this.route.params.subscribe(params => {
      const newPurchaseOrderId = +params['purchaseOrderId'];
      if (newPurchaseOrderId && newPurchaseOrderId === this.purchaseOrderId) {
        this.loadReceipt();
      }
    });
  }

  loadReceipt(): void {
    this.loading = true;
    this.receiptService.getReceiptByPurchaseId(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.receipt = res.data;
                    this.cdr.detectChanges();
         // console.log("receipt",this.receipt);
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }
          // تحميل عناصر الـ receipt
          if (this.receipt?.receiptPurchaseOrderId) {
            console.log("receipt id",this.receipt.receiptPurchaseOrderId);
            this.loadReceiptItems(this.receipt.receiptPurchaseOrderId);
          } else {
            this.receiptItems = [];
            this.loading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.receipt = null;
          this.receiptItems = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading receipt:', err);
        // إذا لم يكن هناك receipt، هذا طبيعي
        if (err.status === 404) {
          this.receipt = null;
          this.receiptItems = [];
        } else {
          this.toastr.error('Failed to load receipt. Please try again.', 'Error');
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReceiptItems(receiptId: number): void {

    this.receiptService.getReceiptItemsByReceiptId(receiptId).subscribe({
      next: (res: any) => {
          console.log("receipt items",res); 
        if (res.data) {
          this.receiptItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } else {
          this.receiptItems = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading receipt items:', err);
        this.receiptItems = [];
        this.loading = false;
        this.toastr.error('Failed to load receipt items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddReceipt(): void {
    this.router.navigate(['/processes/receipt-form', this.purchaseOrderId]);
  }

  onEditReceipt(): void {
      console.log("outside")
    if (this.receipt?.receiptPurchaseOrderId) {
      console.log("inside")
      this.router.navigate(['/processes/receipt-form', this.purchaseOrderId, this.receipt.receiptPurchaseOrderId]);
    }
  }

  onAddItem(): void {
    if (this.receipt?.receiptPurchaseOrderId) {
      // receiptPurchaseOrderId هو الـ receipt ID، و purchaseOrderId هو receiptPurchaseOrderId
      this.router.navigate(['/processes/add-receipt-item', this.receipt.receiptPurchaseOrderId, this.purchaseOrderId]);
    } else {
      this.toastr.warning('Please create receipt first', 'Warning');
    }
  }

  onEditItem(item: ReceiptItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  onItemUpdated(): void {
    if (this.receipt?.receiptPurchaseOrderId) {
      this.loadReceiptItems(this.receipt.receiptPurchaseOrderId);
    }
  }

  onViewBatches(item: ReceiptItem): void {
    if (item.receiptPurchaseOrderItemId) {
      this.router.navigate(['/processes/receipt-batches', item.receiptPurchaseOrderItemId, this.purchaseOrderId,item.quantity]);
    }
  }

  onRemoveItem(item: ReceiptItem): void {
    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the receipt?`)) {
      if (item.receiptPurchaseOrderItemId) {
        this.receiptService.deleteReceiptItem(item.receiptPurchaseOrderItemId).subscribe({
          next: (res) => {
            this.toastr.success('Item removed successfully', res);
             
            if (item.receiptPurchaseOrderId) {
              this.loadReceiptItems(item.receiptPurchaseOrderId);
              this.cdr.detectChanges();
            }

            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error removing item:', err);
            const errorMessage = err.error?.message || 'Error removing item. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onBackToPurchases(): void {
    if (this.warehouseId) {
      this.router.navigate(['/processes/purchases', this.warehouseId]);
    } else {
      // محاولة الحصول على warehouseId من الـ purchase
      this.purchaseService.getPurchaseById(this.purchaseOrderId).subscribe({
        next: (res: any) => {
          if (res.data?.warehouseId) {
            this.warehouseId = res.data.warehouseId;
            this.router.navigate(['/processes/purchases', this.warehouseId]);
          }
        },
        error: () => {
          this.router.navigate(['/processes/purchases']);
        }
      });
    }
  }

  getTotalQuantity(): number {
    return this.receiptItems.reduce((total, item) => total + item.quantity, 0);
  }
  
  getStatusBadgeClass(receipt: Receipt): string {
    switch (receipt.status) {
      case 'Draft':
        return 'badge bg-warning';
      case 'Processing':
        return 'badge bg-info';
      case 'Final':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }
getStatusText(receipt: Receipt): string {
  return receipt.status;
}
}
