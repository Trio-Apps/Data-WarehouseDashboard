import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Production'
    },
    children: [
      {
        path: 'menu',
        loadComponent: () => import('./menu/production-menu.component').then((m) => m.ProductionMenuComponent),
        data: {
          title: 'Production Menu'
        }
      },
      {
        path: 'menu/:warehouseId',
        loadComponent: () => import('./menu/production-menu.component').then((m) => m.ProductionMenuComponent),
        data: {
          title: 'Production Menu'
        }
      },
      {
        path: 'orders/:warehouseId',
        loadComponent: () => import('./orders/production-orders.component').then((m) => m.ProductionOrdersComponent),
        data: {
          title: 'View Production Orders'
        }
      },
      {
        path: 'bulk/:warehouseId',
        loadComponent: () => import('./bulk-orders/bulk-orders.component').then((m) => m.BulkOrdersComponent),
        data: {
          title: 'Bulk Production Orders'
        }
      },
      {
        path: 'order-form/:warehouseId',
        loadComponent: () => import('./order-form/production-order-form.component').then((m) => m.ProductionOrderFormComponent),
        data: {
          title: 'Production Orders'
        }
      },
      {
        path: 'order-form/:warehouseId/:productionOrderId',
        loadComponent: () => import('./order-form/production-order-form.component').then((m) => m.ProductionOrderFormComponent),
        data: {
          title: 'Production Orders'
        }
      },
      {
        path: 'order-items/:warehouseId/:productionOrderId',
        loadComponent: () => import('./production-items/production-items.component').then((m) => m.ProductionItemsComponent),
        data: {
          title: 'Production Items'
        }
      },
      {
        path: 'header-batches/:warehouseId/:productionOrderId',
        loadComponent: () => import('./header-batches/production-header-batches.component').then((m) => m.ProductionHeaderBatchesComponent),
        data: {
          title: 'Production Header Batches'
        }
      },
      {
        path: 'header-batches/:warehouseId/:productionOrderId/:itemQuantity',
        loadComponent: () => import('./header-batches/production-header-batches.component').then((m) => m.ProductionHeaderBatchesComponent),
        data: {
          title: 'Production Header Batches'
        }
      }
    ]
  }
];
