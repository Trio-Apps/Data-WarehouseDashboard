import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [
      {
        path: 'quantity-adjustment-stock-orders/:warehouseId',
        loadComponent: () =>
          import(
            '../transferred-request/quantity-adjustment-stock/quantity-adjustment-stock-orders/quantity-adjustment-stock-orders.component'
          ).then((m) => m.QuantityAdjustmentStockOrdersComponent),
        data: {
          title: 'Quantity Adjustment Stock Orders'
        }
      },
      {
        path: 'quantity-adjustment-stock-form/:warehouseId',
        loadComponent: () =>
          import(
            '../transferred-request/quantity-adjustment-stock/quantity-adjustment-stock-form/quantity-adjustment-stock-form.component'
          ).then((m) => m.QuantityAdjustmentStockFormComponent),
        data: {
          title: 'Create Quantity Adjustment Stock'
        }
      },
      {
        path: 'quantity-adjustment-stock-form/:warehouseId/:quantityAdjustmentStockId',
        loadComponent: () =>
          import(
            '../transferred-request/quantity-adjustment-stock/quantity-adjustment-stock-form/quantity-adjustment-stock-form.component'
          ).then((m) => m.QuantityAdjustmentStockFormComponent),
        data: {
          title: 'Edit Quantity Adjustment Stock'
        }
      },
      {
        path: 'quantity-adjustment-stock/:quantityAdjustmentStockId',
        loadComponent: () =>
          import('../transferred-request/quantity-adjustment-stock/quantity-adjustment-stock.component').then(
            (m) => m.QuantityAdjustmentStockComponent
          ),
        data: {
          title: 'Quantity Adjustment Stock'
        }
      },
      {
        path: 'add-quantity-adjustment-stock-item/:quantityAdjustmentStockId/:warehouseId',
        loadComponent: () =>
          import(
            '../transferred-request/quantity-adjustment-stock/add-quantity-adjustment-stock-item/add-quantity-adjustment-stock-item.component'
          ).then((m) => m.AddQuantityAdjustmentStockItemComponent),
        data: {
          title: 'Add Quantity Adjustment Stock Item'
        }
      }
    ]
  }
];
