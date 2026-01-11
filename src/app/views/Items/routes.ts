import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Items'
    },
    children: [
        {
        path: '',
        redirectTo: 'items',
        pathMatch: 'full'
      },
      {
        path: 'items',
        loadComponent: () => import('./items/items.component').then(m => m.ItemsComponent),
        data: {
          title: 'Items'
        }
      }
    ]
  }
];


