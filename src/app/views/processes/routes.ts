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
 
];

