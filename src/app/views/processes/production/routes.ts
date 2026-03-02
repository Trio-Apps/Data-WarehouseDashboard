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
        path: 'component-batches/:warehouseId/:productionOrderId/:componentLineId',
        loadComponent: () =>
          import('./component-batches/production-component-batches.component').then((m) => m.ProductionComponentBatchesComponent),
        data: {
          title: 'Component Batches'
        }
      }
    ]
  }
];
