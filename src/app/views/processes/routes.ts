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

 
];

