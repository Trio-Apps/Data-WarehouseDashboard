import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Barcodes'
    },
    children: [
      {
        path: '',
        redirectTo: 'barcodes',
        pathMatch: 'full'
      },
      {
        path: 'barcodes',
        loadComponent: () => import('./barcodes/barcodes.component').then(m => m.BarcodesComponent),
        data: {
          title: 'Barcode Settings Management'
        }
      }
    ]
  }
];

