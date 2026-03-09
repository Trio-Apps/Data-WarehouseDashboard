import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Stock Counting'
    },
    children: [
      {
        path: 'menu',
        loadComponent: () =>
          import('./menu/stock-counting-menu.component').then((m) => m.StockCountingMenuComponent),
        data: { title: 'Stock Counting Menu' }
      },
      {
        path: 'menu/:warehouseId',
        loadComponent: () =>
          import('./menu/stock-counting-menu.component').then((m) => m.StockCountingMenuComponent),
        data: { title: 'Stock Counting Menu' }
      },
      {
        path: 'orders/:warehouseId',
        loadComponent: () =>
          import('./orders/stock-counting-orders.component').then((m) => m.StockCountingOrdersComponent),
        data: { title: 'Stock Counting Orders' }
      },
      {
        path: 'order-form/:warehouseId',
        loadComponent: () =>
          import('./order-form/stock-counting-order-form.component').then((m) => m.StockCountingOrderFormComponent),
        data: { title: 'Stock Counting Order Form' }
      },
      {
        path: 'order-form/:warehouseId/:countStockId',
        loadComponent: () =>
          import('./order-form/stock-counting-order-form.component').then((m) => m.StockCountingOrderFormComponent),
        data: { title: 'Stock Counting Order Form' }
      },
      {
        path: 'order-items/:warehouseId/:countStockId',
        loadComponent: () =>
          import('./items/stock-counting-items.component').then((m) => m.StockCountingItemsComponent),
        data: { title: 'Stock Counting Items' }
      },
      {
        path: 'batches/:warehouseId/:countStockId/:countStockItemId',
        loadComponent: () =>
          import('./batches/stock-counting-batches.component').then((m) => m.StockCountingBatchesComponent),
        data: { title: 'Stock Counting Batches' }
      }
    ]
  }
];
