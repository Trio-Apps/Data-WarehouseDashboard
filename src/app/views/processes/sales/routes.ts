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
        path: 'sales-order/:warehouseId',
        loadComponent: () => import('./sales.component').then(m => m.SalesComponent),
        data: {
          title: 'Sales Order'
        }
      },
      {
        path: 'sales-items/:salesOrderId',
        loadComponent: () =>
          import('./sales-items/sales-items.component').then((m) => m.SalesItemsComponent),
        data: {
          title: 'Sales Items'
        }
      },
      {
        path: 'sales-form/:warehouseId/:salesOrderId',
        loadComponent: () => import('./sales-form/sales-form.component').then(m => m.SalesFormComponent),
        data: {
          title: 'Create Sales'
        }
      },
      {
        path: 'sales-return-orders/:warehouseId',
        loadComponent: () => import('./sales-return/sales-return-orders/sales-return-orders.component').then(m => m.SalesReturnOrdersComponent),
        data: {
          title: 'Sales Return Orders'
        }
      },
      {
        path: 'sales-return-order/:salesOrderId/:salesReturnId',
        loadComponent: () => import('./sales-return/sales-return.component').then(m => m.SalesReturnComponent),
        data: {
          title: 'Sales Return Order'
        }
      },
      {
        path: 'sales-return-order/:salesOrderId',
        loadComponent: () => import('./sales-return/sales-return.component').then(m => m.SalesReturnComponent),
        data: {
          title: 'Sales Return Order'
        }
      },
      {
        path: 'sales-return-form/:salesOrderId/:salesReturnId',
        loadComponent: () => import('./sales-return/sales-return-form/sales-return-form.component').then(m => m.SalesReturnFormComponent),
        data: {
          title: 'Edit Sales Return'
        }
      },
      {
        path: 'sales-return-form/:salesOrderId',
        loadComponent: () => import('./sales-return/sales-return-form/sales-return-form.component').then(m => m.SalesReturnFormComponent),
        data: {
          title: 'Create Sales Return'
        }
      },
      
      {
        path: 'add-sales-return-item/:salesReturnId/:salesOrderId/:warehouseId',
        loadComponent: () => import('./sales-return/add-sales-return-item/add-sales-return-item.component').then(m => m.AddSalesReturnItemComponent),
        data: {
          title: 'Add Sales Return Item'
        }
      },

      {
        path: 'delivery-note-orders/:warehouseId',
        loadComponent: () => import('./delivery-notes/delivery-note-orders/delivery-note-orders.component').then(m => m.DeliveryNoteOrdersComponent),
        data: {
          title: 'Delivery Note Orders'
        }
      },
      {
        path: 'delivery-note-order/:salesOrderId/:deliveryNoteId',
        loadComponent: () => import('./delivery-notes/delivery-notes.component').then(m => m.DeliveryNotesComponent),
        data: {
          title: 'Delivery Note Order'
        }
      },
      {
        path: 'delivery-note-order/:salesOrderId',
        loadComponent: () => import('./delivery-notes/delivery-notes.component').then(m => m.DeliveryNotesComponent),
        data: {
          title: 'Delivery Note Order'
        }
      },
      {
        path: 'delivery-note-form/:salesOrderId/:deliveryNoteId',
        loadComponent: () => import('./delivery-notes/delivery-note-form/delivery-note-form.component').then(m => m.DeliveryNoteFormComponent),
        data: {
          title: 'Edit Delivery Note'
        }
      },
      {
        path: 'delivery-note-form/:salesOrderId',
        loadComponent: () => import('./delivery-notes/delivery-note-form/delivery-note-form.component').then(m => m.DeliveryNoteFormComponent),
        data: {
          title: 'Create Delivery Note'
        }
      },
      {
        path: 'add-delivery-note-item/:deliveryNoteId/:salesOrderId/:warehouseId',
        loadComponent: () => import('./delivery-notes/add-delivery-note-item/add-delivery-note-item.component').then(m => m.AddDeliveryNoteItemComponent),
        data: {
          title: 'Add Delivery Note Item'
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
        path: 'return-batches/:salesOrderId/:salesReturnId/:returnOrderItemId/:itemQuantity',
        loadComponent: () => import('./sales-return/batches/batches.component').then(m => m.BatchesComponent),
        data: {
          title: 'Return Batches'
        }
      },
      {
        path: 'delivery-note-batches/:salesOrderId/:deliveryNoteId/:returnOrderItemId/:itemQuantity',
        loadComponent: () => import('./delivery-notes/batches/batches.component').then(m => m.BatchesComponent),
        data: {
          title: 'Delivery Note Batches'
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
