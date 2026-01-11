import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Users'
    },
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users.component').then(m => m.UsersComponent),
        data: {
          title: 'Users Management'
        }
      }
    ]
  }
];

