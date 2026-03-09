import { Routes } from '@angular/router';
import { authGuard } from './Guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayoutComponent),
    data: {
      title: 'Home'
    },
    children: [
      {
        path: 'dashboard',
        canMatch: [authGuard],
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes)
      },
       {
        path: 'inquiries',
        canMatch: [authGuard],
        loadChildren: () => import('./views/Inquiries/routes').then((m) => m.routes)
      },
      {
        path: 'companies',
                canMatch: [authGuard],
        loadChildren: () => import('./views/companies/routes').then((m) => m.routes)
      },
      {
        path: 'theme',
        canMatch: [authGuard],
        loadChildren: () => import('./views/theme/routes').then((m) => m.routes)
      },
      {
        path: 'items',
        loadChildren: () => import('./views/Items/routes').then((m) => m.routes)
      },
      {
        path: 'users',
                canMatch: [authGuard],
        loadChildren: () => import('./views/users/routes').then((m) => m.routes)
      },
      {
        path: 'roles',
        loadChildren: () => import('./views/roles/routes').then((m) => m.routes)
      },
      {
        path: 'settings',
        canMatch: [authGuard],
        loadChildren: () => import('./views/settings/routes').then((m) => m.routes)
      },
      {
        path: 'barcodes',
        canMatch: [authGuard],
        loadChildren: () => import('./views/barcodes/routes').then((m) => m.routes)
      },
      {
        path: 'processes',
        canMatch: [authGuard],
        loadChildren: () => import('./views/processes/routes').then((m) => m.routes)
      },
      {
        path: 'production-header-batches',
        canMatch: [authGuard],
        loadComponent: () =>
          import('./views/processes/production/order-form/production-order-form.component').then(
            (m) => m.ProductionOrderFormComponent
          ),
        data: {
          title: 'Production Header Batches'
        }
      },
      {
        path: 'production-header-batches/:warehouseId',
        canMatch: [authGuard],
        loadComponent: () =>
          import('./views/processes/production/order-form/production-order-form.component').then(
            (m) => m.ProductionOrderFormComponent
          ),
        data: {
          title: 'Production Header Batches'
        }
      },
      {
        path: 'production-header-batches/:warehouseId/:productionOrderId',
        canMatch: [authGuard],
        loadComponent: () =>
          import('./views/processes/production/order-form/production-order-form.component').then(
            (m) => m.ProductionOrderFormComponent
          ),
        data: {
          title: 'Production Header Batches'
        }
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/icons/routes').then((m) => m.routes)
      },
  
      {
        path: 'widgets',
        loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      },
   
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes)
      }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./views/pages/register/register.component').then(m => m.RegisterComponent),
    data: {
      title: 'Register Page'
    }
  },
  { path: '**', redirectTo: 'dashboard' }
];
