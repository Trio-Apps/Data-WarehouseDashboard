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
import { ToastrService } from 'ngx-toastr';
import { GoodsReturnService } from '../Services/goods-return.service';
import { Return, ReturnItem } from '../Models/retrun-model';
import { EditReturnItemModalComponent } from './edit-return-item-modal/edit-return-item-modal.component';
import { EditGoodReturnComponent } from './edit-good-return/edit-good-return.component';

@Component({
  selector: 'app-goods-return',
    standalone: true,
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
    EditReturnItemModalComponent,
    EditGoodReturnComponent
    
  ],
  templateUrl: './goods-return.component.html',
  styleUrl: './goods-return.component.scss',
})
export class GoodsReturnComponent implements OnInit {
  receiptOrderId: number = 0;
  purchaseOrderId: number = 0;
  return: Return | null = null;
  returnItems: ReturnItem[] = [];
  loading: boolean = true;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  selectedReturn: Return | null = null;
  showEditReturnModal : boolean = false;
  selectedItem: ReturnItem | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private returnService: GoodsReturnService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.receiptOrderId = +this.route.snapshot.paramMap.get('receiptId')!;
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    if (this.receiptOrderId) {
      this.loadreturn();
    }

    // إعادة تحميل البيانات عند العودة من صفحة أخرى
    this.route.params.subscribe(params => {
      const newreceiptOrderId = +params['receiptId'];
      if (newreceiptOrderId && newreceiptOrderId === this.receiptOrderId) {
        this.loadreturn();
      }
    });
  }

  loadreturn(): void {
    this.loading = true;
   // console.log("receipt id",this.receiptOrderId);
    this.returnService.getReturnByReceiptId(this.receiptOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.return = res.data;
                    this.cdr.detectChanges();
         // console.log("return",this.return);
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }
          // تحميل عناصر الـ return
          if (this.return?.goodsReturnOrderId) {
           // console.log("return id",this.return.goodsReturnOrderId);
            this.loadreturnItems(this.return.goodsReturnOrderId);
          } else {
            this.returnItems = [];
            this.loading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.return = null;
          this.returnItems = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
       // console.error('Error loading return:', err);
        // إذا لم يكن هناك return، هذا طبيعي
        if (err.status === 404) {
          this.return = null;
          this.returnItems = [];
        } else {
          this.toastr.error('Failed to load return. Please try again.', 'Error');
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadreturnItems(returnId: number): void {

    this.returnService.getReturnItemsByReturnId(returnId).subscribe({
      next: (res: any) => {
          console.log("return items",res); 
        if (res.data) {
          this.returnItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } else {
          this.returnItems = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
       // console.error('Error loading return items:', err);
        this.returnItems = [];
        this.loading = false;
        this.toastr.error('Failed to load return items. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  onAddReturn(): void {
    this.router.navigate(['/processes/return-form', this.receiptOrderId]);
  }



  onAddItem(): void {
    if (this.return?.returnReceiptOrderId) {
      // returnReceiptOrderId هو الـ return ID، و receiptOrderId هو returnReceiptOrderId
      this.router.navigate(['/processes/add-return-item', this.return.returnReceiptOrderId, this.receiptOrderId]);
    } else {
      this.toastr.warning('Please create return first', 'Warning');
    }
  }

  onEditItem(item: ReturnItem): void {
    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

 onEditReturn(): void {
    if (!this.return) {
    console.warn('return is undefined!');
    return;
    }
console.log("editing return",this.return);
  this.selectedReturn = { ...this.return };
  this.showEditReturnModal = true;
  }
  onItemUpdated(): void {
    //  console.log("reloading items",this.return);

    if (this.return?.goodsReturnOrderId) {
      console.log("reloading items");
      this.loadreturnItems(this.return.goodsReturnOrderId);
    }

  }


   onReturnUpdated(): void {
    //  console.log("reloading items",this.return);

    if (this.receiptOrderId) {
      console.log("reloading items");
      this.loadreturn();
    }

  }

  onViewBatches(item: ReturnItem): void {
    if (item.goodsReturnOrderItemId) {
      console.log("inside")
      this.router.navigate(['/processes/return-batches',item.goodsReturnOrderItemId, this.receiptOrderId,this.purchaseOrderId, item.quantity]);
    }
  }

  onRemoveItem(item: ReturnItem): void {
    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the return?`)) {
      if (item.goodsReturnOrderItemId) {
        this.returnService.deleteReturnItem(item.goodsReturnOrderItemId||0).subscribe({
          next: (res) => {
            this.toastr.success('Item removed successfully', res);
             
            if (item.goodsReturnOrderId) {
              this.loadreturnItems(item.goodsReturnOrderId);
              this.cdr.detectChanges();
            }

            this.cdr.detectChanges();
          },
          error: (err) => {
           // console.error('Error removing item:', err);
            const errorMessage = err.error?.message || 'Error removing item. Please try again.';
            this.toastr.error(errorMessage, 'Error');
          }
        });
      }
    }
  }

  onBackToReceipts(): void {
    if (this.purchaseOrderId) {
      this.router.navigate(['/processes/receipt-order', this.purchaseOrderId]);
    } 
  }

  getTotalQuantity(): number {
    return this.returnItems.reduce((total, item) => total + item.quantity, 0);
  }
  
  getStatusBadgeClass(returnDto: Return | null): string {

    switch (returnDto?.status) {
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


getStatusText(returnDto: Return | null): string {
  return returnDto?.status || '';
}


}
