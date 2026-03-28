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
    path: 'transferred-request',
    loadChildren: () => import('./transferred-request').then((m) => m.routes)
  },
  {
    path: 'quantity-adjustment-stock',
    loadChildren: () => import('./quantity-adjustment-stock').then((m) => m.routes)
  },
  {
    path: 'approval-process',
    loadChildren: () => import('./approval-process/routes').then((m) => m.routes)
  },
  {
    path: 'reasons',
    loadChildren: () => import('./reasons').then((m) => m.routes)
  },
  {
    path: 'production',
    loadChildren: () => import('./production/routes').then((m) => m.routes)
  },
  {
    path: 'stock-counting',
    loadChildren: () => import('./stock-counting/routes').then((m) => m.routes)
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
  {
    path: 'search-scan',
    loadComponent: () => import('./Scan/search-scan/search-scan.component').then(m => m.SearchScanComponent),
    data: {
      title: 'Search & Scan'
    }
  }
];
