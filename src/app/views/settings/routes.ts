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
      },
      {
        path: 'language',
        loadComponent: () => import('./language/language-settings.component')
          .then(m => m.LanguageSettingsComponent),
        data: {
          title: 'Language'
        }
      },
      {
        path: 'sync-reset',
        loadComponent: () => import('../sync/sync.component')
          .then(m => m.SyncComponent),
        data: {
          title: 'SAP Sync Reset'
        }
      }
    ]
  }
];

