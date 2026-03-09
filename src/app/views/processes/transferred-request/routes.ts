import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [
      {
        path: 'transferred-request-form/:warehouseId',
        loadComponent: () =>
          import('./transferred-request-form/transferred-request-form.component').then(
            (m) => m.TransferredRequestFormComponent
          ),
        data: {
          title: 'Create Transferred Request'
        }
      },
      {
        path: 'transferred-request-form/:warehouseId/:transferredRequestId',
        loadComponent: () =>
          import('./transferred-request-form/transferred-request-form.component').then(
            (m) => m.TransferredRequestFormComponent
          ),
        data: {
          title: 'Edit Transferred Request'
        }
      },
      {
        path: 'transferred-request-items/:transferredRequestId',
        loadComponent: () =>
          import('./transferred-request-items/transferred-request-items.component').then(
            (m) => m.TransferredRequestItemsComponent
          ),
        data: {
          title: 'Transferred Request Items'
        }
      },
      {
        path: 'add-item/:transferredRequestId/:warehouseId',
        loadComponent: () => import('./add-item/add-item.component').then((m) => m.AddItemComponent),
        data: {
          title: 'Add Item'
        }
      },
      {
        path: 'transferred-stock-orders/:warehouseId',
        loadComponent: () =>
          import('./transferred-stock/transferred-stock-orders/transferred-stock-orders.component').then(
            (m) => m.TransferredStockOrdersComponent
          ),
        data: {
          title: 'Transferred Stock Orders'
        }
      },
      {
        path: 'transferred-stock-form/:warehouseId/:transferredRequestId',
        loadComponent: () =>
          import('./transferred-stock/transferred-stock-form/transferred-stock-form.component').then(
            (m) => m.TransferredStockFormComponent
          ),
        data: {
          title: 'Create Transferred Stock'
        }
      },
      {
        path: 'transferred-stock-form/:warehouseId/:transferredRequestId/:transferredStockId',
        loadComponent: () =>
          import('./transferred-stock/transferred-stock-form/transferred-stock-form.component').then(
            (m) => m.TransferredStockFormComponent
          ),
        data: {
          title: 'Edit Transferred Stock'
        }
      },
      {
        path: 'transferred-stock/:transferredRequestId/:transferredStockId',
        loadComponent: () =>
          import('./transferred-stock/transferred-stock.component').then(
            (m) => m.TransferredStockComponent
          ),
        data: {
          title: 'Transferred Stock'
        }
      },
      {
        path: 'add-transferred-stock-item/:transferredRequestId/:transferredStockId/:warehouseId',
        loadComponent: () =>
          import('./transferred-stock/add-transferred-stock-item/add-transferred-stock-item.component').then(
            (m) => m.AddTransferredStockItemComponent
          ),
        data: {
          title: 'Add Transferred Stock Item'
        }
      },
      {
        path: 'transferred-stock-batches/:transferredRequestId/:transferredStockId/:transferredItemId/:itemQuantity',
        loadComponent: () =>
          import('./transferred-stock/transferred-stock-batches/transferred-stock-batches.component').then(
            (m) => m.TransferredStockBatchesComponent
          ),
        data: {
          title: 'Transferred Stock Batches'
        }
      },
      {
        path: ':warehouseId',
        loadComponent: () =>
          import('./transferred-request.component').then((m) => m.TransferredRequestComponent),
        data: {
          title: 'Transferred Requests'
        }
      }
    ]
  }
];
