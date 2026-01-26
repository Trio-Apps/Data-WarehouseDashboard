import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [

      {
        path: 'item-barcodes/:itemId',
        loadComponent: () => import('./item-barcodes/item-barcodes.component').then(m => m.ItemBarcodesComponent),
        data: {
          title: 'Item Barcodes'
        }
      },
      {
        path: 'dynamic-barcodes/:itemBarCodeId',
        loadComponent: () => import('./item-barcodes/dynamic/dynamic-barcodes/dynamic-barcodes.component').then(m => m.DynamicBarcodesComponent),
        data: {
          title: 'Dynamic Barcodes'
        }
      },
      {
        path: 'purchases/:warehouseId',
        loadComponent: () => import('./purchases/purchases.component').then(m => m.PurchasesComponent),
        data: {
          title: 'Purchases'
        }
      },
      {
        path: 'purchase-form/:warehouseId',
        loadComponent: () => import('./purchases/purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent),
        data: {
          title: 'Purchase Form'
        }
      },
      {
        path: 'purchase-form/:warehouseId/:purchaseOrderId',
        loadComponent: () => import('./purchases/purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent),
        data: {
          title: 'Edit Purchase'
        }
      },
      {
        path: 'purchase-items/:purchaseOrderId',
        loadComponent: () => import('./purchases/purchase-items/purchase-items.component').then(m => m.PurchaseItemsComponent),
        data: {
          title: 'Purchase Items'
        }
      },
      {
        path: 'add-item/:purchaseOrderId/:warehouseId',
        loadComponent: () => import('./purchases/add-item/add-item.component').then(m => m.AddItemComponent),
        data: {
          title: 'Add Item'
        }
      },
      {
        path: 'receipt-order/:purchaseOrderId',
        loadComponent: () => import('./purchases/receipt-order/receipt-order.component').then(m => m.ReceiptOrderComponent),
        data: {
          title: 'Receipt Order'
        }
      },
      {
        path: 'receipt-form/:purchaseOrderId',
        loadComponent: () => import('./purchases/receipt-form/receipt-form.component').then(m => m.ReceiptFormComponent),
        data: {
          title: 'Create Receipt'
        }
      },
      {
        path: 'receipt-form/:purchaseOrderId/:receiptId',
        loadComponent: () => import('./purchases/receipt-form/receipt-form.component').then(m => m.ReceiptFormComponent),
        data: {
          title: 'Edit Receipt'
        }
      },
      {
        path: 'add-receipt-item/:receiptId/:purchaseOrderId',
        loadComponent: () => import('./purchases/add-receipt-item/add-receipt-item.component').then(m => m.AddReceiptItemComponent),
        data: {
          title: 'Add Receipt Item'
        }
      },
      {
        path: 'receipt-batches/:receiptPurchaseOrderItemId/:purchaseOrderId/:itemQuentity',
        loadComponent: () => import('./purchases/receipt-batches/receipt-batches.component').then(m => m.ReceiptBatchesComponent),
        data: {
          title: 'Receipt Batches'
        }
      }
    ]
  }
];

