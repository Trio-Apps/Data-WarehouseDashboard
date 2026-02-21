import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [
      //
     
      {
        path: ':warehouseId',
        loadComponent: () => import('./purchases.component').then(m => m.PurchasesComponent),
        data: {
          title: 'Purchases'
        }
      },
      {
        path: 'purchase-form/:warehouseId',
        loadComponent: () => import('./purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent),
        data: {
          title: 'Purchase Form'
        }
      },
      {
        path: 'purchase-form/:warehouseId/:purchaseOrderId',
        loadComponent: () => import('./purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent),
        data: {
          title: 'Edit Purchase'
        }
      },
      {
        path: 'purchase-items/:purchaseOrderId',
        loadComponent: () => import('./purchase-items/purchase-items.component').then(m => m.PurchaseItemsComponent),
        data: {
          title: 'Purchase Items'
        }
      },
      {
        path: 'add-item/:purchaseOrderId/:warehouseId',
        loadComponent: () => import('./add-item/add-item.component').then(m => m.AddItemComponent),
        data: {
          title: 'Add Item'
        }
      },
      {
        path: 'receipt-order/:purchaseOrderId/:receiptOrderId',
        loadComponent: () => import('./receipt-order/receipt-order.component').then(m => m.ReceiptOrderComponent),
        data: {
          title: 'Receipt Order'
        }
      },
      {
        path: 'receipt-form/:purchaseOrderId',
        loadComponent: () => import('./receipt-order/receipt-form/receipt-form.component').then(m => m.ReceiptFormComponent),
        data: { 
          title: 'Create Receipt'
        }
      },
      {
        path: 'receipt-form/:purchaseOrderId/:receiptId',
        loadComponent: () => import('./receipt-order/receipt-form/receipt-form.component').then(m => m.ReceiptFormComponent),
        data: {
          title: 'Edit Receipt'
        }
      },
      {
        path: 'add-receipt-item/:purchaseOrderId/:receiptId',
        loadComponent: () => import('./receipt-order/add-receipt-item/add-receipt-item.component').then(m => m.AddReceiptItemComponent),
        data: {
          title: 'Add Receipt Item'
        }
      },
       {
        path: 'receipt-orders/:warehouseId',
        loadComponent: () => import('./receipt-order/receipt-orders/receipt-orders.component').then(m => m.ReceiptOrdersComponent),
        data: {
          title: 'Receipt Orders'
        }
      },
       {
        path: 'receipt-batches/:purchaseOrderId/:receiptOrderId/:receiptItemId/:itemQuentity',
        loadComponent: () => import('./receipt-order/receipt-batches/receipt-batches.component').then(m => m.ReceiptBatchesComponent),
        data: {
          title: 'Receipt Batches'
        }
      }
      ,
      {
        path: 'goods-return-orders/:warehouseId',
        loadComponent: () => import('./goods-return/goods-return-orders/goods-return-orders.component').then(m => m.GoodsReturnOrdersComponent),
        data: {
          title: 'Goods Return Orders'
        }
      },
    
      {
        path: 'goods-return-order/:purchaseOrderId/:receiptId/:goodsReturnId',
        loadComponent: () => import('./goods-return/goods-return.component').then(m => m.GoodsReturnComponent),
        data: {
          title: 'Goods Return Order'
        }
      },
      {
        path: 'goods-return-form/:purchaseOrderId/:receiptId',
        loadComponent: () => import('./goods-return/goods-return-form/goods-return-form.component').then(m => m.GoodsReturnFormComponent),
        data: {
          title: 'Create Goods Return'
        }
      },
      {
        path: 'goods-return-form/:purchaseOrderId/:receiptId/:goodsReturnId',
        loadComponent: () => import('./goods-return/goods-return-form/goods-return-form.component').then(m => m.GoodsReturnFormComponent),
        data: {
          title: 'Edit Goods Return'
        }
      },
      {
        path: 'add-goods-return-item/:goodsReturnId/:purchaseOrderId/:receiptOrderId/:warehouseId',
        loadComponent: () => import('./goods-return/add-goods-return-item/add-goods-return-item.component').then(m => m.AddGoodsReturnItemComponent),
        data: {
          title: 'Add Goods Return Item'
        }
      },
     
      {
        path: 'return-batches/:returnOrderItemId/:receiptOrderId/:purchaseOrderId/:itemQuentity',
        loadComponent: () => import('./goods-return/batches/batches.component').then(m => m.BatchesComponent),
        data: {
          title: 'Return Batches'
        }
      }
    ]
  }
];

