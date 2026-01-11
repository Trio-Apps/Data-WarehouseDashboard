import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Roles'
    },
    children: [
      {
        path: '',
        redirectTo: 'roles',
        pathMatch: 'full'
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles.component').then(m => m.RolesComponent),
        data: {
          title: 'Roles Management'
        }
      }
    ]
  }
];

