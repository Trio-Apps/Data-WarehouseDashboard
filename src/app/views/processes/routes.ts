import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [
      {
        path: 'item-processes/:itemId',
        loadComponent: () => import('./item-processes/item-processes.component').then(m => m.ItemProcessesComponent),
        data: {
          title: 'Item Processes'
        }
      },
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
      }
    ]
  }
];

