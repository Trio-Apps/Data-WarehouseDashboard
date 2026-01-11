import { Routes } from '@angular/router';

export const routes: Routes = [
 
{
  path: '',
  data: {
      title: 'Company'
    },
  children: [
    {
      path: '',
      redirectTo: 'companies',
      pathMatch: 'full'
    },
    {
      path: 'companies',
      loadComponent: () => import('./companies/companies.component')
        .then(m => m.CompaniesComponent), data: {
          title: 'Companies'
        },
    }
  ]
}

];



