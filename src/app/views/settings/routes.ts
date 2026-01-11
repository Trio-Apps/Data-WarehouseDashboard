import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Settings'
    },
    children: [
      {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full'
      },
      {
        path: 'auth',
        loadComponent: () => import('./Auth/sap-auth-settings.component')
          .then(m => m.SapAuthSettingsComponent),
        data: {
          title: 'SAP Auth Settings'
        }
      }
    ]
  }
];

