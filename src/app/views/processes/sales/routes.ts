import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [




      {
        path: 'add-item/:salesOrderId/:warehouseId',
        loadComponent: () => import('./add-item/add-item.component').then(m => m.AddItemComponent),
        data: {
          title: 'Add Item'
        }
      },
      {
        path: 'sales-order/:salesOrderId',
        loadComponent: () => import('./sales.component').then(m => m.SalesComponent),
        data: {
          title: 'Sales Order'
        }
      },
      {
        path: 'sales-items/:salesOrderId',
        loadComponent: () => import('./sales-items/sales-items.component').then(m => m.SalesItemsComponent),
        data: {
          title: 'Sales Items'
        }
      },
      {
        path: 'sales-form/:salesOrderId',
        loadComponent: () => import('./sales-form/sales-form.component').then(m => m.SalesFormComponent),
        data: {
          title: 'Create Sales'
        }
      }
      ,

      {
        path: 'sales-return-order/:salesOrderId',
        loadComponent: () => import('./sales-return/sales-return.component').then(m => m.SalesReturnComponent),
        data: {
          title: 'Sales Return Order'
        }
      },

      {
        path: 'sales-batches/:salesOrderId/:salesOrderItemId/:itemQuantity',
        loadComponent: () => import('./sales-batches/sales-batches.component').then(m => m.SalesBatchesComponent),
        data: {
          title: 'Sales Batches'
        }
      },

      {
        path: 'return-batches/:returnOrderItemId/:salesOrderId/:itemQuantity',
        loadComponent: () => import('./sales-return/batches/batches.component').then(m => m.BatchesComponent),
        data: {
          title: 'Return Batches'
        }
      },


      {
        path: ':warehouseId',
        loadComponent: () => import('./sales.component').then(m => m.SalesComponent),
        data: {
          title: 'Sales'
        }
      },
    ]
  }
];

