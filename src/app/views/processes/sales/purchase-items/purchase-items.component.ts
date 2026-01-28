import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
import { Purchase, PurchaseItem } from '../Models/purchase.model';
import { EditItemModalComponent } from '../edit-item-modal/edit-item-modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-purchase-items',
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ButtonModule,
    FormModule,
    GridModule,
    UtilitiesModule,
    IconDirective,
    EditItemModalComponent
  ],
  templateUrl: './purchase-items.component.html',
  styleUrl: './purchase-items.component.scss',
})
export class PurchaseItemsComponent implements OnInit {
  purchaseOrderId: number = 0;
  purchase: Purchase | null = null;
  items: PurchaseItem[] = [];
  loading: boolean = true;
  isDraft:boolean=false;
  warehouseId: number = 0;
  showEditItemModal: boolean = false;
  selectedItem: PurchaseItem | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // getPurchaseById
    this.purchaseOrderId = +this.route.snapshot.paramMap.get('purchaseOrderId')!;
    //console.log(this.purchaseOrderId);
    if (this.purchaseOrderId) {
      this.loadItemsPurchase();
      this.loadPurchase();
    }

    // إعادة تحميل البيانات عند العودة من صفحة أخرى
    this.route.params.subscribe(params => {
      const newPurchaseOrderId = +params['purchaseOrderId'];
      if (newPurchaseOrderId && newPurchaseOrderId === this.purchaseOrderId) {
        // إعادة تحميل البيانات عند العودة
        this.loadItemsPurchase();
        this.loadPurchase();
      }
    });
  }

  loadItemsPurchase(): void {
    this.loading = true;
    this.purchaseService.getItemsbyPurchaseId(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.purchase = res.data;
          console.log(res.data);
          this.items = res.data.data || [];
          console.log(this.items );

          // حفظ warehouseId إذا كان موجوداً في البيانات
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }

          if (res.meta == 'Draft') {
            this.isDraft = true;
          }

          this.loadPurchase();
          this.toastr.success(`Loaded purchase with ${this.items.length} items`, 'Success');         
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase:', err);
        this.loading = false;
        this.toastr.error('Failed to load purchase. Please try again.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

 
 loadPurchase(): void {
    this.purchaseService.getPurchaseById(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.purchase = res.data;
     
          if (res.data.warehouseId) {
            this.warehouseId = res.data.warehouseId;
          }
           this.cdr.detectChanges();
          console.log("by id",this.purchase?.warehouseId);
          this.toastr.success(`Loaded purchase with ${this.items.length} items`, 'Success');         
        }
      },
      error: (err) => { 
      }
    });
  }
  onAddItem(): void {
    if (this.isDraft) {
      if (!this.warehouseId && this.purchase?.warehouseId) {
        this.warehouseId = this.purchase.warehouseId;
      }
      if (this.warehouseId) {
        // الانتقال لصفحة إضافة العنصر
        this.router.navigate(['/processes/add-item', this.purchaseOrderId, this.warehouseId]);
      } else {
        this.toastr.error('Warehouse ID is not available. Please refresh the page.', 'Error');
      }
    } else {
      this.toastr.warning('Cannot add items to finalized purchases', 'Warning');
   }
  }

  onEditItem(item: PurchaseItem): void {
    if (!this.isDraft) {
      this.toastr.warning('Cannot edit items in finalized purchases', 'Warning');
      return;
    }

    this.selectedItem = { ...item };
    this.showEditItemModal = true;
  }

  onItemUpdated(): void {
    this.loadItemsPurchase(); // Reload to show updated items
  }

  onRemoveItem(item: PurchaseItem): void {
    if (!this.isDraft) {
      this.toastr.warning('Cannot remove items from finalized purchases', 'Warning');
      return;
    }

    if (confirm(`Are you sure you want to remove "${item.itemName || 'this item'}" from the purchase?`)) {
      if (item.purchaseItemId) {
        this.purchaseService.removeItemFromPurchase(this.purchaseOrderId, item.purchaseItemId).subscribe({
          next: () => {
            this.toastr.success('Item removed successfully', 'Success');
            this.loadItemsPurchase();
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

  onFinalizePurchase(): void {
    if (confirm('Are you sure you want to finalize this purchase? This action cannot be undone.')) {
      this.purchaseService.finalizePurchase(this.purchaseOrderId).subscribe({
        next: () => {
          this.toastr.success('Purchase finalized successfully', 'Success');
          this.loadItemsPurchase(); // Reload to update status
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error finalizing purchase:', err);
          const errorMessage = err.error?.message || 'Error finalizing purchase. Please try again.';
          this.toastr.error(errorMessage, 'Error');
        }
      });
    }
  }

  onBackToPurchases(): void {
    if (this.warehouseId) {
      this.router.navigate(['/processes/purchases', this.warehouseId]);
    } else if (this.purchase?.warehouseId) {
      this.warehouseId = this.purchase.warehouseId;
      this.router.navigate(['/processes/purchases', this.warehouseId]);
    }
  }
            
  getTotalQuantity(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalValue(): number {
    // This would need pricing information from the API
    // For now, return 0
    return 0;
  }

  getStatusBadgeClass(purchase: Purchase): string {
    if (!purchase || !purchase.status) return 'badge bg-secondary';
    
    const status = purchase.status.toLowerCase();
    if (status === 'draft' || status.includes('draft')) {
      return 'badge bg-warning';
    } else if (status === 'finalized' || status.includes('final')) {
      return 'badge bg-success';
    } else if (status === 'pending' || status.includes('pending')) {
      return 'badge bg-info';
    } else {
      return 'badge bg-secondary';
    }
  }
}
