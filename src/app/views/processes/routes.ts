import { Routes } from '@angular/router';

export const routes: Routes = [
   
  {
    path: 'sales',
    loadChildren: () => import('./sales/routes').then((m) => m.routes)
  },
  {
    path: 'purchases',
    loadChildren: () => import('./purchases/routes').then((m) => m.routes)
  },
  {
    path: 'approval-process',
    loadChildren: () => import('./approval-process/routes').then((m) => m.routes)
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
      },
];

